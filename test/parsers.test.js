import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseTsv, parseLines, parseKeyValue, parseXml } from "../src/parsers.js";

describe("parseTsv", () => {
  it("parses with explicit columns", () => {
    const text = "abc\t123\ndef\t456";
    const result = parseTsv(text, { columns: ["name", "value"] });
    assert.deepEqual(result, [
      { name: "abc", value: "123" },
      { name: "def", value: "456" },
    ]);
  });

  it("parses with custom separator", () => {
    const text = "a;b\nc;d";
    const result = parseTsv(text, { separator: ";" });
    assert.deepEqual(result, [["a", "b"], ["c", "d"]]);
  });

  it("returns trimmed lines for plain text", () => {
    const text = "line1\nline2\n";
    assert.deepEqual(parseTsv(text), ["line1", "line2"]);
  });

  it("handles empty input", () => {
    assert.deepEqual(parseTsv(""), []);
    assert.deepEqual(parseTsv("  \n  "), []);
  });
});

describe("parseLines", () => {
  it("splits and trims lines", () => {
    assert.deepEqual(parseLines("  a\n  b \n\n c"), ["a", "b", "c"]);
  });

  it("handles empty input", () => {
    assert.deepEqual(parseLines(""), []);
  });
});

describe("parseKeyValue", () => {
  it("parses KEGG-style key-value format", () => {
    const text = "ENTRY       hsa:7157\nNAME        TP53\n///\n";
    const result = parseKeyValue(text);
    assert.equal(result.ENTRY, "hsa:7157");
    assert.equal(result.NAME, "TP53");
  });

  it("handles multi-value keys", () => {
    const text = "NAME        line1\n            line2\n///\n";
    const result = parseKeyValue(text);
    assert.deepEqual(result.NAME, ["line1", "line2"]);
  });
});

describe("parseXml", () => {
  it("parses simple tags", () => {
    const xml = "<name>TP53</name><id>7157</id>";
    const result = parseXml(xml);
    assert.equal(result.name, "TP53");
    assert.equal(result.id, "7157");
  });

  it("parses nested tags", () => {
    const xml = "<gene><name>TP53</name></gene>";
    const result = parseXml(xml);
    assert.ok(Array.isArray(result.gene));
    assert.equal(result.gene[0].name, "TP53");
  });

  it("parses attributes", () => {
    const xml = '<item id="1">test</item>';
    const result = parseXml(xml);
    assert.equal(result.item._text, "test");
    assert.equal(result.item.id, "1");
  });

  it("converts leaf to array when same tag appears as nested", () => {
    const xml = "<data>text</data><data><child>nested</child></data>";
    const result = parseXml(xml);
    assert.ok(Array.isArray(result.data));
    assert.equal(result.data[0], "text");
    assert.equal(result.data[1].child, "nested");
  });
});
