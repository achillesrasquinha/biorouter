export function pluck(data, fields) {
  const isTopArray = fields.some((f) => f.startsWith("[]."));
  if (isTopArray && Array.isArray(data)) {
    const subFields = fields.filter((f) => f.startsWith("[].")).map((f) => f.slice(3));
    return data.map((item) => {
      const row = {};
      for (const sf of subFields) {
        const val = getValue(item, sf);
        if (val !== undefined) setValue(row, sf, val);
      }
      return row;
    });
  }
  const out = {};
  for (const path of fields) {
    setValue(out, path, getValue(data, path));
  }
  return out;
}

function getValue(obj, path) {
  return walk(obj, path.split("."), 0);
}

function walk(node, parts, i) {
  if (node == null || i >= parts.length) return node;
  let key = parts[i];
  if (key.endsWith("[]")) {
    key = key.slice(0, -2);
    const arr = key === "" ? node : node[key];
    if (!Array.isArray(arr)) return undefined;
    return arr.map((item) => walk(item, parts, i + 1));
  }
  return walk(node[key], parts, i + 1);
}

function setValue(obj, path, value) {
  if (value === undefined) return;
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    let key = parts[i];
    const isArr = key.endsWith("[]");
    if (isArr) key = key.slice(0, -2);
    if (!(key in cur)) cur[key] = isArr ? [] : {};
    cur = cur[key];
    if (isArr && Array.isArray(cur)) return spreadArray(cur, value, parts, i + 1);
  }
  let lastKey = parts[parts.length - 1];
  if (lastKey.endsWith("[]")) lastKey = lastKey.slice(0, -2);
  cur[lastKey] = value;
}

function spreadArray(arr, values, parts, i) {
  if (!Array.isArray(values)) return;
  for (let vi = 0; vi < values.length; vi++) {
    if (arr[vi] === undefined || arr[vi] === null) arr[vi] = {};
    if (i >= parts.length) { arr[vi] = values[vi]; continue; }
    let key = parts[i];
    const isArr = key.endsWith("[]");
    if (isArr) key = key.slice(0, -2);
    if (i === parts.length - 1) {
      arr[vi][key] = values[vi];
    } else {
      if (!(key in arr[vi])) arr[vi][key] = isArr ? [] : {};
      if (isArr && Array.isArray(values[vi])) {
        spreadArray(arr[vi][key], values[vi], parts, i + 1);
      } else {
        setValue(arr[vi], parts.slice(i).join("."), values[vi]);
      }
    }
  }
}
