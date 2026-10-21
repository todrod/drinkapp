# Handoff — next task

Everything below was verified from a clean clone on 21 Oct 2026 at commit
`f6d78c4`: install, typecheck and production build all pass.

---

## Get it running

```bash
git clone https://github.com/todrod/drinkapp.git
cd drinkapp
npm install          # ~20s, 522 packages
npm run typecheck    # must be clean before you commit
npm run web          # opens in a browser
```

`npm start` instead of `npm run web` gives you a QR code for Expo Go on a
phone. The browser is fine for this task.

**Read [`CONTEXT.md`](CONTEXT.md) first.** Section 7 is a list of traps that
have each already caused a real bug in this codebase — the shared catalog id
one is directly relevant to the task below.

---

## The task: make the cabinet readable

### The problem

Open the app, go to **Cabinet**, tap **LOAD MY BAR**, and scroll. There are 117
items and the eight gins render as *the same blue bottle*. So do the six aged
rums, and the vermouths. Only the name distinguishes them, so scanning the
cabinet is slow and it looks unfinished.

This is not a bug. `src/data/art.ts` maps ingredients to a
`{ shape, liquid }` pair, and every gin legitimately resolves to
`{ shape: 'tall', liquid: juniper }`. The art is correct; it is just not
*distinguishing*.

Note the planned image pipeline in `scripts/assets/` will **not** fix this — it
dedupes the same way, generating one asset per shape+liquid combination.

### What to build

Give each bottle a per-item identity on top of its shape and liquid, derived
from its name so it is stable across restarts and needs no new stored data.

Two changes to `src/components/IngredientArt.tsx`:

1. **A letter on the label band.** The first letter of the bottle's name, drawn
   in the dark ink colour on the existing cream label. `Monkey 47` → M,
   `Tanqueray` → T.
2. **A small deterministic hue shift.** Vary the liquid by roughly ±8% in
   lightness or hue, seeded by hashing the name, so a shelf of gins reads as a
   row of related-but-distinct bottles rather than a repeated sprite.

`IngredientArt` currently takes `{ shape, liquid, size }`. Add an optional
`seed?: string` (pass the inventory item's display name) and derive both
effects from it. **Keep it optional** — `size`-only callers must keep working.

### Acceptance

- Six gins in the cabinet are visually distinguishable at a glance.
- The shift is subtle: a gin still reads as a gin, a whiskey still reads amber.
  If a bottle changes category at a glance, the shift is too strong.
- Identical names produce identical art on every run (hash, never `Math.random`).
- Items with no name fall back to today's appearance.
- `npm run typecheck` is clean.
- Bundle stays at ~1.16 MB. This should add no assets.

### Where to look

| File | Why |
|---|---|
| `src/components/IngredientArt.tsx` | The SVG. The label band is the `Rect` at `y=42`. |
| `src/data/art.ts` | `artForCatalog()` returns the `{ shape, liquid }` pair. |
| `src/screens/CabinetScreen.tsx` | `ItemCard` renders the art — the main call site. |
| `src/screens/BuilderScreen.tsx` | Also renders it, on the step tiles. |
| `src/components/ShoppingList.tsx` | Also renders it, on list rows and suggestions. |

Three call sites. All should pass the seed.

### Watch out for

- **Do not key anything off `catalogItemId`.** Eight gins share `sp-gin` by
  design — that is the whole reason they look alike. Seed from the *inventory
  row's* `name`, which is per bottle.
- **Do not raise `liquid` to a new required prop.** Several call sites spread
  `artForCatalog(...)` straight in.
- The canonical eleven liquids in `src/data/liquids.ts` are a separate concern
  — they exist to line up with generated assets. Do not snap to them here.

---

## If that lands and you want more

In rough order of value, from `CONTEXT.md` §10:

1. The recipe editor lets you save a drink with no ingredients. It is correctly
   excluded from the generator, but the editor should say so.
2. Guests open the live link to an empty cabinet, because storage is
   per-browser. Encoding the kit into a shareable URL would fix it.
3. `@expo-google-fonts/nunito` is an unused dependency — the app moved to
   Outfit. A one-line removal.

---

## House rules

- `npm run typecheck` passes before every commit.
- Comments explain *why*, particularly where something looks wrong but is not.
- If you add an icon glyph, run `python scripts/build-icon-font.py` — the font
  is a 12 KB generated subset and an unknown glyph is a compile error.
- Accessibility: touch targets ≥44px, text ≥4.5:1 contrast, roles and labels on
  every control.
