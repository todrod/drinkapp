# The Drink Shaker — project context

Handover document for another engineer or coding agent. Written 25 Sep 2026
against commit `0db0e87`.

---

## 1. What this is

A party drink app. You tell it what bottles you own; it only ever suggests
drinks you can actually pour. Four tabs:

| Tab | Does |
|---|---|
| **Random** | Spin (or physically shake the phone) for a drink you can make right now |
| **Cabinet** | Your inventory — add, remove, track how much is left |
| **Recipes** | 96-recipe searchable library with filters, ratings, favourites |
| **Builder** | Pick a base, mixers and toppings from stock; see what it matches |

| | |
|---|---|
| **Live** | https://drinkapp-rust.vercel.app |
| **Repo** | https://github.com/todrod/drinkapp (branch `main`) |
| **Spec** | `docs/SPEC.html` in this repo — the original architecture document |
| **Local path** | `C:\Users\todro\Desktop\projects\drinking app\shaker` |

The repo root **is** the Expo project. There is no nesting.

---

## 2. Running it

```bash
npm install
npm start                  # Expo dev server; scan QR with Expo Go
npm run web                # browser instead
npm run typecheck          # tsc --noEmit
npm run build:web          # static export + PWA injection -> dist/
```

**Deployment is automatic.** Vercel builds on every push to `main` using
`vercel.json`, which runs `npx expo export --platform web && node
scripts/postbuild.mjs` and serves `dist/`. No dashboard config needed.

Current export: **~1.15 MB**, 3 font files.

---

## 3. Stack

Expo SDK 57 · React Native 0.86 · TypeScript · React 19.

| Concern | Choice |
|---|---|
| Local data | `expo-sqlite` on native, `localStorage` on web |
| State | React context + in-memory mirror (`src/store.tsx`) |
| Graphics | `react-native-svg` (ingredient art, ambient background) |
| Animation | React Native's built-in `Animated` — **not** Reanimated |
| Icons | `@expo/vector-icons` MaterialCommunityIcons, subset to 12 KB |
| Sensors | `expo-sensors` accelerometer for shake-to-spin |

**No Reanimated, no Skia, no navigation library.** Tab switching is a
`useState` in `App.tsx`. Skia was evaluated and rejected: on web it loads 2.9 MB
of CanvasKit wasm, more than double the whole bundle.

---

## 4. File map

```
App.tsx                   Shell, font loading, tab state, age gate
src/
  types.ts                All data models
  theme.ts                Colour/spacing/type tokens, SHADOW helper
  icons.tsx               Icon component + glyph maps (subset font)
  format.ts               Measure formatting (0.75 -> ¾)
  store.tsx               Context provider: kit, recipes, prefs, mutators
  logic/generator.ts      *** The matching algorithm. Start here. ***
  db/
    store.ts              Native persistence (SQLite, schema v3)
    store.web.ts          Web persistence (localStorage)
  data/
    catalog.ts            95 base catalog items
    bar.ts                52 more catalog items + MY_BAR (the owner's shelf)
    recipes.ts            59 core recipes; assembles all 96
    library.ts            12 public-domain book recipes + 24 themed
    seed.ts               Shared authoring types + theme definitions
    art.ts                Per-ingredient bottle shape + liquid colour
    liquids.ts            Canonical 11-liquid palette; recipe accent colour
  components/
    ui.tsx                Panel, Chip, buttons, Press, Stars, QuantityBar
    NavPill.tsx           Floating glass tab bar
    Atmosphere.tsx        Drifting background fields + grain overlay
    IngredientArt.tsx     Parametric SVG bottles
  screens/                One per tab, plus AgeGate
  hooks/useShakeDetector.ts
  api/trending.ts         DEFERRED feature — types only, no network
scripts/
  postbuild.mjs           Injects PWA manifest/meta/SW into dist/index.html
  build-icon-font.py      Subsets the icon font (run after adding an icon)
  assets/                 Image-generation pipeline (see §8)
public/                   manifest, service worker, icons — copied to dist/
docs/SPEC.html            Original architecture spec
```

---

## 5. Domain model

Three tables, and one idea that makes the whole thing work.

**`CatalogItem`** — the bundled library of ~147 known ingredients. Stable ids
like `sp-gin`, `mx-lime-juice`, `lq-campari`. Ships with the app.

**`InventoryItem`** — what the user owns. Points at a catalog item via
`catalogItemId`, or is free text with `catalogItemId: null`.

**`DrinkRecipe`** — has `ingredients: RecipeIngredient[]`, each of which also
points at a `catalogItemId`.

> **The key idea:** a recipe ingredient references a *catalog id*, not a string.
> So "can I pour this?" is a set lookup, not fuzzy name matching.

`InventoryItem.level` is a four-stop enum — `full | half | low | out`. It
renders as a slider but **`out` must stay a distinct state**, because the
generator excludes those items.

---

## 6. The matching algorithm — `src/logic/generator.ts`

This is the heart of the product. Read this file first.

**Resolution order** for each ingredient:
1. User owns the exact `catalogItemId`, **or**
2. it is a staple (ice, salt — always assumed present), **or**
3. user typed the name freehand and it matches, **or**
4. *(only if substitutions are enabled)* user owns something the catalog lists
   as a substitute.

**Hard vs soft roles.** A missing `base`, `modifier`, `mixer` or `sweetener`
kills the match. A missing `garnish` or `ice` only adds a note — nobody is short
a drink because they have no cherries.

**Scoring.** Never-made outranks made-before; the last three results are pushed
down; exact matches outrank substituted; favourites get a lift. The pick is
*weighted-random from the top half*, not strictly best — a deterministic
"random" button gets boring immediately.

**Misses are typed, never empty.** When nothing matches, `generate()` returns a
`GeneratorMiss` with a reason, and the UI names the fix:

| Reason | UI says |
|---|---|
| `filters` | "Filters are too tight — N drinks match without them" |
| `nearly` | "You're one bottle away — add lime juice and 6 drinks unlock" |
| `empty` | "Nothing makes a full drink yet" |

**These fallbacks are the feature, not an edge case.** Do not let a refactor
turn them back into an empty state.

---

## 7. Non-obvious things that will bite you

These each cost real debugging time. They are the main reason this document
exists.

### Several bottles deliberately share one catalog id
Eight gins all resolve `sp-gin`. That is intentional — recipes match while the
cabinet still shows the eight real bottles. **Anything that keys off catalog id
will treat them as one thing.** The Builder originally keyed selection by
catalog id and selecting one gin selected all of them; it now keys by inventory
row id. Expect this class of bug anywhere you group or select ingredients.

### React Native Web ignores `shadowRadius`
Native shadow props render as a hard offset rectangle instead of a blur. The
`shadow()` helper in `theme.ts` emits a real `boxShadow` string on web and keeps
native props elsewhere. Do not add raw `shadow*` props to a style.

### A glow must sit on an element that already has the border radius
On a square parent the halo stops at the rectangle and a pill's corners show as
dark notches.

### `Press` puts its style on the `Pressable`, not the inner view
Sizing (`width`, `flex`) has to live on the element the parent lays out, or a
grid of cards collapses into shrink-wrapped columns.

### Never import from `@expo/vector-icons` root
The index imports every icon set and therefore every bundled font — about 4 MB
of TTFs. Import `@expo/vector-icons/build/createIconSet` directly.

### The icon font is a generated subset
`assets/fonts/ShakerIcons.ttf` is 12 KB, subset from a 1.3 MB face. After
referencing a new glyph, run `python scripts/build-icon-font.py`. `GlyphName` is
typed off the generated map, so an out-of-subset glyph is a **compile error**,
not a blank box. Outputs are committed so Vercel needs no Python.

### `expo-sqlite` cannot be in the web bundle
Its native module has no web build and the static export fails. That is why
persistence is split into `store.ts` / `store.web.ts` — Metro resolves by
platform. Do not add a `Platform.OS` check inside one file; the import alone
breaks the build.

### The service worker will serve a stale app if you are careless
A plain `fetch()` still consults the HTTP cache. `public/sw.js` uses
`cache: 'no-store'` on navigations for exactly this reason. Bump `CACHE` when
changing the worker.

### Empty recipes used to be "pourable"
A recipe with no ingredients satisfies "every required ingredient resolves"
vacuously. Matching now requires at least one non-optional hard-role ingredient.

### Seed recipes merge by id
`loadRecipes()` adds seed recipes the store has not seen, so a library added in
a later release reaches existing installs — while user edits are never
overwritten. Id prefixes (`seed-`, `book-`, `theme-`) are stable per collection;
**renumbering breaks the merge.**

---

## 8. Data and assets

**The owner's real bar** is encoded as `MY_BAR` in `src/data/bar.ts` — 116
bottles, mixers and bitters, with near-empties pre-marked `low`. Loaded by the
"Load my bar" button on the empty Cabinet screen. With it loaded, **81 of the
96 recipes are pourable.**

**Recipe sources.** 59 core + 12 from bartending manuals that are public domain
in the US (Jerry Thomas 1862/1876/1887, Ensslin 1917, Kappeler 1895, each
carrying attribution) + 24 themed across four collections. *The Savoy Cocktail
Book* (1930) is deliberately excluded — its status could not be settled.

**Ingredient art** is parametric SVG, not images: a silhouette by vessel type
filled with a per-ingredient liquid colour. ~150 icons for a few kilobytes.

**Card colour comes from the drink.** `accentForRecipe()` in `liquids.ts` takes
the base spirit's colour, so cognac reads brown and gin reads juniper. It
deliberately does *not* snap to the canonical eleven liquids — that set is warm
by design, and snapping sent gin to cream.

**`scripts/assets/`** is an image-generation pipeline: 117 inventory items
collapse to 74 assets (49 bottles as shape × liquid, 10 glasses, 15 garnishes).
`node generate-assets.mjs plan` is free and verified. **`generate` has never
been run** — it needs a Google Generative Language API key and is billed. The
`styleSuffix` in `taxonomy.json` is what keeps 74 separate generations looking
like one set; do not edit it between batches.

---

## 9. Deliberate decisions that look like mistakes

- **Trending is not built.** It was descoped by the owner. `src/api/trending.ts`
  has the types settled and `TRENDING_ENDPOINT = null`. There is no tab. Wiring
  it up means standing up a caching proxy and setting that one constant.
- **No Drizzle ORM**, despite the spec calling for it. Hand-written DDL with
  `PRAGMA user_version` migrations (currently **schema v3**). Schema is
  unchanged, so Drizzle can be layered on later.
- **Only the name is required** to save a recipe. A half-entered recipe at a
  party beats a form that will not close.
- **No drinking games, timers or anything rewarding speed or volume.** Scope
  decision, not an oversight. Age gate is blocking on first launch.
- **Themed drink names are evocative rather than lifted** from any one
  franchise, because the app is publicly hosted.

---

## 10. State and open work

**Everything builds and ships.** Typecheck clean, all links resolve, every flow
exercised against the live deployment. Last audit found three defects, all
fixed in `0db0e87`.

Known open items, roughly by value:

1. **The cabinet is a wall of identical bottles.** Six gins render the same;
   only the name differs. The asset pipeline will not fix this — it dedupes the
   same way. Needs a per-bottle differentiator.
2. **No shopping list.** The generator already computes "add lime juice →
   unlocks 6 drinks" but nothing turns that into a list. Cheapest real feature
   win available.
3. **The editor can create a drink that can never be poured** (no ingredients).
   It is correctly excluded from the generator but should say so.
4. **Guests land with an empty cabinet** — storage is per-browser, so the
   116-bottle bar is in the code but not the URL.
5. **The site is publicly indexable** behind a client-side-only age gate.
6. **`@expo-google-fonts/nunito` is an unused dependency** — the app moved to
   Outfit. Safe to remove.
7. Trending, per §9.

---

## 11. Conventions

- TypeScript strict; `npm run typecheck` must pass before commit.
- Comments explain *why*, especially where something looks wrong but is not.
- Accessibility: touch targets ≥44px (chips use `hitSlop`), text ≥4.5:1
  contrast, `accessibilityRole`/`accessibilityLabel` on every control,
  reduced-motion respected.
- No secrets in the client. The trending proxy exists precisely so a search key
  never ships in the bundle.
