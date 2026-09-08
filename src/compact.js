export const MAX_COMPACT_STRING = 120;

export function compactify(data) {
  const out = {};
  for (const [key, val] of Object.entries(data)) {
    if (key === "_meta" || key === "_provenance") {
      out[key] = val;
      continue;
    }
    out[key] = summarizeValue(val);
  }
  return out;
}

export function summarizeValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val !== "object") return val;

  if (Array.isArray(val)) {
    if (val.length === 0) return "[] (empty)";
    const first = val[0];
    if (typeof first !== "object" || first === null) {
      if (val.length <= 3) return val;
      return `[${val.slice(0, 2).join(", ")}, ...] (${val.length} items)`;
    }
    return {
      _length: val.length,
      _sample: summarizeValue(first),
    };
  }

  const obj = {};
  for (const [k, v] of Object.entries(val)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string") {
      obj[k] = v.length > MAX_COMPACT_STRING ? v.slice(0, MAX_COMPACT_STRING) + "…" : v;
    } else if (typeof v === "number" || typeof v === "boolean") {
      obj[k] = v;
    } else if (Array.isArray(v)) {
      if (v.length === 0) obj[k] = "[] (empty)";
      else obj[k] = `[…] (${v.length} items)`;
    } else if (typeof v === "object") {
      const keys = Object.keys(v);
      if (keys.length <= 4) {
        obj[k] = summarizeValue(v);
      } else {
        obj[k] = `{${keys.slice(0, 4).join(", ")}, …} (${keys.length} keys)`;
      }
    }
  }
  return obj;
}
