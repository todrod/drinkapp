# The Drink Shaker

A party drink app: a pantry you keep current, a generator that only pours what
you own, a personal drink book, and a browsable bottle catalog. Built from the architecture spec in [`docs/SPEC.html`](docs/SPEC.html),
also published at https://claude.ai/code/artifact/2c0fe555-7121-4936-8c6a-ed42435f396b

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone. `npx expo start --web` runs it
in a browser instead, which is useful for quick checks but not the target.

## What's built

Four tabs: **Random · Cabinet · Recipes · Builder.**

| Feature | Status |
|---|---|
| Random — spin for a drink | Done, including all three fallback states |
| Cabinet — inventory CRUD | Done, grouped by category with quantity bars |
| Recipes — searchable library | Done, with filters, ratings and favourites |
| Builder — build from stock | Done, three steps then match against the library |
| Trending — live cited feed | **Deferred.** No tab; see `src/api/trending.ts` |
| Shake the phone to re-roll | Done — `src/hooks/useShakeDetector.ts` |
| Installable as a phone app | Done — PWA via `public/` + `scripts/postbuild.mjs` |
| Themed collections | Done — 4 themes, `src/data/library.ts` |
| Recipes from public-domain books | Done — 12, attributed on the card |

Everything except Trending works with the network off, which was the point.

## Your bar

`src/data/bar.ts` holds the real shelf — 116 entries in `MY_BAR`, loaded by the
**Load my bar** button on the empty My Kit screen. Near-empties (Barr Hill,
Tanqueray, E&J, the butterscotch) come in pre-marked `low`.

Several bottles deliberately share one catalog id: eight gins all resolve
`sp-gin`, so any recipe calling for gin is satisfied while the kit still lists
the eight bottles actually standing there. `loadMyBar` skips the usual
dedupe-by-catalog-id for exactly this reason.

`BAR_ROWS` in the same file adds the catalog concepts the generic starter
catalog lacked — amari, falernum, allspice dram, Bénédictine, absinthe,
maraschino, the bitters shelf, Madeira, and the schnapps.

With this bar loaded, **81 of the 96 recipes are pourable.** The other 15 are
blocked by things genuinely not on the shelf: fresh mint, orange juice,
grapefruit juice, cachaça, jalapeño, basil, cucumber, watermelon, lemonade,
espresso, cranberry, worcestershire and hot sauce.

## Installing it on a phone

Two routes, and the free one is already live.

**As a PWA (no store, no build).** Open the hosted URL on the phone and use
*Add to Home Screen*. `public/manifest.webmanifest` plus the injected iOS meta
tags make it launch full-screen with its own icon; `public/sw.js` caches the
bundle so it opens with no signal. This is the intended route for handing the
app to people at a party.

**As a real installable build.** `npx eas build -p android --profile preview`
produces an APK you can sideload; iOS needs TestFlight and a paid Apple
developer account. Neither is set up here — it needs an Expo account — but
nothing in the code blocks it.

`scripts/postbuild.mjs` injects the manifest link, iOS meta tags and the
service-worker registration into Expo's generated `dist/index.html` after
export. It runs as part of the build command and is idempotent.

## Shake to shake

`src/hooks/useShakeDetector.ts` watches the accelerometer and fires the same
handler as the button. It requires several threshold crossings inside a 600 ms
window rather than one, so setting the phone down does not re-roll your drink,
and it has a 1.5 s cooldown.

On iOS Safari, motion access needs an explicit grant that must come from a tap
— which is why the hook exposes `requestPermission` for the toggle chip to call
rather than asking on mount. The chip hides entirely on devices with no
accelerometer.

## Recipe sources

`src/data/library.ts` holds two collections beyond the core seeds:

**From books** — 12 recipes from bartending manuals that are public domain in
the US: Jerry Thomas (1862, 1876, 1887), Hugo Ensslin (1917), George Kappeler
(1895). Ingredient lists are facts and not copyrightable; the step text is
written fresh, and each recipe carries its attribution into the app. *The Savoy
Cocktail Book* (1930) is deliberately excluded — the New York Public Library's
own review could not conclusively determine its status.

**Themed** — 24 drinks across Middle-earth, Fairytale, Galaxy and Spooky,
filterable from both the Shaker rail and the drink book. Names are evocative
rather than lifted from any one franchise, since the app is publicly hosted.
Theme membership is a single field, so renaming is cheap.

## Hosting on Vercel

`vercel.json` is configured: build `npx expo export --platform web`, serve
`dist/`, SPA rewrites, and immutable caching on hashed assets.

Easiest path is importing the GitHub repo at vercel.com/new — it reads
`vercel.json`, needs no dashboard settings, and redeploys on every push to
`main`. Or from this folder:

```bash
npx vercel --prod
```

The web build stores everything in `localStorage`, so it is per-browser and
per-device: whoever opens the link gets their own kit and book, and nothing is
shared or uploaded. That is the right model for a link you pass around, but it
is not sync — the phone build with real SQLite is still the primary target.

Bundle is ~0.93 MB. Note that fonts are imported by weight
(`@expo-google-fonts/nunito/800ExtraBold`) rather than from the package root,
which re-exports all 18 faces and adds ~2.4 MB of unused ttf to the export.

## Layout

```
src/
  types.ts              Data models (Phase 02 of the spec)
  theme.ts              Colour, spacing and type tokens
  format.ts             Measure formatting — 0.75 → ¾
  data/catalog.ts       ~145 bundled catalog items, stable ids
  data/bar.ts           The real shelf (MY_BAR) + the catalog rows it needed
  data/seed.ts          Shared authoring types + the theme definitions
  data/recipes.ts       Core seeds; assembles all 96 recipes
  data/library.ts       Public-domain book recipes + themed collections
  hooks/                useShakeDetector — physical shake gesture
  db/store.ts           Persistence — SQLite on native, localStorage on web
  logic/generator.ts    The matching algorithm and the miss analysis
  store.tsx             In-memory mirror + mutators
  api/trending.ts       Deferred network layer — types settled, fetch stubbed
  components/           NavPill, shared UI primitives (Stars, QuantityBar, HaveCount)
  screens/              RandomScreen, CabinetScreen, RecipesScreen,
                        BuilderScreen, plus the age gate
```

## Two deliberate deviations from the spec

**1. No Drizzle ORM.** The spec called for `expo-sqlite` + Drizzle. This uses
`expo-sqlite` directly with hand-written DDL and a `PRAGMA user_version`
migration step. Drizzle's value here is typed queries and generated migrations,
which costs a `drizzle-kit` build step for a schema of three tables. The schema
is unchanged, so Drizzle can be layered on later without touching the data.

**2. localStorage on web.** `expo-sqlite` on web needs a wasm pipeline that buys
nothing at this data size. `src/db/store.ts` picks its backend by platform and
exposes one set of functions, so no screen knows which is running.

## The interface

Teal-on-near-black, one aqua primary, warm accents held back for state. Tokens
live in `src/theme.ts`.

What stops it reading as flat vector, in rough order of impact:

- **Atmosphere** (`src/components/Atmosphere.tsx`) — three drifting radial
  colour fields plus a grain overlay at 3.5%. The grain is the single biggest
  contributor; flat fills on flat ground are most of what looks unfinished.
  Radial gradients come from react-native-svg because expo-linear-gradient is
  linear only, and a hard-edged disc reads as a shape rather than light.
- **A light edge on every raised surface** — a 1px inset highlight along the
  top. Without it a translucent rectangle just looks like a lighter rectangle.
- **Type** — Outfit, whose light weights suit the wide letter-spaced treatment.
  The previous rounded extra-bold face was fighting the design.
- **Spring press physics** on every target (`Press` in `ui.tsx`) rather than an
  opacity flash.
- **A tab bar with one sliding indicator** instead of four independent
  highlights, so it reads as a single object.

Two web-specific traps, both hit and fixed:

1. React Native Web ignores `shadowRadius`, so native shadow props render as a
   hard offset rectangle. `SHADOW` in `theme.ts` emits a real `boxShadow`
   string on web and keeps the native props elsewhere.
2. A glow must sit on an element that already has the border radius. On a
   square parent the halo stops at the rectangle and the pill's corners show as
   dark notches.

**Deliberately not used: react-native-skia.** It is the obvious reach for
shaders and real blur, but on web it loads CanvasKit — 2.9 MB of wasm, more
than double the entire current bundle. Everything above costs nothing.

Recipe accents were authored against an earlier lime/magenta palette and are
persisted in the database, so they cannot simply be edited in the data files —
`accentOf()` maps the legacy hexes onto the current palette at render time.

Two notes on the Builder. Selection is keyed by **inventory row id, not catalog
id**: several bottles deliberately share one catalog id (eight gins all resolve
`sp-gin`), so keying by catalog id lit up every gin at once. And the option grid
scrolls inside a capped height so the glass and the Next button stay on screen.

`QuantityBar` renders as a slider but the model underneath is still the
four-stop `full / half / low / out` enum — `out` has to remain a distinct state
because the generator keys off it — so the track has four tap zones rather than
a drag.

## Icons

Two systems, deliberately separate.

**UI chrome** — MaterialCommunityIcons, which ships inside `@expo/vector-icons`
(MIT code, OFL font) so it costs no network and works offline. It has real
barware glyphs rather than generic food icons: `shaker`, `keg`, `hops`, and
every glass shape.

Two traps worth knowing about:

1. `import { createIconSet } from '@expo/vector-icons'` pulls the package index,
   which imports *every* icon set and therefore every bundled font — about 4 MB
   of TTFs. Import `@expo/vector-icons/build/createIconSet` directly instead.
2. The full MaterialCommunityIcons face is 1.3 MB for 7,448 glyphs and this app
   draws about fifty. `scripts/build-icon-font.py` subsets it to **12 KB**. Run
   it after adding an icon; the outputs are committed so the Vercel build needs
   no Python. `GlyphName` is keyed off the generated map, so referencing a glyph
   outside the subset is a type error rather than a blank box.

**Ingredient art** — `src/components/IngredientArt.tsx` draws parametric SVG
bottles: a silhouette chosen by what the thing is (`tall`, `wide`, `wine`,
`squat`, `dasher`, `soda`, `can`, `carton`, `squeeze`, plus fruit, leaf, cube
and glassware) filled with a liquid colour chosen per ingredient in
`src/data/art.ts`. Agave gold, sugarcane clear, coffee brown, deep tomato red.

That gives ~150 distinct ingredient icons for a few kilobytes of code, with no
image licensing, no network, and clean scaling. Each carries the teal-and-gold
label band from the reference.

## How matching works

`src/logic/generator.ts`. An ingredient resolves if the user owns its
`catalogItemId`, or owns something the catalog lists as a substitute (when
substitutions are enabled), or typed the name in freehand. Ice and salt are
staples and always resolve.

A missing `base`, `modifier`, `mixer` or `sweetener` kills the match. A missing
garnish or ice only adds a note — nobody is short a drink because they have no
cherries.

When nothing matches, the generator returns a typed miss rather than an empty
result, and the screen names the fix:

- `filters` — "your filters are too tight, N drinks match without them"
- `nearly` — "add lime juice and 6 drinks unlock"
- `empty` — "you need a base spirit and a mixer"

## Wiring up Trending later

1. Stand up the proxy (Cloudflare Worker) that holds the search key and caches
   one result per region.
2. Set `TRENDING_ENDPOINT` in `src/api/trending.ts`.
3. Build the card list in `src/screens/TrendingScreen.tsx` against
   `fetchTrending()`, which already returns the loading / ok / stale / offline
   states the screen needs.

`stripUncited()` runs on every response so an item without sources cannot reach
the screen.

## Notes

- Age gate is blocking on first launch. The date is stored locally and never
  uploaded.
- Zero-Proof mode filters the catalog and the generator to non-alcoholic
  ingredients — one switch on the Shaker screen.
- No drinking games, timers or anything that rewards speed. Deliberate.
