# Drink Shaker — asset pipeline

117 inventory items → **74 generated assets**. That's the whole idea: nothing is
generated per-bottle, only per shape+liquid combination.

| class     | count | why |
|-----------|-------|-----|
| bottles   | 49    | 9 shapes × the 11 liquid colours that actually occur |
| glassware | 10    | one per glass type, empty — liquid is tinted in code |
| garnishes | 15    | floated over the glass layer |

## Run it

```bash
npm i sharp
node generate-assets.mjs plan                 # free, no API calls
export IMAGE_API_KEY=...
node generate-assets.mjs generate             # only what's missing
node generate-assets.mjs generate --only=glass
```

Output lands in `out/raw/*.png` (originals, kept for re-processing) and
`out/web/**@{512,256,128}.webp` (what you ship).

Re-running `generate` is safe — it skips anything already in `out/raw`, so a
partial or failed run just resumes. `--force` is the only thing that re-bills you.

## The style contract

`taxonomy.json → styleSuffix` is appended byte-identically to all 74 prompts.
That string is doing the consistency work, not the individual descriptions.
**Don't tweak it between batches.** If you change it, delete `out/` and
regenerate everything, or half your assets will visibly drift.

## Rendering a recipe card

Three stacked layers in one container, absolutely positioned:

1. `glass/{glassware}@256.webp`
2. a liquid fill — the glass silhouette masked to `liquids[x].hex` from taxonomy
3. `garnish/{garnish}@256.webp`

Add `glassware` and `garnish` fields to your 96 recipes and the cards fill
themselves. Use the same `hex` for the card's gradient so a whiskey drink reads
amber and a Negroni reads red, instead of the current random colour per card.

## Before you ship

- The bottles are deliberately **unlabelled**. Don't prompt for real labels —
  those are live trademarks. Render the brand name as text over the bottle.
- Seven names in `inventory.json` are marked `"check": true` where I corrected
  spelling from your raw list. Worth a glance.
- Confirm `IMAGE_MODEL` is a current model id before a 74-call run; do a
  `--only=glass` pass (10 images) first as a smoke test and to approve the look.
