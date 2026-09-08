import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapParams } from "../src/request.js";

describe("mapParams", () => {
  it("maps required params", () => {
    const tool = { params: { query: { type: "string", required: true } } };
    assert.deepEqual(mapParams(tool, { query: "test" }), { query: "test" });
  });

  it("throws on missing required param", () => {
    const tool = { params: { query: { type: "string", required: true } } };
    assert.throws(() => mapParams(tool, {}), /Missing required param: query/);
  });

  it("applies defaults", () => {
    const tool = { params: { size: { type: "integer", default: 10 } } };
    assert.deepEqual(mapParams(tool, {}), { size: 10 });
  });

  it("overrides defaults with provided values", () => {
    const tool = { params: { size: { type: "integer", default: 10 } } };
    assert.deepEqual(mapParams(tool, { size: 25 }), { size: 25 });
  });

  it("applies mapsTo rename", () => {
    const tool = { params: { query: { type: "string", required: true, mapsTo: "q" } } };
    assert.deepEqual(mapParams(tool, { query: "test" }), { q: "test" });
  });

  it("applies prefix", () => {
    const tool = { params: { gene: { type: "string", required: true, prefix: "hsa:" } } };
    assert.deepEqual(mapParams(tool, { gene: "TP53" }), { gene: "hsa:TP53" });
  });

  it("skips optional params not provided", () => {
    const tool = { params: { query: { type: "string", required: true }, limit: { type: "integer" } } };
    assert.deepEqual(mapParams(tool, { query: "test" }), { query: "test" });
  });

  it("handles empty params schema", () => {
    assert.deepEqual(mapParams({}, {}), {});
    assert.deepEqual(mapParams({ params: {} }, {}), {});
  });

  it("resolves standard alias 'query' → native 'q'", () => {
    const tool = { params: { q: { type: "string", required: true } } };
    assert.deepEqual(mapParams(tool, { query: "test" }), { q: "test" });
  });

  it("resolves standard alias 'limit' → native 'pageSize'", () => {
    const tool = { params: { pageSize: { type: "integer", default: 10 } } };
    assert.deepEqual(mapParams(tool, { limit: 5 }), { pageSize: 5 });
  });

  it("resolves standard alias 'offset' → native 'page'", () => {
    const tool = { params: { page: { type: "integer", default: 1 } } };
    assert.deepEqual(mapParams(tool, { offset: 3 }), { page: 3 });
  });

  it("prefers direct param over alias", () => {
    const tool = { params: { q: { type: "string", required: true } } };
    assert.deepEqual(mapParams(tool, { q: "direct", query: "alias" }), { q: "direct" });
  });

  it("alias + mapsTo combine correctly", () => {
    const tool = { params: { q: { type: "string", required: true, mapsTo: "search_query" } } };
    assert.deepEqual(mapParams(tool, { query: "test" }), { search_query: "test" });
  });

  it("alias satisfies required param", () => {
    const tool = { params: { q: { type: "string", required: true } } };
    assert.doesNotThrow(() => mapParams(tool, { query: "test" }));
  });
});
