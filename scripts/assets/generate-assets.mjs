#!/usr/bin/env node
/**
 * Drink Shaker asset pipeline.
 *
 *   node generate-assets.mjs plan       # dedupe + write manifest. No API calls, no cost.
 *   node generate-assets.mjs generate   # generate only what's missing
 *   node generate-assets.mjs generate --force        # regenerate everything
 *   node generate-assets.mjs generate --only=glass   # bottle | glass | garnish
 *
 * Env:
 *   IMAGE_API_KEY   required for `generate`
 *   IMAGE_MODEL     defaults below — confirm the current model id before a big run
 *
 * Only dependency is sharp (post-processing). Everything else is stdlib.
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// fileURLToPath, not URL.pathname: on Windows the latter yields "/C:/..."
// and path.join then produces "C:\C:\...".
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(ROOT, "out/raw");
const WEB_DIR = path.join(ROOT, "out/web");
const MANIFEST = path.join(ROOT, "asset-manifest.json");

const MODEL = process.env.IMAGE_MODEL || "gemini-2.5-flash-image";
const API_KEY = process.env.IMAGE_API_KEY;
const CONCURRENCY = 3;
const SIZES = [512, 256, 128];

// ---------------------------------------------------------------- planning

const readJson = async (p) => JSON.parse(await fs.readFile(p, "utf8"));

function buildSpecs(inventory, tax) {
  const specs = new Map(); // key -> spec (Map dedupes for free)

  // 1. Bottles — the big win. ~117 inventory items collapse to the set of
  //    shape+liquid pairs that actually occur.
  for (const item of inventory.items) {
    const { shape, liquid } = item;
    if (!tax.shapes[shape]) throw new Error(`${item.id}: unknown shape "${shape}"`);
    if (!tax.liquids[liquid]) throw new Error(`${item.id}: unknown liquid "${liquid}"`);
    const key = `bottle/${shape}--${liquid}`;
    if (!specs.has(key)) {
      specs.set(key, {
        key,
        kind: "bottle",
        shape,
        liquid,
        hex: tax.liquids[liquid].hex,
        prompt: `${tax.shapes[shape]}, ${tax.liquids[liquid].desc}, ${tax.styleSuffix}`,
        usedBy: [],
      });
    }
    specs.get(key).usedBy.push(item.id);
  }

  // 2. Glassware — one per glass type, empty. Liquid is a tinted layer at render time.
  for (const [id, desc] of Object.entries(tax.glassware)) {
    specs.set(`glass/${id}`, {
      key: `glass/${id}`,
      kind: "glass",
      prompt: `${desc}, ${tax.styleSuffix}`,
      usedBy: [],
    });
  }

  // 3. Garnishes — floated over the glass layer.
  for (const [id, desc] of Object.entries(tax.garnishes)) {
    specs.set(`garnish/${id}`, {
      key: `garnish/${id}`,
      kind: "garnish",
      prompt: `${desc}, ${tax.styleSuffix}`,
      usedBy: [],
    });
  }

  return [...specs.values()];
}

async function plan() {
  const inventory = await readJson(path.join(ROOT, "inventory.json"));
  const tax = await readJson(path.join(ROOT, "taxonomy.json"));
  const specs = buildSpecs(inventory, tax);

  await fs.writeFile(
    MANIFEST,
    JSON.stringify({ generatedAt: new Date().toISOString(), model: MODEL, specs }, null, 2)
  );

  const by = (k) => specs.filter((s) => s.kind === k).length;
  console.log(`inventory items      ${inventory.items.length}`);
  console.log(`bottle assets        ${by("bottle")}   (dedupe: ${inventory.items.length} -> ${by("bottle")})`);
  console.log(`glassware assets     ${by("glass")}`);
  console.log(`garnish assets       ${by("garnish")}`);
  console.log(`TOTAL TO GENERATE    ${specs.length}`);
  console.log(`\nmanifest -> ${MANIFEST}`);

  const flagged = inventory.items.filter((i) => i.check);
  if (flagged.length) {
    console.log(`\nverify these normalized names before you ship labels:`);
    for (const f of flagged) console.log(`  - ${f.id}: ${f.name}`);
  }
  return specs;
}

// -------------------------------------------------------------- generation

async function callImageApi(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p) => p.inlineData?.data);
  if (!img) throw new Error(`no image in response: ${JSON.stringify(data).slice(0, 300)}`);
  return Buffer.from(img.inlineData.data, "base64");
}

async function postProcess(sharp, rawPath, key) {
  // trim() removes the flat transparent border so every asset is tight to its
  // subject — that alone kills most of the "inconsistent sizing" look.
  const base = sharp(rawPath).trim({ threshold: 10 });
  for (const size of SIZES) {
    const outPath = path.join(WEB_DIR, `${key}@${size}.webp`);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await base
      .clone()
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 88, alphaQuality: 100 })
      .toFile(outPath);
  }
}

async function generate() {
  if (!API_KEY) {
    console.error("IMAGE_API_KEY not set. Run `plan` first — it costs nothing.");
    process.exit(1);
  }

  let sharp;
  try {
    ({ default: sharp } = await import("sharp"));
  } catch {
    console.error("sharp is required for post-processing:  npm i sharp");
    process.exit(1);
  }

  const force = process.argv.includes("--force");
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg ? onlyArg.split("=")[1] : null;

  const { specs } = await readJson(MANIFEST).catch(async () => ({ specs: await plan() }));

  let queue = specs;
  if (only) queue = queue.filter((s) => s.kind === only);
  if (!force) {
    const pending = [];
    for (const s of queue) {
      const exists = await fs
        .access(path.join(RAW_DIR, `${s.key}.png`))
        .then(() => true)
        .catch(() => false);
      if (!exists) pending.push(s);
    }
    queue = pending;
  }

  if (!queue.length) return console.log("nothing to generate — everything is cached.");
  console.log(`generating ${queue.length} assets with ${MODEL}\n`);

  let done = 0;
  const failures = [];

  const worker = async () => {
    for (;;) {
      const spec = queue.shift();
      if (!spec) return;
      const rawPath = path.join(RAW_DIR, `${spec.key}.png`);
      try {
        await fs.mkdir(path.dirname(rawPath), { recursive: true });
        const buf = await callImageApi(spec.prompt);
        await fs.writeFile(rawPath, buf);
        await postProcess(sharp, rawPath, spec.key);
        console.log(`  ok    ${String(++done).padStart(3)}  ${spec.key}`);
      } catch (err) {
        failures.push({ key: spec.key, error: err.message });
        console.log(`  FAIL  ${String(++done).padStart(3)}  ${spec.key} — ${err.message}`);
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`\nraw -> ${RAW_DIR}\nweb -> ${WEB_DIR}`);
  if (failures.length) {
    console.log(`\n${failures.length} failed. Re-run without --force to retry only those.`);
  }
}

// -------------------------------------------------------------------- main

const cmd = process.argv[2];
if (cmd === "plan") await plan();
else if (cmd === "generate") await generate();
else {
  console.log("usage: node generate-assets.mjs [plan|generate] [--force] [--only=bottle|glass|garnish]");
  process.exit(1);
}
