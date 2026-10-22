# Hosting flow and audit fixes

21 October 2026

The Discover card **Good company. Great drinks.** opens the host’s corner. It connects a saved party menu, a batch calculator and shopping totals to the same serving view used by Discover, Recipes and Mix Lab. Everything runs locally with recipe metadata and arithmetic; there is no AI service or account requirement.

## Party menu

Choose up to six complete recipes. The suggested starting point is three to five signatures, including an alcohol-free option. Search by name, ingredient or mood, or filter to recipes available from the bar, alcohol-free recipes or the whole library. The name, selections, serving counts and preferred volume unit persist on this device.

Counts are planned recipe servings, not estimates of what the inventory can supply. Each count must be a whole number from 1 to 100. Invalid input stays visible for correction and cannot drive batch calculations. Deleted or incomplete selected recipes are explained and can be removed. Zero-proof mode hides alcoholic or unconfirmed recipes without erasing the saved selection.

## Batch and shopping rules

- Batch totals use the recipe **as written**. Substitutions remain visible in discovery and recipe details but are not silently applied to batch quantities.
- US fluid ounces, milliliters and teaspoons convert using 29.5735295625 ml per US fl oz and 4.92892159375 ml per teaspoon. Display values round to two decimals; arithmetic retains precision.
- Pieces and dashes remain in their own units. Parts require a chosen measure; top-ups, splashes and unspecified ice/garnish amounts retain per-glass instructions. No dash or top-up is assigned a guessed volume.
- Ice, garnish, optional finishes, carbonation, solids, milk/cream, egg/aquafaba and espresso remain separate from the measured still-liquid preparation. Original recipe steps remain the authority for layering, muddling, foam and blending.
- No automatic dilution is added. Shake or stir one measured portion with ice at serving as directed by the recipe. Carbonated ingredients are added afterward.
- Combined totals merge measured ingredients by catalog ID (or normalized free-text name) and compatible unit. Optional ingredients are separate. Missing ingredients can be added to the existing shopping list; that list stores names, while the planner retains the quantities.
- Full/half/low/out indicate availability, not exact bottle volume. Check total needs against the actual amount remaining; the app does not claim the stock will supply the whole party.

## Serving view

**Start mixing** shows large measures, one step at a time, the glass, garnish and alcohol status. From a party batch it also shows planned totals and explains that the original steps describe one glass. The optional keep-awake action releases its lock when the view closes; unsupported browsers get a visible explanation.

**Mark as made** becomes available at the last step. A synchronous guard prevents duplicate taps within that preparation. Confirmation replaces the action, and **Undo mark as made** restores the previous history. A batch records one preparation, rather than treating its planned count as separate completed drinks. Stock quantities are not deducted. Guest views never expose history mutations.

The host uses one native modal while moving between menu, recipe, editor and serving content. Returning from a batch’s serving view restores the batch tab. Shake selection and hero animation suspend while a host overlay is open.

## Read-only guest links

Guest view builds a compressed URL fragment containing only the selected menu. Standard unedited recipes use IDs with a content fingerprint; modified or custom recipes carry a validated recipe snapshot. No bar inventory, serving counts, ratings, favorites, preferences or made history are included. The fragment stays out of HTTP requests, and no external QR service is used.

The decoder checks version, types, counts, measures and text limits. Its LZ decoder checks expanded length before appending words. A changed standard recipe fingerprint, malformed link or unsupported payload produces a recovery view. Overlong custom recipes produce an explanation before a link is offered.

QR codes are offered for links up to 1,800 characters; longer valid menus can be shared as links. A shared menu is a snapshot: create a new link after editing it. Anyone with the link can read it. A localhost preview is usable on its computer; guests’ phones need a reachable web address serving this version. The host can set that address. The feature must be deployed before the public production URL can display these menus.

## Audit corrections

1. Alcohol status is computed from catalog metadata and explicit declarations for free-text ingredients. An old `isZeroProof` flag cannot override unknown or alcoholic ingredients. Alcohol-free recipes also reject alcoholic substitutions, including amaretto for orgeat.
2. Stock uses a labeled picker with full-size targets and a real selected state, replacing reversed invisible slider zones.
3. Mix Lab library matches open complete recipes. Custom builds enter the editor with method **build**, unset measures and no invented instructions. Alcohol-free builds can use juices or tea as their base.
4. Zero-proof mode consistently filters Discover, ready counts, Recipes, Mix Lab, shopping recommendations and party planning.
5. Web controls expose explicit pressed, selected, checked, expanded, busy and disabled states alongside native accessibility state.
6. Preparation and completed-history recording are separate, with confirmation and undo.
7. The editor offers units, roles, optional ingredients, positive-measure validation and explicit free-text alcohol declarations. Incomplete recipes are labeled drafts and excluded from serving/generation/batches. Editing a bundled recipe creates a personal copy and retains its attribution; existing stored edits remain intact.

The home idea field precedes the compact animated hero. At 390 × 844 it starts near y=282, compared with approximately y=924 in the audit. Main actions stay full-width on phones. Secondary text is larger, availability counts explicitly refer to recipes, and first use prioritizes adding owned ingredients. The 116-item owner inventory and eight-ingredient starter are clearly labeled samples. Web search fields retain focus when filtering changes scroll position.

## Media delivery

On 22 October the home media was replaced by `AnimatedShaker.tsx`, a vector
shaker and coupe with React Native animation. It shakes, uncaps and pours
before revealing a recipe. Pause/reduced motion select immediately; idle
motion stops offscreen or in the background. The orb media is no longer
bundled. The following measurements document the previous release.

The original GIF remains in `assets/magic-orb.gif`. The previous release loaded `assets/magic-orb.webp`: 480 × 480, 300 frames, 40 ms per frame, 12 seconds, infinite loop, **2,034,634 bytes**, about 83% smaller than the 12,185,250-byte GIF. It was encoded directly from the original full-color Cycles frames with unchanged smoke density and timing. The matching PNG covered reduced motion, pause, background, offscreen and image-error states. Tap and shake selection remained independent of decoding.

Reproduce it from the original frames:

```powershell
.\scripts\encode-orb-web.ps1 -Frames '..\orb-render\frames'
```

Animated WebP is supported by [Expo Image SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/image/). `useAppleWebpCodec={false}` selects the standard-compliant decoder on iOS. Screen wake prevention uses [Expo KeepAwake SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/keep-awake/); copying uses [Expo Clipboard SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/clipboard/).

## Verification

`npm test` includes 34 checks: 9 shake/motion, 13 discovery/integrity and 12 hosting tests. Hosting coverage includes unknown alcohol and legacy flags, alcoholic substitutions, draft exclusion, all 144 bundled recipes, volume conversion, carbonation separation, combined totals, invalid counts, guest snapshots, bounded Unicode decoding, web persistence and a real in-memory SQLite v4-to-v5 migration preserving bottles and edited recipes.

Browser verification used an isolated local origin so test recipes, counts and shopping items did not alter the owner’s profile. The exercised stories included menu refresh persistence, corrected count entry, shopping transfer, Mix Lab measures/method/units, original-preserving recipe copies, unknown-alcohol exclusion, global zero-proof filtering, serving completion/undo, keep-awake and guest views without host actions. A cached reload, saved batch calculations and Daiquiri discovery also worked after that origin’s server was stopped. Layouts at 320 × 740, 390 × 844, 660 × 648 and 1280 × 900 had no horizontal page overflow. Normal and cached-offline browser checks reported no application warnings or errors.

The owner’s local preview was refreshed with 116 stock items, 144 recipes and 97 available recipes still present. TypeScript, the production web export and iOS/Android exports pass. Physical sensor hardware, the actual mobile keyboard and native media decoding require a device check; export success is not a device test.
