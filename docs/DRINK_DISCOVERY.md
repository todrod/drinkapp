# Local drink discovery

The app bundles 144 recipes, including 48 additions researched on 21 October
2026. There are 13 alcohol-free recipes and seven themes. The matching pipeline
runs on the device with no model, API key, inference server or search request.
It works with the app's existing offline storage and cached web bundle.

## Research and collections

- **Trending 2026**: ten bar calls in [Bacardi's 2026 forecast](https://www.bacardilimited.com/media/news-archive/connections-local-flavors-and-luxurious-experiences-top-the-2026-bacardi-cocktail-trends-report/).
  Aperol Spritz represents the report's spritz family. Four simple mixed drinks
  use the app's house ratios. This is a dated forecast, not live sales data.
- **Highly rated**: eleven cocktail families on the first page of
  [Difford's rating-sorted finder](https://www.diffordsguide.com/cocktails/search?na=1&s=1&so=dg_rating)
  when checked. The app's recipe specifications may vary. These selections
  never fill in the user's rating stars or favorites.
- **All-time favorites**: 25 familiar cocktails selected editorially. Personal
  favorites have a separate filter.
- **Classics** includes historical and modern classics. **Specialty** includes
  dessert drinks and more involved recipes. **Themes** includes the existing
  fantasy collections plus Holiday, Garden party and Beach escape.
- New standard recipes link to the specific [IBA recipe](https://iba-world.com/cocktails/all-cocktails/),
  [Malts Godfather](https://www.malts.com/en-us/recipes/godfather),
  [St-Germain Hugo Spritz](https://www.stgermainliqueur.com/us/en/cocktails/hugo-spritz/)
  or [Difford's Mezcal Margarita](https://www.diffordsguide.com/cocktails/recipe/2497/mezcal-margarita).
  Instructions were written for this app. The 14 original house drinks are
  identified as house recipes rather than externally ranked creations.

The dated selections live in `src/data/curation.ts`. Refresh them through a
reviewed content update: check the source, update the membership and date, and
run the tests. The app displays the saved date and source. There is no scheduled
scraper or runtime feed dependency.

## Matching pipeline

1. `normalizeText` removes case, accent and punctuation differences.
2. `parseDrinkIdea` finds the longest phrases first: exact recipe names,
   ingredient names, flavor/mood synonyms, occasions, collections and themes.
3. Positive terms intersect. `gin or vodka` creates an alternative group.
   `no`, `without`, `avoid` and similar words create exclusions. `not too sweet`
   requests a drier profile and excludes recipes tagged sweet/dessert; it is a
   taste preference, not a sugar-content calculation.
4. `discoverDrinks` ranks the full matches and identifies partial alternatives
   with their unmet preferences. Unknown words remain visible. Suggested
   spellings require a tap; the app does not silently replace the request.
5. The home screen intersects those matches with the user's bar, substitutions,
   zero-proof preference and quick filters. Ready recipes appear first in the
   preview. The existing weighted generator chooses among eligible drinks,
   avoiding recent repeats. Tapping, submitting the idea and shaking the phone
   all call this same generator.
6. Excluded ingredient ids are also blocked during substitution resolution.
   Positive ingredient/flavor requests constrain substitutions as well: a rum
   request cannot use vodka, and a smoky mezcal request cannot use tequila.
   An explicit `rum or vodka` group allows either.
   Alcohol-free requests remain alcohol-free in partial alternatives. A miss
   gives ingredient advice or asks the user to refine their words; it never
   silently selects an unrelated drink.

Examples: `refreshing rum with lime`, `tropical no gin`, `cozy coffee`,
`brunch bubbly`, `Halloween`, `Star Wars`, `Christmas`, `fruity mocktail`,
`gin or vodka citrus`, `coffee no dairy`, `Paper Plane`.

Recipe-book search uses the same parser. **Can make now** can be combined with
any collection. User-created recipes participate through their names,
ingredients and tags. This is a finite, explainable rules vocabulary: an
unrecognized topic needs a new alias/tag or another wording.

## Adding recipes and keywords

Discover also has a **Pick from: All recipes / My inventory** control. All
recipes can select a matching complete recipe with an empty bar; inventory
mode still requires its ingredients (and permits the configured substitutions).
The idea finder reports candidates for the chosen source. Both modes keep
the same keyword intersections, exclusions, themes, moods and alcohol-free
constraints. Switching sources cancels an in-progress reveal. The choice is a
device-local preference per bar and is included in new backup files.

Add an entry with a unique, permanent slug to `discoveryRecipes.ts`. New ids
use `bank-<slug>`; leave the original `seed-`, `book-` and `theme-` ids intact.
Both persistence adapters merge unseen ids without replacing saved edits,
ratings, favorites or history. No database migration is needed.

Every required ingredient must have an accurate catalog id. Add genuinely new
ingredients to `discoveryCatalog.ts`; do not disguise Chartreuse, Nonino or a
specific liqueur as generic amaro. Tag the dominant flavors, occasions and
style, and use a valid theme id. Put new synonyms in `logic/discovery.ts`.
Recipe names and catalog names are indexed automatically.

Run `npm test`, `npm run build:web`, then `npm run typecheck` before committing.
Discovery tests cover catalog references, recipe ids, amounts, sources,
zero-proof classification, synonyms, intersections, exclusions, substitutions,
no-match behavior and preservation of existing user data.
