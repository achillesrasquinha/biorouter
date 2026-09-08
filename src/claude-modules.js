/**
 * Bounded Enhancement Sub-Modules for v3.5 Scoring
 *
 * Originally designed to use Claude as a bounded tool, these modules
 * now use rule-based NLP and structured heuristics to achieve the same
 * goals without any LLM dependency:
 *
 *   1. Entity Resolution — synonym expansion using MyChem/MyDisease APIs
 *   2. Negative Evidence Detector — parse trial status fields for failure signals
 *   3. Mechanism Gap-Filler — STRING enrichment + pathway overlap analysis
 *
 * Zero LLM. Fully deterministic. Auditable.
 */

import { safeCall } from "./api-client.js";

// ============================================================
// MODULE 1: ENTITY RESOLUTION
//
// Use MyChem and MyDisease APIs to find canonical names and synonyms.
// Then re-query with better terms.
// ============================================================

export async function entityResolution(drug, disease) {
  const drugSynonyms = [];
  const diseaseSynonyms = [];

  await Promise.allSettled([
    // Drug synonyms from MyChem
    (async () => {
      const res = await safeCall("mychem", "search", { query: drug, size: 3 });
      const hits = res?.hits || [];
      for (const hit of hits) {
        const pref = hit?.chembl?.pref_name;
        if (pref && pref.toLowerCase() !== drug.toLowerCase()) {
          drugSynonyms.push(pref);
        }
        const syns = hit?.chembl?.molecule_synonyms || [];
        for (const s of syns) {
          const name = s?.molecule_synonym || s?.synonyms;
          if (name && name.toLowerCase() !== drug.toLowerCase() && drugSynonyms.length < 4) {
            drugSynonyms.push(name);
          }
        }
      }
    })(),

    // Disease synonyms from MyDisease
    (async () => {
      const res = await safeCall("mydisease", "search", { query: disease, size: 5 });
      const hits = res?.hits || [];
      for (const hit of hits) {
        const label = hit?.mondo?.label;
        if (label && label.toLowerCase() !== disease.toLowerCase()) {
          diseaseSynonyms.push(label);
        }
        const syns = hit?.mondo?.synonym?.exact || hit?.mondo?.synonym || [];
        const synList = Array.isArray(syns) ? syns : [];
        for (const s of synList) {
          const name = typeof s === "string" ? s : s?.val;
          if (name && name.toLowerCase() !== disease.toLowerCase() && diseaseSynonyms.length < 4) {
            diseaseSynonyms.push(name);
          }
        }
      }
    })(),
  ]);

  return {
    drugSynonyms: [...new Set(drugSynonyms)].slice(0, 4),
    diseaseSynonyms: [...new Set(diseaseSynonyms)].slice(0, 4),
  };
}

// ============================================================
// MODULE 2: NEGATIVE EVIDENCE DETECTOR
//
// Parse ClinicalTrials.gov trial fields for failure signals:
// - Status: "TERMINATED", "WITHDRAWN", "SUSPENDED"
// - whyStopped containing: safety, futility, lack of efficacy, adverse
// - Phase 3 terminated = strong negative signal
// ============================================================

const SAFETY_KEYWORDS = [
  "safety", "adverse", "toxicity", "harm", "death", "fatal",
  "hepatotox", "cardiotox", "serious adverse", "side effect",
  "risk", "dangerous", "black box",
];

const FUTILITY_KEYWORDS = [
  "futility", "lack of efficacy", "no benefit", "ineffective",
  "no significant", "failed to demonstrate", "did not meet",
  "negative result", "no difference", "primary endpoint not met",
];

const WITHDRAWAL_KEYWORDS = [
  "withdrawn", "recall", "market withdrawal", "voluntarily withdrawn",
  "removed from market", "discontinued",
];

function classifyTrial(trial) {
  const ps = trial.protocolSection || {};
  const status = (ps.statusModule?.overallStatus || "").toUpperCase();
  const whyStopped = (ps.statusModule?.whyStoppedDescription || "").toLowerCase();
  const title = (ps.identificationModule?.briefTitle || "").toLowerCase();
  const phases = ps.designModule?.phases || [];

  if (status === "WITHDRAWN") return "withdrawn";
  if (status === "SUSPENDED") return "suspended";

  if (status === "TERMINATED") {
    if (SAFETY_KEYWORDS.some((k) => whyStopped.includes(k) || title.includes(k))) {
      return "terminated_safety";
    }
    if (FUTILITY_KEYWORDS.some((k) => whyStopped.includes(k) || title.includes(k))) {
      return "terminated_futility";
    }
    return "terminated_other";
  }

  if (status === "COMPLETED") return "completed_normal";
  if (status === "ACTIVE, NOT RECRUITING" || status === "RECRUITING") return "active";
  return "other";
}

export async function negativeEvidenceDetector(trials) {
  if (!trials || trials.length === 0) {
    return { penalty: 0, withdrawnCount: 0, harmCount: 0, futilityCount: 0, details: [] };
  }

  const classifications = trials.map((t, i) => ({
    index: i,
    category: classifyTrial(t),
    title: t.protocolSection?.identificationModule?.briefTitle || "",
  }));

  let withdrawnCount = 0;
  let harmCount = 0;
  let futilityCount = 0;

  for (const c of classifications) {
    if (c.category === "withdrawn") withdrawnCount++;
    if (c.category === "terminated_safety") harmCount++;
    if (c.category === "terminated_futility") futilityCount++;
  }

  // Penalty based on ratio of negative trials (safety/futility/withdrawn only)
  const total = trials.length;
  const negativeRatio =
    (withdrawnCount * 1.0 + harmCount * 0.8 + futilityCount * 0.5) / total;
  const penalty = Math.min(0.25, negativeRatio * 0.4);

  return {
    penalty,
    withdrawnCount,
    harmCount,
    futilityCount,
    totalTrials: trials.length,
    details: classifications,
  };
}

// ============================================================
// MODULE 3: MECHANISM GAP-FILLER
//
// When drug targets and disease genes don't directly overlap,
// check if they share functional enrichment terms via STRING.
// This catches indirect pathway connections like:
//   Ketamine targets GRIN1/GRIN2A → glutamate signaling
//   Depression genes SLC6A4/HTR2A → serotonin/monoamine signaling
//   Both connect through "synaptic signaling" in STRING enrichment
// ============================================================

export async function mechanismGapFiller(drugTargets, diseaseGenes) {
  if (drugTargets.length === 0 || diseaseGenes.length === 0) {
    return { score: 0, reason: "empty_gene_lists" };
  }

  // Get STRING functional enrichment for both gene sets
  const [drugEnrich, diseaseEnrich] = await Promise.allSettled([
    safeCall("string", "getEnrichment", {
      identifiers: drugTargets.slice(0, 10).join("%0d"),
      species: 9606,
    }),
    safeCall("string", "getEnrichment", {
      identifiers: diseaseGenes.slice(0, 10).join("%0d"),
      species: 9606,
    }),
  ]);

  const drugTerms = new Set();
  const diseaseTerms = new Set();
  const drugPaths = [];
  const diseasePaths = [];

  if (drugEnrich.status === "fulfilled" && Array.isArray(drugEnrich.value)) {
    for (const entry of drugEnrich.value) {
      if (entry.term) drugTerms.add(entry.term);
      if (entry.description) drugPaths.push(entry.description.toLowerCase());
    }
  }

  if (diseaseEnrich.status === "fulfilled" && Array.isArray(diseaseEnrich.value)) {
    for (const entry of diseaseEnrich.value) {
      if (entry.term) diseaseTerms.add(entry.term);
      if (entry.description) diseasePaths.push(entry.description.toLowerCase());
    }
  }

  if (drugTerms.size === 0 || diseaseTerms.size === 0) {
    return { score: 0, reason: "no_enrichment_data" };
  }

  // Jaccard overlap of enrichment terms
  const intersection = new Set([...drugTerms].filter((t) => diseaseTerms.has(t)));
  const union = new Set([...drugTerms, ...diseaseTerms]);
  const termJaccard = intersection.size / union.size;

  // Also check for semantic overlap in pathway descriptions
  let descriptionOverlap = 0;
  const sharedPathways = [];
  for (const dp of drugPaths) {
    for (const disp of diseasePaths) {
      // Check for significant word overlap (>3 char words)
      const dpWords = new Set(dp.split(/\W+/).filter((w) => w.length > 3));
      const dispWords = new Set(disp.split(/\W+/).filter((w) => w.length > 3));
      const shared = [...dpWords].filter((w) => dispWords.has(w));
      if (shared.length >= 2) {
        descriptionOverlap++;
        if (sharedPathways.length < 3) {
          sharedPathways.push(dp.slice(0, 60));
        }
      }
    }
  }

  const descScore = Math.min(1.0, descriptionOverlap / 5);
  const score = 0.6 * termJaccard + 0.4 * descScore;

  return {
    score: Math.min(1.0, score),
    termJaccard,
    descriptionOverlap,
    sharedTerms: [...intersection].slice(0, 5),
    sharedPathways,
    drugTermCount: drugTerms.size,
    diseaseTermCount: diseaseTerms.size,
  };
}
