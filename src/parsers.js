export function parseTsv(text, config) {
  const sep = config?.separator || "\t";
  const columns = config?.columns;
  const lines = text.split("\n").filter((l) => l.trim());
  if (!lines.length) return [];

  if (columns) {
    return lines.map((line) => {
      const parts = line.split(sep);
      const row = {};
      columns.forEach((col, i) => { if (parts[i] !== undefined) row[col] = parts[i].trim(); });
      return row;
    });
  }

  const first = lines[0];
  if (first.includes(sep) && !first.startsWith("#")) {
    const isHeader = /^[a-zA-Z]/.test(first) && lines.length > 1 && !/^[a-zA-Z]/.test(lines[1].split(sep)[0]);
    if (isHeader) {
      const headers = first.split(sep).map((h) => h.trim());
      return lines.slice(1).map((line) => {
        const parts = line.split(sep);
        const row = {};
        headers.forEach((h, i) => { if (parts[i] !== undefined) row[h] = parts[i].trim(); });
        return row;
      });
    }
    return lines.map((line) => line.split(sep).map((c) => c.trim()));
  }

  return lines.map((l) => l.trim());
}

export function parseLines(text) {
  return text.split("\n").filter((l) => l.trim()).map((l) => l.trim());
}

export function parseKeyValue(text) {
  const result = {};
  let currentKey = null;
  let currentValues = [];

  for (const line of text.split("\n")) {
    const match = line.match(/^(\S+)\s+(.*)/);
    if (match && /^[A-Z]/.test(match[1])) {
      if (currentKey) {
        result[currentKey] = currentValues.length === 1 ? currentValues[0] : currentValues;
      }
      currentKey = match[1];
      currentValues = [match[2].trim()];
    } else if (currentKey && line.startsWith("            ")) {
      currentValues.push(line.trim());
    } else if (currentKey && line.trim() === "///") {
      result[currentKey] = currentValues.length === 1 ? currentValues[0] : currentValues;
      currentKey = null;
      currentValues = [];
    }
  }
  if (currentKey) {
    result[currentKey] = currentValues.length === 1 ? currentValues[0] : currentValues;
  }
  return result;
}

export function parseXml(text) {
  const result = {};
  const tagPattern = /<([\w][\w.-]*)([^>]*?)>([\s\S]*?)<\/\1>/g;
  let match;
  while ((match = tagPattern.exec(text)) !== null) {
    const [, tag, attrs, content] = match;
    const inner = content.trim();
    if (inner.includes("<")) {
      if (!result[tag]) result[tag] = [];
      else if (!Array.isArray(result[tag])) result[tag] = [result[tag]];
      const child = parseXml(inner);
      if (attrs.trim()) {
        attrs.replace(/([\w.-]+)=["']([^"']*?)["']/g, (_, k, v) => { child[k] = v; });
      }
      result[tag].push(child);
    } else {
      if (attrs.trim()) {
        const node = { _text: inner };
        attrs.replace(/([\w.-]+)=["']([^"']*?)["']/g, (_, k, v) => { node[k] = v; });
        if (!result[tag]) result[tag] = node;
        else if (Array.isArray(result[tag])) result[tag].push(node);
        else result[tag] = [result[tag], node];
      } else {
        result[tag] = inner;
      }
    }
  }
  return result;
}
