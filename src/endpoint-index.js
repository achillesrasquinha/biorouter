export function buildEndpointIndex(endpoints) {
  const index = [];
  for (const [name, spec] of endpoints) {
    index.push({
      endpoint: name,
      description: spec.description || "",
      tags: spec.tags || [],
      input: compactInput(spec.input),
      outputGroups: spec.output ? Object.keys(spec.output) : [],
    });
  }
  return index;
}

export function compactInput(input) {
  if (!input) return "";
  return Object.entries(input)
    .map(([name, def]) => {
      const req = def.required ? " (required)" : "";
      return `${name}${req}: ${def.description || def.type || "string"}`;
    })
    .join("; ");
}

export function findEndpoints(index, query, tags) {
  const q = (query || "").toLowerCase();
  const filterTags = (tags || []).map((t) => t.toLowerCase());

  if (!q && !filterTags.length) return [...index];

  return index
    .map((entry) => {
      let score = 0;
      const haystack =
        `${entry.endpoint} ${entry.description} ${entry.tags.join(" ")} ${entry.input} ${entry.outputGroups.join(" ")}`.toLowerCase();

      if (q) {
        for (const word of q.split(/\s+/)) {
          if (haystack.includes(word)) score += 1;
        }
      }

      if (filterTags.length) {
        const entryTags = entry.tags.map((t) => t.toLowerCase());
        for (const t of filterTags) {
          if (entryTags.includes(t)) score += 2;
        }
      }

      return { ...entry, score };
    })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ score, ...rest }) => rest);
}
