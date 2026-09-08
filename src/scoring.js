/**
 * Deterministic Drug Repurposing Scoring Engine v2
 *
 * Scores drug-disease pairs using 6 computational methods on live API data.
 * Zero LLM involvement — purely algorithmic.
 *
 * Key insight: Both successful repurposings (TPs) and Phase 2/3 failures (TNs)
 * have clinical trials, literature, and biological rationale. The discriminator
 * is APPROVAL-LEVEL evidence (Phase 4, FDA labels) + mechanistic alignment
 * (target overlap, network proximity).
 *
 * Methods:
 *   1. Regulatory Approval — Phase 4 / approved indication from OT + ChEMBL
 *   2. Target Overlap — Jaccard of drug targets vs disease gene targets
 *   3. Network Proximity — BFS on STRING PPI subgraph
 *   4. Literature Specificity — normalized co-mention with treatment context
 *   5. Multi-DB Concordance — approval-level signals across independent DBs
 *   6. Composite — Weighted Harmonic Sum + CombMNZ
 */

import { safeCall } from "./api-client.js";
import * as claudeModules from "./claude-modules.js";

function parsePhase(phase) {
  if (typeof phase === "number") return phase;
  if (!phase || typeof phase !== "string") return 0;
  const p = phase.toUpperCase();
  if (p === "APPROVAL" || p === "PHASE_4" || p === "PHASE4") return 4;
  if (p === "PHASE_3" || p === "PHASE3") return 3;
  if (p === "PHASE_2" || p === "PHASE2") return 2;
  if (p === "PHASE_1" || p === "PHASE1" || p === "EARLY_PHASE_1") return 1;
  return 0;
}

function fuzzyMatch(name1, name2) {
  if (!name1 || !name2) return false;
  const a = name1.toLowerCase().trim();
  const b = name2.toLowerCase().trim();
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  // Handle "dimethyl fumarate" vs "tecfidera" — strip common suffixes
  const stripSuffix = (s) => s.replace(/\s*(hydrochloride|sodium|potassium|mesylate|maleate|fumarate|acetate|citrate|sulfate|tartrate|succinate|besylate|liposomal)\s*/gi, "").trim();
  const sa = stripSuffix(a);
  const sb = stripSuffix(b);
  if (sa === sb || sa.includes(sb) || sb.includes(sa)) return true;
  return false;
}

// ============================================================
// Shared resolution: get ChEMBL ID and EFO ID once, reuse
// ============================================================

async function resolveIds(drug, disease) {
  const [chemRes, diseaseRes] = await Promise.all([
    safeCall("mychem", "search", { query: drug, size: 3 }),
    safeCall("opentargets", "searchDisease", { queryString: disease, size: 5 }),
  ]);

  const chemblId = chemRes?.hits?.[0]?.chembl?.molecule_chembl_id || null;
  const efoId = diseaseRes?.search?.hits?.[0]?.id || null;
  const efoName = diseaseRes?.search?.hits?.[0]?.name || null;

  return { chemblId, efoId, efoName };
}

// ============================================================
// 1. REGULATORY APPROVAL
// Check OpenTargets maxClinicalStage for this specific drug-disease pair.
// Phase 4 = approved (1.0), Phase 3 = 0.5, Phase 2 = 0.25, etc.
// Also check ChEMBL indications for the drug.
// ============================================================

async function regulatoryApproval(drug, disease, ids) {
  let otPhase = 0;
  let chemblPhase = 0;
  let drugGlobalPhase = 0;
  let otMatched = false;
  let chemblMatched = false;

  await Promise.allSettled([
    // OpenTargets: disease → drugs, find our drug
    (async () => {
      if (!ids.efoId) return;
      const drugsRes = await safeCall("opentargets", "getDiseaseDrugs", { efoId: ids.efoId });
      const rows = drugsRes?.disease?.drugAndClinicalCandidates?.rows || [];
      for (const row of rows) {
        const name = row.drug?.name || "";
        if (fuzzyMatch(name, drug)) {
          otPhase = Math.max(otPhase, parsePhase(row.maxClinicalStage));
          otMatched = true;
        }
      }
    })(),

    // OpenTargets: drug → indications, find our disease
    (async () => {
      if (!ids.chemblId) return;
      const drugRes = await safeCall("opentargets", "getDrug", { chemblId: ids.chemblId });
      // Check drug global approval status
      drugGlobalPhase = parsePhase(drugRes?.drug?.maximumClinicalStage);
      const indications = drugRes?.drug?.indications?.rows || [];
      // Check all indications for disease match
      const diseaseWords = disease.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      for (const ind of indications) {
        const dName = (ind.disease?.name || "").toLowerCase();
        const dId = ind.disease?.id || "";
        // Match by name or by EFO ID
        if (fuzzyMatch(dName, disease.toLowerCase()) ||
            fuzzyMatch(dName, (ids.efoName || "").toLowerCase()) ||
            dId === ids.efoId ||
            diseaseWords.some((w) => dName.includes(w))) {
          const phase = parsePhase(ind.maxClinicalStage);
          otPhase = Math.max(otPhase, phase);
          otMatched = true;
        }
      }
    })(),

    // ChEMBL: get molecule details, check max_phase and indications
    (async () => {
      if (!ids.chemblId) return;
      const mol = await safeCall("chembl", "getMolecule", { chemblId: ids.chemblId });
      if (!mol) return;
      const indications = mol.drug_indications || [];
      const diseaseLower = disease.toLowerCase();
      const diseaseWords = diseaseLower.split(/\s+/).filter((w) => w.length > 3);
      for (const ind of indications) {
        const terms = [ind.efo_term, ind.mesh_heading, ind.indication_refs].filter(Boolean).join(" ").toLowerCase();
        if (terms.includes(diseaseLower) || diseaseWords.some((w) => terms.includes(w))) {
          chemblPhase = Math.max(chemblPhase, ind.max_phase_for_ind || mol.max_phase || 0);
          chemblMatched = true;
        }
      }
    })(),
  ]);

  const maxPhase = Math.max(otPhase, chemblPhase);
  // Non-linear scoring: Phase 4 (approved) is dramatically more valuable
  // Phase 4 → 1.0, Phase 3 → 0.15, Phase 2 → 0.05, Phase 1 → 0.02
  // Key: Phase 2/3 failures are common (all our TNs), so Phase 3 alone is weak evidence
  const phaseScoreMap = { 0: 0, 1: 0.02, 2: 0.05, 3: 0.15, 4: 1.0 };
  const score = phaseScoreMap[Math.min(maxPhase, 4)] || 0;

  return {
    score,
    maxPhase,
    otPhase,
    chemblPhase,
    drugGlobalPhase,
    otMatched,
    chemblMatched,
  };
}

// ============================================================
// 2. TARGET OVERLAP (Jaccard)
// Drug targets (from OT mechanism) ∩ Disease genes (from OT associations)
// ============================================================

async function targetOverlap(drug, disease, ids, prefetched) {
  let drugTargets = new Set();
  let diseaseGenes = new Set();

  if (prefetched?.drugTargets) {
    for (const t of prefetched.drugTargets) drugTargets.add(t.toUpperCase());
  }
  if (prefetched?.diseaseGenes) {
    for (const g of prefetched.diseaseGenes) diseaseGenes.add(g.toUpperCase());
  }

  // Only fetch what was not pre-supplied
  const fetches = [];
  if (drugTargets.size === 0) {
    fetches.push((async () => {
      if (!ids.chemblId) return;
      const drugRes = await safeCall("opentargets", "getDrug", { chemblId: ids.chemblId });
      const mechs = drugRes?.drug?.mechanismsOfAction?.rows || [];
      for (const m of mechs) {
        for (const t of m.targets || []) {
          if (t.approvedSymbol) drugTargets.add(t.approvedSymbol.toUpperCase());
        }
      }
    })());
  }
  if (diseaseGenes.size === 0) {
    fetches.push((async () => {
      if (!ids.efoId) return;
      const targetsRes = await safeCall("opentargets", "getDiseaseTargets", {
        efoId: ids.efoId, size: 25,
      });
      const rows = targetsRes?.disease?.associatedTargets?.rows || [];
      for (const r of rows) {
        if (r.target?.approvedSymbol) {
          diseaseGenes.add(r.target.approvedSymbol.toUpperCase());
        }
      }
    })());
  }
  if (fetches.length > 0) await Promise.allSettled(fetches);

  if (drugTargets.size === 0 || diseaseGenes.size === 0) {
    return { score: 0, intersection: 0, union: 0, drugTargets: drugTargets.size, diseaseGenes: diseaseGenes.size };
  }

  const intersection = new Set([...drugTargets].filter((g) => diseaseGenes.has(g)));
  const union = new Set([...drugTargets, ...diseaseGenes]);
  const jaccard = intersection.size / union.size;

  return {
    score: jaccard,
    intersection: intersection.size,
    union: union.size,
    drugTargets: drugTargets.size,
    diseaseGenes: diseaseGenes.size,
    overlappingGenes: [...intersection],
  };
}

// ============================================================
// 3. NETWORK PROXIMITY
// BFS on STRING PPI subgraph
// ============================================================

async function networkProximity(drug, disease, ids, prefetched) {
  let drugTargets = prefetched?.drugTargets ? [...prefetched.drugTargets] : [];
  let diseaseGenes = prefetched?.diseaseGenes ? [...prefetched.diseaseGenes] : [];

  // Only fetch what was not pre-supplied
  const fetches = [];
  if (drugTargets.length === 0) {
    fetches.push((async () => {
      if (!ids.chemblId) return;
      const drugRes = await safeCall("opentargets", "getDrug", { chemblId: ids.chemblId });
      const mechs = drugRes?.drug?.mechanismsOfAction?.rows || [];
      for (const m of mechs) {
        for (const t of m.targets || []) {
          if (t.approvedSymbol) drugTargets.push(t.approvedSymbol);
        }
      }
    })());
  }
  if (diseaseGenes.length === 0) {
    fetches.push((async () => {
      if (!ids.efoId) return;
      const targetsRes = await safeCall("opentargets", "getDiseaseTargets", {
        efoId: ids.efoId, size: 15,
      });
      const rows = targetsRes?.disease?.associatedTargets?.rows || [];
      for (const r of rows) {
        if (r.target?.approvedSymbol) diseaseGenes.push(r.target.approvedSymbol);
      }
    })());
  }
  if (fetches.length > 0) await Promise.allSettled(fetches);

  if (drugTargets.length === 0 || diseaseGenes.length === 0) {
    return { score: 0, avgDistance: Infinity, reason: "missing_targets" };
  }

  const allGenes = [...new Set([...drugTargets, ...diseaseGenes])];
  const identifiers = allGenes.slice(0, 20).join("%0d");

  const network = await safeCall("string", "getNetwork", {
    identifiers, species: 9606, limit: 50,
  });

  if (!Array.isArray(network) || network.length === 0) {
    return { score: 0, avgDistance: Infinity, reason: "no_network" };
  }

  const adj = new Map();
  for (const edge of network) {
    const a = edge.preferredName_A;
    const b = edge.preferredName_B;
    if (!a || !b) continue;
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push(b);
    adj.get(b).push(a);
  }

  function bfs(start) {
    const dist = new Map();
    dist.set(start, 0);
    const queue = [start];
    let i = 0;
    while (i < queue.length) {
      const cur = queue[i++];
      const d = dist.get(cur);
      for (const node of adj.get(cur) || []) {
        if (!dist.has(node)) {
          dist.set(node, d + 1);
          queue.push(node);
        }
      }
    }
    return dist;
  }

  let totalDist = 0;
  let pairs = 0;
  const maxDist = 10;

  for (const dt of drugTargets) {
    if (!adj.has(dt)) continue;
    const dists = bfs(dt);
    for (const dg of diseaseGenes) {
      const d = dists.get(dg);
      totalDist += d !== undefined ? d : maxDist;
      pairs++;
    }
  }

  if (pairs === 0) {
    return { score: 0, avgDistance: Infinity, reason: "no_paths" };
  }

  const avgDist = totalDist / pairs;
  const proximityScore = 1 / (1 + avgDist);

  return { score: proximityScore, avgDistance: avgDist, pairs, networkSize: adj.size };
}

// ============================================================
// 4. LITERATURE SPECIFICITY
// Co-occurrence normalized by geometric mean of individual counts.
// Also searches for treatment-specific terms to boost signal.
// ============================================================

async function literatureSpecificity(drug, disease) {
  const [coRes, treatRes, drugRes, diseaseRes] = await Promise.all([
    safeCall("europepmc", "search", {
      query: `"${drug}" AND "${disease}"`, pageSize: 1,
    }),
    safeCall("europepmc", "search", {
      query: `"${drug}" AND "${disease}" AND (treatment OR therapy OR approved OR efficacy OR indication)`, pageSize: 1,
    }),
    safeCall("europepmc", "search", {
      query: `"${drug}"`, pageSize: 1,
    }),
    safeCall("europepmc", "search", {
      query: `"${disease}"`, pageSize: 1,
    }),
  ]);

  const coCount = coRes?.hitCount || 0;
  const treatCount = treatRes?.hitCount || 0;
  const drugCount = drugRes?.hitCount || 0;
  const diseaseCount = diseaseRes?.hitCount || 0;

  if (drugCount === 0 || diseaseCount === 0) {
    return { score: 0, coCount, treatCount, drugCount, diseaseCount };
  }

  // Normalized co-occurrence: coCount / sqrt(drugCount * diseaseCount)
  const geoMean = Math.sqrt(drugCount * diseaseCount);
  const rawCo = coCount / geoMean;

  // Treatment specificity: what fraction of co-occurrences mention treatment?
  const treatRatio = coCount > 0 ? treatCount / coCount : 0;

  // Combined: raw co-occurrence * treatment boost
  // Capped at 1.0
  const score = Math.min(1.0, rawCo * (1 + treatRatio));

  return {
    score,
    coCount,
    treatCount,
    drugCount,
    diseaseCount,
    rawCo,
    treatRatio,
  };
}

// ============================================================
// 5. MULTI-DB CONCORDANCE
// Count approval-level signals from independent databases.
// Unlike evidence triangulation (which just checks existence),
// this checks for APPROVAL/INDICATION-level evidence.
// ============================================================

async function multiDbConcordance(drug, disease, ids) {
  const signals = {
    ot_phase4: false,
    chembl_approved: false,
    clinicaltrials_phase4: false,
    drugcentral_indication: false,
    dailymed_label: false,
  };

  await Promise.allSettled([
    // OT: drug appears for this disease at any stage (connection exists)
    (async () => {
      if (!ids.efoId) return;
      const drugsRes = await safeCall("opentargets", "getDiseaseDrugs", { efoId: ids.efoId });
      const rows = drugsRes?.disease?.drugAndClinicalCandidates?.rows || [];
      for (const row of rows) {
        if (fuzzyMatch(row.drug?.name, drug) && parsePhase(row.maxClinicalStage) >= 4) {
          signals.ot_phase4 = true;
          break;
        }
      }
    })(),

    // ChEMBL: drug has Phase 4 indication for this disease
    (async () => {
      if (!ids.chemblId) return;
      const mol = await safeCall("chembl", "getMolecule", { chemblId: ids.chemblId });
      const indications = mol?.drug_indications || [];
      const diseaseLower = disease.toLowerCase();
      const diseaseWords = diseaseLower.split(/\s+/).filter((w) => w.length > 3);
      for (const ind of indications) {
        const terms = [ind.efo_term, ind.mesh_heading].filter(Boolean).join(" ").toLowerCase();
        if ((terms.includes(diseaseLower) || diseaseWords.some((w) => terms.includes(w)))
            && (ind.max_phase_for_ind || 0) >= 4) {
          signals.chembl_approved = true;
          break;
        }
      }
    })(),

    // ClinicalTrials: Phase 3 or 4 trials exist (both TPs and TNs have these)
    (async () => {
      const res = await safeCall("clinicaltrials", "search", {
        query: `${drug} ${disease}`, pageSize: 10,
      });
      const studies = res?.studies || [];
      // Count completed Phase 3+ trials as stronger signal
      signals.clinicaltrials_phase4 = studies.some((s) => {
        const phases = s.protocolSection?.designModule?.phases || [];
        const status = s.protocolSection?.statusModule?.overallStatus || "";
        return phases.includes("PHASE4") || (phases.includes("PHASE3") && status === "COMPLETED");
      });
    })(),

    // DrugCentral indication match
    (async () => {
      const res = await safeCall("drugcentral", "search", { query: drug });
      if (res && typeof res === "object") {
        const json = JSON.stringify(res).toLowerCase();
        signals.drugcentral_indication = json.includes(disease.toLowerCase());
      }
    })(),

    // DailyMed label
    (async () => {
      const res = await safeCall("dailymed", "searchDrugs", { name: drug });
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        signals.dailymed_label = true;
      }
    })(),
  ]);

  const count = Object.values(signals).filter(Boolean).length;
  return {
    score: count / Object.keys(signals).length,
    count,
    total: Object.keys(signals).length,
    signals,
  };
}

// ============================================================
// 6. COMPOSITE SCORE — Weighted Harmonic Sum + CombMNZ
//
// Component weights reflect discriminative power:
//   - Regulatory Approval: 3.0 (strongest discriminator)
//   - Target Overlap: 2.0 (biological mechanism match)
//   - Multi-DB Concordance: 2.0 (independent confirmation)
//   - Network Proximity: 1.0 (network biology)
//   - Literature Specificity: 0.5 (noisy signal)
// ============================================================

const COMPONENT_WEIGHTS = {
  regulatoryApproval: 3.0,
  targetOverlap: 2.0,
  multiDbConcordance: 2.0,
  networkProximity: 1.0,
  literatureSpecificity: 0.5,
};

function computeComposite(components) {
  // Weighted average
  let weightedSum = 0;
  let totalWeight = 0;
  const breakdown = {};

  for (const [key, comp] of Object.entries(components)) {
    const w = COMPONENT_WEIGHTS[key] || 1.0;
    const s = comp.score || 0;
    weightedSum += s * w;
    totalWeight += w;
    breakdown[key] = { score: s, weight: w, contribution: s * w };
  }

  const weightedAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Harmonic sum (sorted by weighted contribution)
  const entries = Object.entries(components)
    .map(([k, c]) => ({ key: k, score: c.score || 0, weight: COMPONENT_WEIGHTS[k] || 1.0 }))
    .sort((a, b) => b.score * b.weight - a.score * a.weight);

  let hsNum = 0;
  let hsDen = 0;
  for (let i = 0; i < entries.length; i++) {
    const rank = i + 1;
    const w = entries[i].weight / (rank * rank);
    hsNum += entries[i].score * w;
    hsDen += w;
  }
  const harmonicSum = hsDen > 0 ? hsNum / hsDen : 0;

  // CombMNZ bonus
  const nonZero = entries.filter((e) => e.score > 0).length;
  const combMNZ = nonZero / entries.length;

  // Final: 60% weighted harmonic sum + 25% weighted average + 15% CombMNZ
  const composite = 0.60 * harmonicSum + 0.25 * weightedAvg + 0.15 * combMNZ;

  return {
    composite,
    harmonicSum,
    weightedAvg,
    combMNZ,
    nonZeroSources: nonZero,
    totalSources: entries.length,
    breakdown,
  };
}

// ============================================================
// Shared gene fetching: drug targets + disease genes from OT
// ============================================================

async function fetchGenes(ids) {
  let drugTargets = [];
  let diseaseGenes = [];

  await Promise.allSettled([
    (async () => {
      if (!ids.chemblId) return;
      const drugRes = await safeCall("opentargets", "getDrug", { chemblId: ids.chemblId });
      const mechs = drugRes?.drug?.mechanismsOfAction?.rows || [];
      for (const m of mechs) {
        for (const t of m.targets || []) {
          if (t.approvedSymbol) drugTargets.push(t.approvedSymbol);
        }
      }
    })(),
    (async () => {
      if (!ids.efoId) return;
      const targetsRes = await safeCall("opentargets", "getDiseaseTargets", {
        efoId: ids.efoId, size: 25,
      });
      const rows = targetsRes?.disease?.associatedTargets?.rows || [];
      for (const r of rows) {
        if (r.target?.approvedSymbol) diseaseGenes.push(r.target.approvedSymbol);
      }
    })(),
  ]);

  return { drugTargets, diseaseGenes };
}

// ============================================================
// MAIN SCORING FUNCTION
// ============================================================

export async function scorePair(drug, disease, opts = {}) {
  const startTime = Date.now();
  const verbose = opts.verbose || false;

  // Resolve IDs once
  const ids = await resolveIds(drug, disease);

  // Fetch drug targets and disease genes once, share across components
  const prefetched = await fetchGenes(ids);

  // Run all 5 evidence components in parallel
  const [regApproval, targOverlap, netProx, litSpec, multiDb] = await Promise.allSettled([
    regulatoryApproval(drug, disease, ids),
    targetOverlap(drug, disease, ids, prefetched),
    networkProximity(drug, disease, ids, prefetched),
    literatureSpecificity(drug, disease),
    multiDbConcordance(drug, disease, ids),
  ]);

  const components = {
    regulatoryApproval: regApproval.status === "fulfilled" ? regApproval.value : { score: 0, error: regApproval.reason?.message },
    targetOverlap: targOverlap.status === "fulfilled" ? targOverlap.value : { score: 0, error: targOverlap.reason?.message },
    networkProximity: netProx.status === "fulfilled" ? netProx.value : { score: 0, error: netProx.reason?.message },
    literatureSpecificity: litSpec.status === "fulfilled" ? litSpec.value : { score: 0, error: litSpec.reason?.message },
    multiDbConcordance: multiDb.status === "fulfilled" ? multiDb.value : { score: 0, error: multiDb.reason?.message },
  };

  const composite = computeComposite(components);

  return {
    drug,
    disease,
    compositeScore: composite.composite,
    harmonicSum: composite.harmonicSum,
    weightedAvg: composite.weightedAvg,
    combMNZ: composite.combMNZ,
    nonZeroSources: composite.nonZeroSources,
    components: verbose ? components : undefined,
    ids: verbose ? ids : undefined,
    latency_ms: Date.now() - startTime,
  };
}

// ============================================================
// v3.5 SCORING — v3.0 + bounded Claude sub-modules
//
// Claude is used as a TOOL, not the judge:
//   1. Entity Resolution → better API queries → better data
//   2. Negative Evidence → penalty for withdrawn/failed trials
//   3. Mechanism Gap-Filler → indirect pathway links
//
// Claude NEVER sees "Is drug X good for disease Y?"
// ============================================================

export async function scorePairV35(drug, disease, opts = {}) {
  const startTime = Date.now();
  const verbose = opts.verbose || false;

  // PHASE 1: Entity resolution — get synonyms BEFORE querying APIs
  const synonyms = await claudeModules.entityResolution(drug, disease);

  // Resolve IDs using original + synonym names (take best match)
  let ids = await resolveIds(drug, disease);
  if (!ids.chemblId || !ids.efoId) {
    for (const dn of synonyms.drugSynonyms) {
      if (ids.chemblId) break;
      const alt = await resolveIds(dn, disease);
      if (alt.chemblId) ids = { ...ids, chemblId: alt.chemblId };
    }
    for (const disn of synonyms.diseaseSynonyms) {
      if (ids.efoId) break;
      const alt = await resolveIds(drug, disn);
      if (alt.efoId) ids = { ...ids, efoId: alt.efoId, efoName: alt.efoName };
    }
  }

  // Fetch drug targets and disease genes ONCE, reuse across components + sub-modules
  const prefetched = await fetchGenes(ids);

  // PHASE 2: Run v3.0 components + fetch trials in parallel
  const [regApproval, targOverlap, netProx, litSpec, multiDb, trialsRes] = await Promise.allSettled([
    regulatoryApproval(drug, disease, ids),
    targetOverlap(drug, disease, ids, prefetched),
    networkProximity(drug, disease, ids, prefetched),
    literatureSpecificity(drug, disease),
    multiDbConcordance(drug, disease, ids),
    safeCall("clinicaltrials", "search", { query: `${drug} ${disease}`, pageSize: 10 }),
  ]);

  const components = {
    regulatoryApproval: regApproval.status === "fulfilled" ? regApproval.value : { score: 0 },
    targetOverlap: targOverlap.status === "fulfilled" ? targOverlap.value : { score: 0 },
    networkProximity: netProx.status === "fulfilled" ? netProx.value : { score: 0 },
    literatureSpecificity: litSpec.status === "fulfilled" ? litSpec.value : { score: 0 },
    multiDbConcordance: multiDb.status === "fulfilled" ? multiDb.value : { score: 0 },
  };

  // Also try synonyms for any component that scored 0
  if (components.regulatoryApproval.score === 0 && synonyms.diseaseSynonyms.length > 0) {
    for (const disn of synonyms.diseaseSynonyms.slice(0, 2)) {
      const altIds = await resolveIds(drug, disn);
      if (altIds.efoId && altIds.efoId !== ids.efoId) {
        const altReg = await regulatoryApproval(drug, disn, altIds).catch(() => null);
        if (altReg && altReg.score > components.regulatoryApproval.score) {
          components.regulatoryApproval = altReg;
          break;
        }
      }
    }
  }

  // PHASE 3: Claude sub-modules on API-returned data (reuse prefetched genes)
  const trials = trialsRes.status === "fulfilled" ? trialsRes.value?.studies || [] : [];

  const [negEvidence, mechGap] = await Promise.allSettled([
    claudeModules.negativeEvidenceDetector(trials),
    claudeModules.mechanismGapFiller(prefetched.drugTargets, prefetched.diseaseGenes),
  ]);

  const negEv = negEvidence.status === "fulfilled" ? negEvidence.value : { penalty: 0 };
  const mech = mechGap.status === "fulfilled" ? mechGap.value : { score: 0 };

  // PHASE 4: Composite score = v3.0 base + Claude adjustments
  const v3Base = computeComposite(components);

  // Negative evidence penalty (multiplicative — scales down rather than zeroing)
  const negPenalty = negEv.penalty || 0;

  // Final v3.5 score: v3.0 base with negative evidence penalty
  const finalScore = Math.max(0, Math.min(1,
    v3Base.composite * (1 - negPenalty)
  ));

  return {
    drug,
    disease,
    compositeScore: finalScore,
    v3BaseScore: v3Base.composite,
    negPenalty,
    harmonicSum: v3Base.harmonicSum,
    weightedAvg: v3Base.weightedAvg,
    combMNZ: v3Base.combMNZ,
    nonZeroSources: v3Base.nonZeroSources,
    components: verbose ? components : undefined,
    claudeModules: verbose ? { synonyms, negativeEvidence: negEv, mechanismGap: mech } : undefined,
    ids: verbose ? ids : undefined,
    latency_ms: Date.now() - startTime,
  };
}

// ============================================================
// CLASSIFICATION
// ============================================================

export function classify(result, threshold = 0.35) {
  return {
    ...result,
    prediction: result.compositeScore >= threshold ? "TP" : "TN",
    threshold,
  };
}

// ============================================================
// BATCH SCORING
// ============================================================

export async function scoreBatch(pairs, opts = {}) {
  const concurrency = opts.concurrency || 3;
  const results = [];
  const threshold = opts.threshold || 0.35;

  for (let i = 0; i < pairs.length; i += concurrency) {
    const chunk = pairs.slice(i, i + concurrency);
    const chunkResults = await Promise.allSettled(
      chunk.map((p) => scorePair(p.drug, p.disease, opts))
    );
    for (let j = 0; j < chunkResults.length; j++) {
      const r = chunkResults[j];
      const pair = chunk[j];
      if (r.status === "fulfilled") {
        results.push(classify(r.value, threshold));
      } else {
        results.push({
          drug: pair.drug,
          disease: pair.disease,
          compositeScore: 0,
          prediction: "TN",
          error: r.reason?.message,
          threshold,
        });
      }
    }
    if (opts.onProgress) {
      opts.onProgress(Math.min(i + concurrency, pairs.length), pairs.length);
    }
  }

  return results;
}

// ============================================================
// METRICS
// ============================================================

export function computeMetrics(results, groundTruth) {
  let tp = 0, fp = 0, tn = 0, fn = 0;

  for (let i = 0; i < results.length; i++) {
    const pred = results[i].prediction;
    const truth = groundTruth[i];
    if (pred === "TP" && truth === "TP") tp++;
    else if (pred === "TP" && truth === "TN") fp++;
    else if (pred === "TN" && truth === "TN") tn++;
    else if (pred === "TN" && truth === "TP") fn++;
  }

  const accuracy = (tp + tn) / (tp + fp + tn + fn);
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
  const specificity = tn + fp > 0 ? tn / (tn + fp) : 0;

  // AUROC via trapezoidal rule on ROC curve
  const scores = results.map((r, i) => ({
    score: r.compositeScore,
    label: groundTruth[i] === "TP" ? 1 : 0,
  }));
  scores.sort((a, b) => b.score - a.score);

  let auroc = 0;
  let tpCount = 0;
  let fpCount = 0;
  const totalP = scores.filter((s) => s.label === 1).length;
  const totalN = scores.filter((s) => s.label === 0).length;
  let prevFPR = 0;
  let prevTPR = 0;

  for (const s of scores) {
    if (s.label === 1) tpCount++;
    else fpCount++;
    const tpr = totalP > 0 ? tpCount / totalP : 0;
    const fpr = totalN > 0 ? fpCount / totalN : 0;
    auroc += (fpr - prevFPR) * (tpr + prevTPR) / 2;
    prevFPR = fpr;
    prevTPR = tpr;
  }

  return {
    tp, fp, tn, fn,
    accuracy: +accuracy.toFixed(4),
    precision: +precision.toFixed(4),
    recall: +recall.toFixed(4),
    f1: +f1.toFixed(4),
    specificity: +specificity.toFixed(4),
    auroc: +auroc.toFixed(4),
    n: results.length,
  };
}

// ============================================================
// THRESHOLD OPTIMIZATION
// ============================================================

export function optimizeThreshold(results, groundTruth) {
  const thresholds = [];
  for (let t = 0; t <= 1; t += 0.01) {
    const classified = results.map((r) => classify(r, t));
    const metrics = computeMetrics(classified, groundTruth);
    thresholds.push({
      threshold: +t.toFixed(2),
      youdenJ: +(metrics.recall + metrics.specificity - 1).toFixed(4),
      ...metrics,
    });
  }
  thresholds.sort((a, b) => b.youdenJ - a.youdenJ);
  return thresholds[0];
}
