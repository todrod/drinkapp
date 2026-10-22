# The Drink Shaker — project context

## Random recipe sources · 22 October 2026

Discover's **Pick from** control switches **All recipes / My inventory** for
tap, keyboard and phone-shake selection. All recipes works without stock;
every complete recipe matching the idea, mood, theme and alcohol-free setting
is eligible. Inventory mode retains strict makeability and substitutions.
`generate()` still defaults to inventory for callers that omit `source`.

The optional local preference `randomSource` is resolved and saved once:
empty/out-of-stock bars start in All recipes; stocked legacy bars keep My
inventory. Explicit choices persist through reloads and stock changes, remain
separate per local bar, and round-trip through backups. Old backups without
the field still work. No database schema or backup-format change is needed.

All-recipes results show actual on-hand counts and required ingredients not
in the bar, with an explicit action to add those to shopping. They never add
inventory or invent substitutions. Drafts stay excluded. Switching source
or filters cancels the pending reveal and clears the previous result.
`npm test` now runs **54 tests**, including eight source-selection tests and
native SQLite preference-isolation coverage. Browser checks cover an empty
bar picking a recipe, inventory-mode misses and makeable picks, keyword
mocktails, shopping-only additions, persistence and mid-pour cancellation.

## Animated shaker update · 22 October 2026

Discover now uses `components/AnimatedShaker.tsx`: copper-and-steel barware
drawn with the existing SVG library and animated through React Native's
`Animated`. A tap or phone shake runs the same guarded selection, with a
1,800 ms shake/uncap/pour sequence before revealing the recipe. Pause or
reduced motion shows the finished still and selects immediately. Idle motion
stops offscreen, in the background and behind overlays; tab changes cancel
selection. No graphics or navigation dependency was added. The original orb
assets and render scripts remain as historical source but are no longer
bundled into the app. Starter recipes and inventory matching are unchanged.
The empty-bar card now states that all recipes can be browsed, and links to
the recipe book and inventory/sample-bar setup.

Verified: all 46 tests and typecheck; web and Android/iOS exports; browser
checks at 320 px and 390 px, visible shake/uncap/pour frames, result reveal,
pause with immediate selection, and cancellation when leaving Discover.
An empty inventory browses all 144 starter recipes; the eight-item sample bar
unlocks seven options with substitutions. Real phone motion remains a device
check; the existing nine sensor/gesture tests pass unchanged.

## Local storage update · 21 October 2026

**My bar → My local bars · switch · backup & restore** now manages named,
device-local bars with independent inventory, recipes, history, shopping,
preferences and party plans. Native uses one private SQLite file per bar;
web uses namespaced localStorage. Existing data remains the default **My bar**.
No account or storage server is involved. JSON export/import uses device files
and always restores into a new bar. Read failures preserve saved data; write
failures surface a warning with backup/retry. See
[docs/LOCAL_STORAGE.md](docs/LOCAL_STORAGE.md) for paths, compatibility, limits
and verification. Keep the native/web split for backup file APIs as well.
`npm test` now runs **46 tests**, including 12 for local bars and backup recovery.

## Hosting update · 21 October 2026

The Discover hosting card now opens a saved party menu, batch calculator,
shopping totals and a read-only guest QR/link view. **Start mixing** in the
recipe book and generator opens the shared step-based serving view, with
keep-awake, confirmation and undo. See [docs/HOSTING.md](docs/HOSTING.md) for
behavior, arithmetic, sharing bounds, verification and device-test limits.

New shared logic: `logic/recipes.ts` owns alcohol classification and draft
readiness; `logic/hosting.ts` owns counts, conversion and prep separation;
`logic/guestMenu.ts` and `menuCompression.ts` own validated, bounded guest
snapshots. Never trust a legacy `isZeroProof` boolean over ingredient metadata.
Free text is unknown until declared, and alcohol-free recipes cannot use
alcoholic substitutions. Drafts are not pourable recipes.

The native database is schema **v5**; its new `app_state` table stores the party
plan. The legacy web bar uses `shaker:party`; new bars include it in their
namespaced full-state record. Existing bottles,
recipe edits, ratings and favorites are preserved. Keep the native/web split.

The hosting release used a **2,034,634-byte animated WebP** instead of the
12.2 MB GIF. Both remain in source for reference; the animated shaker has
since replaced this media in the shipped app. See `scripts/encode-orb-web.ps1`
for the historical encoding workflow.

Host overlay content shares one native modal, and the four main tabs remain.
The hosting update added tests for hosting arithmetic, guest validation,
web persistence and a real SQLite v4-to-v5 migration. Explicit ARIA props are
needed for web selected/checked states. Keep `keyboardDismissMode="none"` on
web search scroll views: RN Web treats programmatic scrolling as a drag and
would dismiss input focus when results shrink.

Handover document for another engineer or coding agent. Written 25 Sep 2026
against commit `0db0e87`.

---

## 1. What this is

A party drink app. Explore the recipe library or tell it what bottles you own
to limit suggestions to drinks you can actually pour. Four tabs:

| Tab | Does |
|---|---|
| **Random** | Spin or shake for any complete recipe, or only one you can make from inventory |
| **Cabinet** | Your inventory — add, remove, track how much is left. Second segment holds the shopping list |
| **Recipes** | 144-recipe searchable library with collections, keyword search, ratings, favourites |
| **Builder** | Pick a base, mixers and toppings from stock; see what it matches |

| | |
|---|---|
| **Live** | https://drinkapp-rust.vercel.app |
| **Repo** | https://github.com/todrod/drinkapp (branch `main`) |
| **Spec** | `docs/SPEC.html` in this repo — the original architecture document |
| **Local path** | `C:\Users\todro\Documents\ChatGPT\drink shaker app\drinkapp` |

The repo root **is** the Expo project. There is no nesting.

---

## 2. Running it

```bash
npm install
npm start                  # Expo dev server; scan QR with Expo Go
npm run web                # browser instead
npm run typecheck          # tsc --noEmit
npm run build:web          # static export + PWA injection -> dist/
npm run test:shake         # motion bridge + gesture tests (Node 22.18+)
npm test                   # motion, recipe integrity and keyword discovery
```

**Deployment is automatic.** Vercel builds on every push to `main` using
`vercel.json`, which runs `npx expo export --platform web && node
scripts/postbuild.mjs` and serves `dist/`. No dashboard config needed.

Code and fonts export at about **1.2 MB**. The shaker uses code-native vector
art and motion; its predecessor's GIF and PNG poster are no longer shipped.
Four Outfit font weights and the subset icon font remain in use.

---

## 3. Stack

Expo SDK 57 · React Native 0.86 · TypeScript · React 19.

| Concern | Choice |
|---|---|
| Local data | `expo-sqlite` on native, `localStorage` on web |
| State | React context + in-memory mirror (`src/store.tsx`) |
| Graphics | `react-native-svg` for catalog art and the animated home shaker |
| Animation | React Native's built-in `Animated` — **not** Reanimated |
| Icons | `@expo/vector-icons` MaterialCommunityIcons, subset to 12 KB |
| Sensors | `expo-sensors` accelerometer on native; `devicemotion` on mobile web |

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
  logic/shopping.ts       Purchase ranking and list projection
  logic/shake.ts          Shared gesture thresholds, distinct jolts, cooldown
  logic/discovery.ts      Local phrase/keyword matching, exclusions, relevance
  logic/text.ts           Accent/case/punctuation normalization
  sensors/
    motion.ts             Native accelerometer and motion permissions
    motion.web.ts         Browser motion permissions and acceleration in g
    motion.types.ts       Shared sensor support and permission states
  db/
    store.ts              Native persistence (SQLite, schema v3)
    store.web.ts          Web persistence (localStorage)
  data/
    catalog.ts            95 base catalog items
    bar.ts                52 more catalog items + MY_BAR (the owner's shelf)
    recipes.ts            Original core recipes; assembles all 144
    library.ts            12 public-domain book recipes + 24 themed
    discoveryRecipes.ts   48 sourced/popular styles and original house recipes
    discoveryCatalog.ts   21 new, distinct specialty ingredients
    curation.ts           Dated trending/highly-rated picks and collection rules
    seed.ts               Shared authoring types + theme definitions
    art.ts                Per-ingredient bottle shape + liquid colour
    liquids.ts            Canonical 11-liquid palette; recipe accent colour
  components/
    ui.tsx                Panel, Chip, buttons, Press, Stars, QuantityBar
    NavPill.tsx           Labelled bottom tabs: Discover, My bar, Recipes, Mix lab
    ShoppingList.tsx      The shopping list, rendered inside Cabinet
    Atmosphere.tsx        Quiet background glow + grain overlay
    IngredientArt.tsx     Parametric SVG bottles
    CocktailArt.tsx       Recipe illustrations, chosen by serving glass
    AnimatedShaker.tsx    Copper shaker and coupe; idle and shake/uncap/pour motion
    LineIcon.tsx          Shared SVG interface icons on a 24-unit grid
  screens/                One per tab, plus AgeGate
  hooks/useShakeDetector.ts
  api/trending.ts         DEFERRED feature — types only, no network
scripts/
  postbuild.mjs           Injects PWA manifest/meta/SW into dist/index.html
  build-icon-font.py      Subsets the icon font (run after adding an icon)
  install-orb-tools.ps1   Verified official Blender, FFmpeg and Gifski tools
  render-orb.py           Cycles scene, periodic smoke, explicit optical boundaries
  encode-orb.ps1          300 frames to a size-checked GIF and matching PNG
  quantize-orb.py         Shared palette with periodic color history for a clean seam
  verify-orb.py           Loop cadence, seam, palette and background checks
  assets/                 Image-generation pipeline (see §8)
public/                   manifest, service worker, icons — copied to dist/
docs/SPEC.html            Original architecture spec
docs/DRINK_DISCOVERY.md    Research, keyword pipeline and content maintenance
docs/MAGIC_ORB_PRODUCTION.md  Render and encode the home artwork
assets/magic-orb.gif      Bundled offline animation; only the smoke moves
assets/magic-orb-poster.png  Matching still for reduced motion and fallback
```

---

## 5. Domain model

Three tables, and one idea that makes the whole thing work.

**`CatalogItem`** — the bundled library of 168 ingredients, glasses and tools. Stable ids
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

**Two sources.** `source: 'all'` skips inventory eligibility for inspiration,
while preserving completeness, keyword/exclusion, mood, theme and alcohol-free
filters. The full eligible library remains in its weighted pool. The default
`'inventory'` source follows the makeability rules below and retains the
original scored top-half pool. Never simulate all-recipes mode by fabricating
a stocked inventory: on-hand counts and shopping advice must stay accurate.

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

**Typed ideas** go through `discoverDrinks()` before inventory matching. Positive
terms intersect; explicit OR groups broaden a term, and exclusions also block
substitutions. An unmatched idea gets a typed `idea` miss rather than silently
relaxing the user's words. The home finder and recipe-book search share the
same rules; no AI or network service is involved. See `docs/DRINK_DISCOVERY.md`.

---

## 6b. The shopping list — `src/logic/shopping.ts`

The counterpart to the generator: it already knew a kit was one bottle short of
six drinks, and this turns that into something actionable.

- `rankPurchases()` sweeps **every** catalog item, not just ones that complete
  a recipe that is one short — a bottle finishing two different two-short
  recipes deserves surfacing. 168 catalog items by 144 recipes is trivial.
- `projectList()` evaluates the whole list **together**, because two bottles
  often unlock the same drink and summing the individual figures would lie.
  This is the headline number on the screen.
- `unlockedBy()` names the actual drinks a purchase would open up.

A `ShoppingItem` is deliberately **not** an `InventoryItem` with an "owned"
flag: it has no level, and the generator must never see it as stock.

Entry points: the Random screen's "one bottle away" fallback (primary action
adds the top suggestion and jumps to the list), a cart button on every row of
the Cabinet's add sheet, and the ranked suggestions on the list itself.
"Got it" moves an item into the cabinet in one tap.

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

### Interface icons and the generated font subset

Navigation and common actions use `LineIcon.tsx`, a small SVG set. New SVG
icons do not need font regeneration. `Icon` falls back to the generated font
for specialist ingredient symbols; its name type covers both sets.
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

### Phone motion needs a tap for permission on iOS web

Discover's **Enable shake** button requests motion directly from the tap.
Do not await availability before requesting: iOS cannot deliver any samples
until permission is granted, so checking for samples first hides the control.
Mobile web requires HTTPS (localhost is allowed for desktop development).
The installed Expo web Accelerometer uses orientation angles, so the web
adapter reads `devicemotion.accelerationIncludingGravity` and converts m/s²
to g. Native Accelerometer readings are already in g. Keep that distinction.
The hook detaches when backgrounded or off; three distinct jolts trigger the
same shaker selection as a tap, with a cooldown against repeated picks.

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
"Load my bar" button on the empty Cabinet screen. With substitutions enabled,
**97 of the 144 recipes are pourable** (84 with exact ingredients).

**Recipe sources.** Original core + 12 from bartending manuals that are public domain
in the US (Jerry Thomas 1862/1876/1887, Ensslin 1917, Kappeler 1895, each
carrying attribution) + 24 themed across four collections. *The Savoy Cocktail
Book* (1930) is deliberately excluded — its status could not be settled.

The bank now also includes 48 additions, with source links for standards and
explicit house-recipe attribution for originals. Discovery collections use
dated research from Bacardi and Difford's, separate from personal rating stars.
No numeric external rating is invented. See `docs/DRINK_DISCOVERY.md`.

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

- **Trending is a saved 2026 collection**, with its source and check date.
  The live feed in `src/api/trending.ts` is still unwired (`TRENDING_ENDPOINT =
  null`). Keyword discovery and collections work offline.
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

1. **Completed 21 Oct 2026: per-bottle identity.** `IngredientArt` accepts an
   optional display-name seed for a label initial and a deterministic ±8-point
   lightness shift. Keep passing inventory names, since catalog ids are shared.
2. **The editor can create a drink that can never be poured** (no ingredients).
   It is correctly excluded from the generator but should say so.
3. **Guests land with an empty cabinet** — storage is per-browser, so the
   116-bottle bar is in the code but not the URL.
4. **The site is publicly indexable** behind a client-side-only age gate.
5. **`@expo-google-fonts/nunito` is an unused dependency** — the app moved to
   Outfit. Safe to remove.
6. Trending, per §9.

---

## 11. Conventions

The interface uses deep oxblood red surfaces, ivory text, apricot primary actions,
and mint stock indicators. Shared `SCREEN` spacing caps desktop content at
1120px; Cabinet and Recipes use two, three, or four columns by viewport width.
The home crystal is a bundled Cycles render played by `expo-image`. Sphere,
coupe, amber liquid and ice stay fixed; a periodic purple/blue smoke field moves.
There is no 3D engine or AI service in the running app. `CrystalBall` is purely
decorative: its parent button, the keyword finder and phone shake share `onSpin`.
Keep that handler outside the media component so decoding cannot block selection.

A GIF in an HTML `img` has no pause API. The component swaps to its matching PNG
when motion is disabled, the hero is offscreen, or AppState is inactive. This
also handles native playback without retaining an animation behind the poster.
System reduced motion starts with a still and immediate selection; ordinary
selection has a brief 600 ms feedback interval followed by the result reveal.
Stop that interval on unmount so tab changes cannot deliver a stale result.
Use the PNG as a placeholder and a decoding-error fallback. Keep both assets
bundled with `require()` for offline use, rather than depending on a remote URL.

See `docs/MAGIC_ORB_PRODUCTION.md` for source geometry, rendering, encoding and
verification. Full rendered frames and the `.blend` project live outside the
repository in the workspace's `orb-render` directory; commit only the delivery
media, source scripts and verification receipt.

Keep favorite and rating buttons separate from the button that opens a recipe
or toggles its details: nesting buttons produces invalid HTML on web.

- TypeScript strict; `npm run typecheck` must pass before commit.
- Comments explain *why*, especially where something looks wrong but is not.
- Accessibility: touch targets ≥44px (chips use `hitSlop`), text ≥4.5:1
  contrast, `accessibilityRole`/`accessibilityLabel` on every control,
  reduced-motion respected.
- No secrets in the client. The trending proxy exists precisely so a search key
  never ships in the bundle.
