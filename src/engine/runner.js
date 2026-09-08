import { readFileSync } from "node:fs";
import { extname, relative, sep } from "node:path";
import { parse } from "yaml";
import { request } from "../request.js";
import { walkYaml } from "../registry.js";
import { template, shouldSkip, getPath } from "./templater.js";

// ---- Endpoint loading ----

export function loadEndpoints(endpointsDir) {
  const endpoints = new Map();

  for (const file of walkYaml(endpointsDir)) {
    const raw = readFileSync(file, "utf-8");
    const spec = parse(raw);
    if (!spec?.phases) continue;

    const rel = relative(endpointsDir, file);
    const name = rel.replace(extname(rel), "").split(sep).join("/");
    spec._name = name;
    endpoints.set(name, spec);
  }

  return endpoints;
}

// ---- Endpoint execution ----

export async function run(spec, sources, input, opts = {}) {
  const context = { input, resolved: {} };
  const allResults = new Map();
  const startTime = Date.now();

  for (const phase of spec.phases) {
    if (phase.parallel === false) {
      for (const callSpec of phase.calls) {
        if (callSpec.skip_if && shouldSkip(callSpec.skip_if, context)) continue;

        const call = buildCall(callSpec, context);
        const result = await execCall(call, sources);
        postProcess(call, result, context, spec.validators);
        allResults.set(dedupeKey(call, allResults), result);

        if (call._extract && result.status === "ok") {
          for (const [key, path] of Object.entries(call._extract)) {
            const val = getPath(result.data, path);
            if (val !== undefined && val !== null && val !== "") {
              context.resolved[key] = val;
            }
          }
        }
      }
    } else {
      const calls = buildCalls(phase, context);
      const results = await Promise.allSettled(
        calls.map((call) => execCall(call, sources))
      );
      calls.forEach((call, i) => {
        const r = results[i];
        const result = r.status === "fulfilled"
          ? r.value
          : { source: call.source, tool: call.tool, status: "error", error: r.reason?.message?.slice(0, 200) };
        postProcess(call, result, context, spec.validators);

        if (call._extract && result.status === "ok") {
          for (const [key, path] of Object.entries(call._extract)) {
            const val = getPath(result.data, path);
            if (val !== undefined && val !== null && val !== "") {
              context.resolved[key] = val;
            }
          }
        }

        allResults.set(dedupeKey(call, allResults), result);
      });
    }
  }

  const { data, provenance } = spec.output
    ? merge(spec.output, context, allResults)
    : { data: {}, provenance: {} };

  const meta = {
    endpoint: spec._name,
    sources: [],
    total_latency_ms: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };

  let okCount = 0;
  let totalCount = 0;
  for (const [key, r] of allResults) {
    totalCount++;
    if (r.status === "ok") okCount++;
    meta.sources.push({
      call: key,
      status: r.status,
      latency_ms: r.latency_ms || 0,
      ...(r.error ? { error: r.error } : {}),
    });
  }
  meta.completeness = totalCount > 0 ? +(okCount / totalCount).toFixed(2) : 0;

  return { ...data, _meta: meta, _provenance: provenance };
}

// ---- Call building ----

function buildCall(callSpec, context) {
  return {
    source: callSpec.source,
    tool: callSpec.tool,
    as: callSpec.as || null,
    params: template(callSpec.params, context),
    provides: callSpec.provides || [],
    validate: callSpec.validate || null,
    _extract: callSpec.extract || null,
    _pickBest: callSpec.pick_best || null,
  };
}

function buildCalls(phase, context) {
  const calls = [];
  for (const callSpec of phase.calls) {
    if (callSpec.skip_if && shouldSkip(callSpec.skip_if, context)) continue;
    calls.push(buildCall(callSpec, context));
  }
  return calls;
}

// ---- Post-processing ----

function postProcess(call, result, context, validators) {
  if (call.validate && result.status === "ok") {
    if (!runValidator(call.validate, result.data, context, validators)) {
      result.status = "validation_failed";
      result.error = `Validator '${call.validate}' rejected the response`;
    }
  }
  if (call._pickBest && result.status === "ok" && result.data) {
    result.data = applyPickBest(result.data, call._pickBest, context);
  }
}

function applyPickBest(data, pickBest, context) {
  const arr = getPath(data, pickBest.array);
  if (!Array.isArray(arr) || arr.length === 0) return data;

  const query = getPath(context, pickBest.against);
  if (!query) {
    data[pickBest.as] = arr[0];
    return data;
  }

  const queryLower = String(query).toLowerCase();
  let best = arr[0];
  let bestScore = 0;

  for (const item of arr) {
    const fieldVal = getPath(item, pickBest.match_field);
    if (!fieldVal) continue;
    const val = String(fieldVal).toLowerCase();
    if (val === queryLower) { best = item; break; }
    if (val.includes(queryLower) || queryLower.includes(val)) {
      const lenRatio = queryLower.length / val.length;
      const score = val.includes(queryLower) ? 2 + lenRatio : 1;
      if (score > bestScore) { bestScore = score; best = item; }
    }
  }

  data[pickBest.as] = best;
  return data;
}

function runValidator(validatorName, data, context, validators) {
  if (!validators || !validators[validatorName]) return true;

  if (validatorName === "contains-drug-name") {
    const query = String(context.input?.query || "").toLowerCase();
    if (!query) return true;
    const json = JSON.stringify(data).toLowerCase();
    return json.includes(query);
  }

  return true;
}

// ---- Execution ----

async function execCall(call, sources) {
  const src = sources.get(call.source);
  if (!src) return { source: call.source, tool: call.tool, status: "unknown_source", data: null, latency_ms: 0 };

  const tool = src.tools[call.tool];
  if (!tool) return { source: call.source, tool: call.tool, status: "unknown_tool", data: null, latency_ms: 0 };

  const start = Date.now();
  try {
    const data = await request(src, tool, call.params);
    return {
      source: call.source,
      tool: call.tool,
      status: "ok",
      data,
      latency_ms: Date.now() - start,
    };
  } catch (err) {
    return {
      source: call.source,
      tool: call.tool,
      status: "error",
      error: err.message?.slice(0, 200),
      data: null,
      latency_ms: Date.now() - start,
    };
  }
}

function dedupeKey(call, existing) {
  if (call.as) return call.as;
  let base = `${call.source}.${call.tool}`;
  let key = base;
  let n = 1;
  while (existing.has(key)) key = `${base}.${n++}`;
  return key;
}

// ---- Output merge ----

/**
 * Merge fetch results into a structured output using the output schema.
 * @param {object} outputSchema - endpoint output mapping
 * @param {{ resolved: object, input?: object }} context - resolution context
 * @param {Map} fetchResults - results keyed by call name
 */
export function merge(outputSchema, context, fetchResults) {
  const resolved = context?.resolved ?? {};
  const input = context?.input;
  const data = {};
  const provenance = {};

  for (const [group, fields] of Object.entries(outputSchema)) {
    data[group] = {};
    provenance[group] = {};

    for (const [field, spec] of Object.entries(fields)) {
      if (spec.from) {
        const val = resolveFrom(spec, resolved, input);
        if (val !== undefined) {
          data[group][field] = val;
          provenance[group][field] = { source: spec.from.startsWith("input.") ? "input" : "resolved", rank: 0 };
        }
        continue;
      }

      if (spec.sources) {
        const ranked = [...spec.sources].sort((a, b) => (a.rank || 99) - (b.rank || 99));
        let found = false;

        for (const src of ranked) {
          const result = findResult(fetchResults, src.source, src.call);
          if (!result || result.status !== "ok") continue;

          let val;
          if (src.path === "$passthrough" || src.path === "$validated") {
            val = result.data;
          } else {
            val = getPath(result.data, src.path);
          }

          if (val !== null && val !== undefined && val !== "") {
            data[group][field] = val;
            provenance[group][field] = {
              source: src.source,
              rank: src.rank || 99,
              alternatives: ranked
                .filter((s) => s.source !== src.source)
                .map((s) => s.source),
            };
            if (spec.reason) provenance[group][field].reason = spec.reason;
            found = true;
            break;
          }
        }

        if (!found) {
          data[group][field] = null;
          provenance[group][field] = {
            source: null,
            attempted: ranked.map((s) => s.source),
            status: "all_sources_empty",
          };
        }
      }
    }

    if (Object.keys(data[group]).length === 0) {
      delete data[group];
      delete provenance[group];
    }
  }

  return { data, provenance };
}

function resolveFrom(spec, resolved, input) {
  if (spec.fields) {
    const obj = {};
    for (const f of spec.fields) {
      const val = resolved[f];
      if (val !== undefined && val !== null) obj[f] = val;
    }
    return Object.keys(obj).length ? obj : undefined;
  }
  const val = resolveFromPath(spec.from, resolved, input);
  if (val !== undefined && val !== null && val !== "") return val;
  if (spec.fallback) return resolveFromPath(spec.fallback, resolved, input);
  return val;
}

function resolveFromPath(path, resolved, input) {
  if (typeof path !== "string") return undefined;
  if (path === "resolved") return resolved;
  if (path.startsWith("resolved.")) return resolved[path.slice(9)];
  if (path.startsWith("input.") && input) return input[path.slice(6)];
  return resolved[path];
}

function findResult(fetchResults, source, callTool) {
  if (callTool) {
    return fetchResults.get(`${source}.${callTool}`);
  }
  for (const [key, val] of fetchResults) {
    if (key.startsWith(source + ".")) return val;
  }
  return null;
}
