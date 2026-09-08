import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { parse } from "yaml";

export function loadRegistry(providersDir) {
  const sources = new Map();

  for (const file of walkYaml(providersDir)) {
    const raw = readFileSync(file, "utf-8");
    const source = parse(raw);
    if (!source?.name || !source?.tools) continue;

    sources.set(source.name, source);
  }

  return { sources };
}

export function* walkYaml(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) yield* walkYaml(full);
    else if (extname(full) === ".yaml" || extname(full) === ".yml") yield full;
  }
}
