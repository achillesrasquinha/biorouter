import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadRegistry, findTools } from "../src/lib/registry/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { sources, toolIndex } = loadRegistry(join(__dirname, "../src/providers"));

describe("registry", () => {
  it("loads all sources", () => {
    assert.ok(sources.size >= 6);
  });

  it("indexes tools with tags and inline params", () => {
    assert.ok(toolIndex.length > 0);
    const entry = toolIndex.find((t) => t.source === "pubchem" && t.tool === "search");
    assert.ok(entry);
    assert.ok(entry.tags.includes("compounds"));
    assert.ok(entry.params.includes("query*"));
  });

  it("findTools finds by keyword", () => {
    const results = findTools(toolIndex, "protein structure");
    assert.ok(results.length > 0);
    assert.ok(results.some((r) => r.source === "pdb"));
  });

  it("findTools filters by tag", () => {
    const results = findTools(toolIndex, null, ["chemistry"]);
    assert.ok(results.length > 0);
  });

  it("findTools returns empty for nonsense", () => {
    const results = findTools(toolIndex, "xyzzyplugh");
    assert.equal(results.length, 0);
  });

  it("findTools includes compact param signatures", () => {
    const results = findTools(toolIndex, "uniprot protein search");
    const uniprot = results.find((r) => r.source === "uniprot" && r.tool === "search");
    assert.ok(uniprot);
    assert.ok(uniprot.params.includes("query*"));
    assert.ok(uniprot.params.includes("(string)"));
  });

  it("findTools finds across overlapping sources", () => {
    const results = findTools(toolIndex, "pubchem compound search");
    const srcs = [...new Set(results.map((r) => r.source))];
    assert.ok(srcs.includes("pubchem"));
  });
});
