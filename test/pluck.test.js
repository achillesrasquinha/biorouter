import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pluck } from "../src/pluck.js";

describe("pluck", () => {
  it("extracts top-level fields", () => {
    const data = { name: "TP53", id: 123, extra: "ignored" };
    assert.deepEqual(pluck(data, ["name", "id"]), { name: "TP53", id: 123 });
  });

  it("extracts nested fields", () => {
    const data = { gene: { symbol: "BRCA1", id: 1 }, other: "x" };
    assert.deepEqual(pluck(data, ["gene.symbol"]), { gene: { symbol: "BRCA1" } });
  });

  it("handles array spread with []. prefix", () => {
    const data = [
      { name: "A", score: 1 },
      { name: "B", score: 2 },
    ];
    const result = pluck(data, ["[].name", "[].score"]);
    assert.deepEqual(result, [{ name: "A", score: 1 }, { name: "B", score: 2 }]);
  });

  it("handles nested array access with []", () => {
    const data = { results: [{ id: 1 }, { id: 2 }] };
    assert.deepEqual(pluck(data, ["results[].id"]), { results: [{ id: 1 }, { id: 2 }] });
  });

  it("returns undefined paths gracefully", () => {
    const data = { a: 1 };
    const result = pluck(data, ["a", "b.c"]);
    assert.equal(result.a, 1);
    assert.equal(result.b, undefined);
  });

  it("handles empty fields array", () => {
    assert.deepEqual(pluck({ a: 1 }, []), {});
  });
});
