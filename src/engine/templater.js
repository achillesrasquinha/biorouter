/**
 * Resolves "{input.query}" and "{resolved.inchikey}" style templates in params.
 * Handles strings, arrays, and nested objects.
 */
export function template(params, context) {
  if (typeof params === "string") return resolveString(params, context);
  if (Array.isArray(params)) return params.map((v) => template(v, context));
  if (params && typeof params === "object") {
    const out = {};
    for (const [k, v] of Object.entries(params)) out[k] = template(v, context);
    return out;
  }
  return params;
}

function resolveString(str, context) {
  return str.replace(/\{([^}]+)\}/g, (_, path) => {
    const val = getPath(context, path);
    return val ?? "";
  });
}

/**
 * Evaluates skip_if expressions.
 * Supports: "!resolved.x", "!resolved.x || !resolved.y", "resolved.x && resolved.y"
 */
export function shouldSkip(expr, context) {
  if (!expr) return false;
  if (expr.includes("||")) {
    return expr.split("||").map((s) => s.trim()).some((part) => shouldSkip(part, context));
  }
  if (expr.includes("&&")) {
    return expr.split("&&").map((s) => s.trim()).every((part) => shouldSkip(part, context));
  }
  const negated = expr.startsWith("!");
  const path = negated ? expr.slice(1).trim() : expr.trim();
  const val = getPath(context, path);
  const truthy = val !== null && val !== undefined && val !== "" && val !== false;
  if (typeof val === "object" && Array.isArray(val) && val.length === 0) return negated;
  return negated ? truthy === false : truthy === true;
}

/**
 * Extracts a value from data using a dot-path.
 * Supports array indexing: "hits[0].name" and simple JMESPath-like filters: "arr[?key=='val'].field[0]"
 */
export function getPath(obj, path) {
  if (obj == null || !path) return undefined;
  const parts = tokenize(path);
  let cur = obj;
  for (const part of parts) {
    if (cur == null) return undefined;

    if (part.filter) {
      if (!Array.isArray(cur)) return undefined;
      cur = cur.filter((item) => String(item[part.filter.key]) === part.filter.value);
      if (part.filter.field) cur = cur.map((item) => item[part.filter.field]);
      continue;
    }

    if (part.index !== undefined) {
      cur = cur[part.key];
      if (!Array.isArray(cur)) return undefined;
      cur = cur[part.index];
      continue;
    }

    cur = cur[part.key];
  }
  return cur;
}

function tokenize(path) {
  const parts = [];
  for (const segment of path.split(".")) {
    const filterMatch = segment.match(/^\[?\?(\w+)==['\"]([^'\"]+)['\"]\]\.?(.+)?$/);
    if (filterMatch) {
      const trail = filterMatch[3];
      let field, idx;
      if (trail) {
        const idxMatch = trail.match(/^(\w+)\[(\d+)\]$/);
        if (idxMatch) { field = idxMatch[1]; idx = parseInt(idxMatch[2]); }
        else field = trail;
      }
      parts.push({
        filter: { key: filterMatch[1], value: filterMatch[2], field },
        index: idx,
      });
      continue;
    }

    const arrMatch = segment.match(/^(\w+)\[(\d+)\]$/);
    if (arrMatch) {
      parts.push({ key: arrMatch[1], index: parseInt(arrMatch[2]) });
      continue;
    }

    parts.push({ key: segment });
  }
  return parts;
}
