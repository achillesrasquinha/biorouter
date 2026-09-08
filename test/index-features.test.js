import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compactify, summarizeValue } from "../src/compact.js";
import { findEndpoints } from "../src/endpoint-index.js";

// Simulates execEndpoint field filtering and compact logic
// (mirrors the refactored logic in index.js)
function applyOpts(result, opts = {}) {
  if (opts.fields) {
    const filtered = {};
    for (const f of opts.fields) {
      if (result[f] !== undefined) filtered[f] = result[f];
      if (opts.provenance && result._provenance?.[f]) {
        (filtered._provenance ??= {})[f] = result._provenance[f];
      }
    }
    if (result._meta) filtered._meta = result._meta;
    if (opts.compact) return compactify(filtered);
    return filtered;
  }

  const { _provenance, ...out } = result;
  if (opts.provenance) out._provenance = _provenance;
  if (opts.compact) return compactify(out);
  return out;
}

// ---- Tests ----

describe("compactify", () => {
  it("preserves _meta and _provenance as-is", () => {
    const data = {
      _meta: { endpoint: "test", sources: [] },
      _provenance: { identity: { source: "x" } },
      identity: { name: "aspirin" },
    };
    const result = compactify(data);
    assert.deepEqual(result._meta, data._meta);
    assert.deepEqual(result._provenance, data._provenance);
  });

  it("passes through primitives", () => {
    const data = { count: 42, label: "test", active: true };
    const result = compactify(data);
    assert.equal(result.count, 42);
    assert.equal(result.label, "test");
    assert.equal(result.active, true);
  });

  it("summarizes empty arrays", () => {
    const data = { items: [] };
    const result = compactify(data);
    assert.equal(result.items, "[] (empty)");
  });

  it("summarizes primitive arrays <= 3", () => {
    assert.deepEqual(summarizeValue(["a", "b"]), ["a", "b"]);
    assert.deepEqual(summarizeValue(["a", "b", "c"]), ["a", "b", "c"]);
  });

  it("summarizes primitive arrays > 3", () => {
    const result = summarizeValue(["a", "b", "c", "d", "e"]);
    assert.equal(result, "[a, b, ...] (5 items)");
  });

  it("summarizes object arrays with sample", () => {
    const arr = [
      { name: "aspirin", id: 1 },
      { name: "ibuprofen", id: 2 },
    ];
    const result = summarizeValue(arr);
    assert.equal(result._length, 2);
    assert.deepEqual(result._sample, { name: "aspirin", id: 1 });
  });

  it("truncates long strings at 120 chars", () => {
    const long = "x".repeat(200);
    const result = summarizeValue({ desc: long });
    assert.equal(result.desc.length, 121); // 120 + "…"
    assert(result.desc.endsWith("…"));
  });

  it("summarizes nested arrays as count", () => {
    const obj = { items: [1, 2, 3, 4, 5] };
    const result = summarizeValue(obj);
    assert.equal(result.items, "[…] (5 items)");
  });

  it("summarizes deep objects with > 4 keys", () => {
    const obj = {
      nested: { a: 1, b: 2, c: 3, d: 4, e: 5 },
    };
    const result = summarizeValue(obj);
    assert.equal(result.nested, "{a, b, c, d, …} (5 keys)");
  });

  it("recursively summarizes objects with <= 4 keys", () => {
    const obj = { nested: { a: 1, b: "hello" } };
    const result = summarizeValue(obj);
    assert.deepEqual(result.nested, { a: 1, b: "hello" });
  });

  it("skips null/undefined values in objects", () => {
    const obj = { a: "keep", b: null, c: undefined, d: 42 };
    const result = summarizeValue(obj);
    assert.deepEqual(result, { a: "keep", d: 42 });
  });
});

describe("findEndpoints", () => {
  const index = [
    {
      endpoint: "compound/profile",
      description: "Profile a drug or compound",
      tags: ["compound", "drug", "pharmacology"],
      input: "query (required): Drug name or ID",
      outputGroups: ["identity", "structure", "safety"],
    },
    {
      endpoint: "disease/profile",
      description: "Profile a disease",
      tags: ["disease", "phenotype", "genetics"],
      input: "query (required): Disease name or ID",
      outputGroups: ["identity", "ontology", "geneTargets"],
    },
    {
      endpoint: "protein/profile",
      description: "Profile a protein",
      tags: ["protein", "structure"],
      input: "query (required): Protein name or UniProt ID",
      outputGroups: ["identity", "structure", "domains"],
    },
  ];

  it("returns all when no query or tags", () => {
    const results = findEndpoints(index, null, null);
    assert.equal(results.length, 3);
  });

  it("matches keyword in description", () => {
    const results = findEndpoints(index, "drug", null);
    assert.equal(results[0].endpoint, "compound/profile");
  });

  it("matches keyword in tags", () => {
    const results = findEndpoints(index, "genetics", null);
    assert.equal(results[0].endpoint, "disease/profile");
  });

  it("boosts tag filter matches", () => {
    const results = findEndpoints(index, null, ["protein"]);
    assert.equal(results[0].endpoint, "protein/profile");
  });

  it("combines query + tag scoring", () => {
    const results = findEndpoints(index, "structure", ["compound"]);
    assert.equal(results[0].endpoint, "compound/profile");
  });

  it("returns empty for non-matching query", () => {
    const results = findEndpoints(index, "zzzznothing", null);
    assert.equal(results.length, 0);
  });

  it("matches outputGroup keywords", () => {
    const results = findEndpoints(index, "safety", null);
    assert.equal(results[0].endpoint, "compound/profile");
  });

  it("strips score from returned entries", () => {
    const results = findEndpoints(index, "drug", null);
    assert.equal(results[0].score, undefined);
  });
});

describe("execEndpoint options", () => {
  const mockResult = {
    identity: { name: "aspirin", ids: { chembl: "CHEMBL25" } },
    structure: { smiles: "CC(=O)Oc1ccccc1C(O)=O", formula: "C9H8O4" },
    safety: { adverseEvents: [{ term: "nausea", count: 100 }] },
    _meta: { endpoint: "compound/profile", sources: [] },
    _provenance: {
      identity: { name: { source: "mychem" } },
      structure: { smiles: { source: "chembl" } },
      safety: { adverseEvents: { source: "openfda" } },
    },
  };

  it("fields filters to requested groups only", () => {
    const result = applyOpts(mockResult, { fields: ["identity"] });
    assert.ok(result.identity);
    assert.equal(result.structure, undefined);
    assert.equal(result.safety, undefined);
    assert.ok(result._meta);
    assert.equal(result._provenance, undefined);
  });

  it("fields + provenance includes filtered provenance", () => {
    const result = applyOpts(mockResult, {
      fields: ["identity", "structure"],
      provenance: true,
    });
    assert.ok(result.identity);
    assert.ok(result.structure);
    assert.equal(result.safety, undefined);
    assert.ok(result._provenance.identity);
    assert.ok(result._provenance.structure);
    assert.equal(result._provenance.safety, undefined);
  });

  it("compact returns shape summary", () => {
    const result = applyOpts(mockResult, { compact: true });
    assert.ok(result.identity);
    assert.ok(result.structure);
    assert.ok(result.safety);
    // nested arrays inside objects get string summary form
    assert.equal(result.safety.adverseEvents, "[…] (1 items)");
  });

  it("fields + compact combines both", () => {
    const result = applyOpts(mockResult, {
      fields: ["safety"],
      compact: true,
    });
    assert.ok(result.safety);
    assert.equal(result.identity, undefined);
    assert.equal(result.safety.adverseEvents, "[…] (1 items)");
  });

  it("provenance false strips _provenance", () => {
    const result = applyOpts(mockResult, { provenance: false });
    assert.equal(result._provenance, undefined);
    assert.ok(result._meta);
  });

  it("provenance true keeps _provenance", () => {
    const result = applyOpts(mockResult, { provenance: true });
    assert.ok(result._provenance);
    assert.ok(result._provenance.identity);
  });

  it("no options returns all groups without provenance", () => {
    const result = applyOpts(mockResult, {});
    assert.ok(result.identity);
    assert.ok(result.structure);
    assert.ok(result.safety);
    assert.ok(result._meta);
    assert.equal(result._provenance, undefined);
  });

  it("fields with non-existent group returns empty + _meta", () => {
    const result = applyOpts(mockResult, { fields: ["nonexistent"] });
    assert.equal(result.nonexistent, undefined);
    assert.ok(result._meta);
  });
});
