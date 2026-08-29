import { CatalogItem, CatalogRow } from '../types';
import { BAR_ROWS } from './bar';

/**
 * The bundled catalog. Ships with the app so Explore and My Kit work with the
 * router off. Ids are stable across releases — inventory rows point at them.
 *
 * `bar.ts` adds the amari, tiki modifiers and bitters that a real shelf needs.
 */

const rows: CatalogRow[] = [
  // ── Spirits ────────────────────────────────────────────────────────────
  { id: 'sp-vodka', name: 'Vodka', kind: 'spirit', category: 'beverage', spirit: 'vodka', abv: 40, notes: ['neutral', 'clean', 'grain'], subs: ['sp-gin', 'sp-rum-white'], blurb: 'The blank canvas. Vodka contributes strength and texture rather than flavour, which is exactly why it carries fruit and coffee so well.', icon: '🍾' },
  { id: 'sp-gin', name: 'Gin', kind: 'spirit', category: 'beverage', spirit: 'gin', style: 'London dry', abv: 42, notes: ['juniper', 'citrus', 'botanical'], subs: ['sp-vodka'], blurb: 'Juniper first, then whatever else the distiller threw in — coriander, angelica, citrus peel. London dry is the crisp, unsweetened default.', icon: '🍸' },
  { id: 'sp-rum-white', name: 'White rum', kind: 'spirit', category: 'beverage', spirit: 'rum', style: 'light', abv: 40, notes: ['sugarcane', 'light', 'grassy'], subs: ['sp-cachaca', 'sp-vodka'], blurb: 'Light-bodied and faintly sweet. The backbone of the daiquiri and the mojito, and the most forgiving spirit to learn ratios on.', icon: '🥃' },
  { id: 'sp-rum-dark', name: 'Dark rum', kind: 'spirit', category: 'beverage', spirit: 'rum', style: 'aged', abv: 40, notes: ['molasses', 'caramel', 'oak'], subs: ['sp-rum-white'], blurb: 'Aged and molasses-heavy. Brings colour and depth where white rum brings lift.', icon: '🥃' },
  { id: 'sp-cachaca', name: 'Cachaça', kind: 'spirit', category: 'beverage', spirit: 'rum', abv: 40, notes: ['grassy', 'funky', 'fresh cane'], subs: ['sp-rum-white'], blurb: 'Brazilian, distilled from fresh cane juice rather than molasses. Greener and funkier than rum — the caipirinha depends on it.', icon: '🥃' },
  { id: 'sp-tequila-blanco', name: 'Blanco tequila', kind: 'spirit', category: 'beverage', spirit: 'tequila', style: 'blanco', abv: 40, notes: ['agave', 'pepper', 'citrus'], subs: ['sp-tequila-repo', 'sp-mezcal'], blurb: 'Unaged and vegetal, straight from the still. The bright, peppery agave is unmasked by oak, which is why margaritas want it.', icon: '🌵' },
  { id: 'sp-tequila-repo', name: 'Reposado tequila', kind: 'spirit', category: 'beverage', spirit: 'tequila', style: 'reposado', abv: 40, notes: ['agave', 'vanilla', 'oak'], subs: ['sp-tequila-blanco'], blurb: 'Rested in oak for months, not years. Keeps the agave but rounds the edges — the middle ground between blanco and añejo.', icon: '🌵' },
  { id: 'sp-mezcal', name: 'Mezcal', kind: 'spirit', category: 'beverage', spirit: 'mezcal', abv: 43, notes: ['smoke', 'earth', 'agave'], subs: ['sp-tequila-blanco'], blurb: 'Agave roasted in earth pits before distilling, which is where the smoke comes from. A half-ounce swapped into anything tequila-based changes the whole drink.', icon: '🔥' },
  { id: 'sp-bourbon', name: 'Bourbon', kind: 'spirit', category: 'beverage', spirit: 'whiskey', style: 'bourbon', abv: 45, notes: ['vanilla', 'caramel', 'corn'], subs: ['sp-rye'], blurb: 'Corn-led and sweet, aged in charred new oak. Rounder than rye, which makes it the friendlier old fashioned.', icon: '🥃' },
  { id: 'sp-rye', name: 'Rye whiskey', kind: 'spirit', category: 'beverage', spirit: 'whiskey', style: 'rye', abv: 45, notes: ['spice', 'pepper', 'dry'], subs: ['sp-bourbon'], blurb: 'Spicier and drier than bourbon. Cuts through sweet vermouth better, which is why the classic manhattan is a rye drink.', icon: '🥃' },
  { id: 'sp-scotch', name: 'Scotch', kind: 'spirit', category: 'beverage', spirit: 'whiskey', style: 'blended', abv: 40, notes: ['malt', 'smoke', 'honey'], subs: ['sp-bourbon'], blurb: 'Malt-driven, sometimes peated. Rewards a light hand with sugar and very little else.', icon: '🥃' },
  { id: 'sp-brandy', name: 'Brandy', kind: 'spirit', category: 'beverage', spirit: 'brandy', abv: 40, notes: ['stone fruit', 'oak', 'raisin'], subs: ['sp-bourbon'], blurb: 'Distilled wine, aged in oak. Fruit-forward without being sweet — the oldest base in the cocktail canon.', icon: '🍇' },

  // ── Liqueurs & fortified ───────────────────────────────────────────────
  { id: 'lq-triple-sec', name: 'Triple sec', kind: 'liqueur', category: 'beverage', abv: 30, notes: ['orange', 'sweet'], subs: ['lq-cointreau'], blurb: 'Sweetened orange liqueur, the workhorse modifier. Cointreau is the same idea made better and stronger.', icon: '🍊' },
  { id: 'lq-cointreau', name: 'Cointreau', kind: 'liqueur', category: 'beverage', abv: 40, notes: ['bitter orange', 'crisp'], subs: ['lq-triple-sec'], blurb: 'Drier and more aromatic than generic triple sec, and strong enough to count as a second base.', icon: '🍊' },
  { id: 'lq-campari', name: 'Campari', kind: 'liqueur', category: 'beverage', spirit: 'aperitif', abv: 25, notes: ['bitter', 'orange peel', 'rhubarb'], subs: ['lq-aperol'], blurb: 'Aggressively bitter and unmistakably red. Equal parts with gin and sweet vermouth is the negroni; nothing else substitutes cleanly.', icon: '🟥' },
  { id: 'lq-aperol', name: 'Aperol', kind: 'liqueur', category: 'beverage', spirit: 'aperitif', abv: 11, notes: ['orange', 'gentle bitter', 'rhubarb'], subs: ['lq-campari'], blurb: 'Campari with the volume turned down — lower proof, sweeter, more orange. Built for spritzes.', icon: '🟧' },
  { id: 'lq-vermouth-sweet', name: 'Sweet vermouth', kind: 'liqueur', category: 'beverage', spirit: 'aperitif', abv: 16, notes: ['herbal', 'vanilla', 'red fruit'], subs: [], blurb: 'Fortified wine, aromatised and sweetened. It is wine — refrigerate it after opening or it turns within weeks.', icon: '🍷' },
  { id: 'lq-vermouth-dry', name: 'Dry vermouth', kind: 'liqueur', category: 'beverage', spirit: 'aperitif', abv: 18, notes: ['dry', 'floral', 'saline'], subs: [], blurb: 'The pale, crisp counterpart. A martini is mostly an argument about how much of this to use.', icon: '🥂' },
  { id: 'lq-coffee', name: 'Coffee liqueur', kind: 'liqueur', category: 'beverage', abv: 20, notes: ['coffee', 'sweet', 'roast'], subs: [], blurb: 'Sweet and roasty. Does the heavy lifting in an espresso martini and hides in a surprising number of dessert drinks.', icon: '☕' },
  { id: 'lq-amaretto', name: 'Amaretto', kind: 'liqueur', category: 'beverage', abv: 28, notes: ['almond', 'marzipan', 'sweet'], subs: ['sw-orgeat'], blurb: 'Almond-flavoured and very sweet. Treat it as sugar plus flavour, and cut the syrup accordingly.', icon: '🌰' },
  { id: 'lq-elderflower', name: 'Elderflower liqueur', kind: 'liqueur', category: 'beverage', abv: 20, notes: ['floral', 'pear', 'honey'], subs: [], blurb: 'Floral and honeyed. A quarter-ounce lifts almost any gin drink; an ounce takes it over.', icon: '🌼' },
  { id: 'lq-irish-cream', name: 'Irish cream', kind: 'liqueur', category: 'beverage', abv: 17, notes: ['cream', 'cocoa', 'whiskey'], subs: [], blurb: 'Dairy-based, so it curdles against citrus. Keep it away from anything sour.', icon: '🥛' },
  { id: 'lq-peach', name: 'Peach schnapps', kind: 'liqueur', category: 'beverage', abv: 15, notes: ['peach', 'candy', 'sweet'], subs: [], blurb: 'Unapologetically sweet. Works best where it is one loud note among several.', icon: '🍑' },
  { id: 'lq-blue-curacao', name: 'Blue curaçao', kind: 'liqueur', category: 'beverage', abv: 24, notes: ['orange', 'sweet'], subs: ['lq-triple-sec'], blurb: 'Triple sec wearing a costume. Same orange base, different colour — swap it in whenever a drink needs to be blue.', icon: '🟦' },
  { id: 'wn-prosecco', name: 'Prosecco', kind: 'wine', category: 'beverage', abv: 11, notes: ['crisp', 'apple', 'bubbles'], subs: ['wn-champagne', 'wn-white'], blurb: 'Dry, bubbly and cheap enough to mix with. The default spritz base.', icon: '🍾' },
  { id: 'wn-champagne', name: 'Champagne', kind: 'wine', category: 'beverage', abv: 12, notes: ['toast', 'citrus', 'fine bubbles'], subs: ['wn-prosecco'], blurb: 'Finer bubbles, more bread and less fruit. Worth it in a French 75, wasted in a punch.', icon: '🥂' },
  { id: 'wn-red', name: 'Red wine', kind: 'wine', category: 'beverage', abv: 13, notes: ['tannin', 'berry'], subs: [], blurb: 'For sangria and for floating on top of a New York sour, where it sits as a dark band over the foam.', icon: '🍷' },
  { id: 'br-lager', name: 'Lager', kind: 'beer', category: 'beverage', abv: 5, notes: ['crisp', 'grain'], subs: [], blurb: 'Cold and neutral. Mostly here for micheladas and beer margaritas.', icon: '🍺' },

  // ── Mixers ─────────────────────────────────────────────────────────────
  { id: 'mx-tonic', name: 'Tonic water', kind: 'mixer', category: 'mixer', abv: 0, notes: ['quinine', 'bitter', 'sweet'], subs: ['mx-soda'], blurb: 'Sweetened and bittered with quinine. Not interchangeable with soda water — it brings sugar.', icon: '🫧' },
  { id: 'mx-soda', name: 'Soda water', kind: 'mixer', category: 'mixer', abv: 0, notes: ['neutral', 'bubbles'], subs: ['mx-tonic'], blurb: 'Bubbles and nothing else. Lengthens a drink without changing its balance.', icon: '💧' },
  { id: 'mx-cola', name: 'Cola', kind: 'mixer', category: 'mixer', abv: 0, notes: ['caramel', 'spice', 'sweet'], subs: [], blurb: 'Sweet, acidic and heavily spiced. Carries dark rum and whiskey better than it has any right to.', icon: '🥤' },
  { id: 'mx-ginger-beer', name: 'Ginger beer', kind: 'mixer', category: 'mixer', abv: 0, notes: ['ginger', 'spice', 'sharp'], subs: ['mx-ginger-ale'], blurb: 'Hot and gingery, much more assertive than ginger ale. The mule depends on the difference.', icon: '🫚' },
  { id: 'mx-ginger-ale', name: 'Ginger ale', kind: 'mixer', category: 'mixer', abv: 0, notes: ['ginger', 'mild', 'sweet'], subs: ['mx-ginger-beer'], blurb: 'The mild version — more soda than ginger. Fine as a lengthener, thin as a feature.', icon: '🫧' },
  { id: 'mx-lemon-lime', name: 'Lemon-lime soda', kind: 'mixer', category: 'mixer', abv: 0, notes: ['citrus', 'sweet'], subs: ['mx-soda'], blurb: 'Sweet citrus and bubbles in one bottle. Does sugar and dilution simultaneously.', icon: '🥤' },
  { id: 'mx-oj', name: 'Orange juice', kind: 'mixer', category: 'mixer', abv: 0, notes: ['orange', 'sweet', 'pulpy'], subs: [], blurb: 'Sweet rather than sour, so it does not balance a drink the way lemon or lime does.', icon: '🍊' },
  { id: 'mx-pineapple', name: 'Pineapple juice', kind: 'mixer', category: 'mixer', abv: 0, notes: ['tropical', 'sweet', 'tart'], subs: [], blurb: 'Sweet and acidic at once, and it foams when shaken — the closest a juice gets to egg white.', icon: '🍍' },
  { id: 'mx-cranberry', name: 'Cranberry juice', kind: 'mixer', category: 'mixer', abv: 0, notes: ['tart', 'berry'], subs: [], blurb: 'Tart, astringent and useful mostly for colour and edge.', icon: '🔴' },
  { id: 'mx-grapefruit', name: 'Grapefruit juice', kind: 'mixer', category: 'mixer', abv: 0, notes: ['bitter', 'citrus', 'tart'], subs: [], blurb: 'Bitter where orange is sweet. Pairs with tequila and salt better than anything else in the fridge.', icon: '🍊' },
  { id: 'mx-tomato', name: 'Tomato juice', kind: 'mixer', category: 'mixer', abv: 0, notes: ['savoury', 'umami'], subs: [], blurb: 'The base of the only savoury classic. Wants salt, acid and heat, not sugar.', icon: '🍅' },
  { id: 'mx-lime-juice', name: 'Lime juice', kind: 'mixer', category: 'mixer', abv: 0, notes: ['sour', 'bright'], subs: ['mx-lemon-juice'], blurb: 'The single most load-bearing ingredient behind the bar. Squeeze it fresh — bottled lime is a different, duller thing.', icon: '🍈' },
  { id: 'mx-lemon-juice', name: 'Lemon juice', kind: 'mixer', category: 'mixer', abv: 0, notes: ['sour', 'clean'], subs: ['mx-lime-juice'], blurb: 'Rounder and less aromatic than lime. Whiskey and gin generally prefer it.', icon: '🍋' },
  { id: 'mx-coconut-cream', name: 'Cream of coconut', kind: 'mixer', category: 'mixer', abv: 0, notes: ['coconut', 'rich', 'sweet'], subs: [], blurb: 'Sweetened and thick — not the same as coconut milk. A piña colada is unrecoverable without it.', icon: '🥥' },
  { id: 'mx-espresso', name: 'Espresso', kind: 'mixer', category: 'mixer', abv: 0, notes: ['roast', 'bitter'], subs: ['mx-cold-brew'], blurb: 'Hot and fresh gives the crema that makes an espresso martini foam. Cold brew works but sits flatter.', icon: '☕' },
  { id: 'mx-cold-brew', name: 'Cold brew', kind: 'mixer', category: 'mixer', abv: 0, notes: ['coffee', 'smooth'], subs: ['mx-espresso'], blurb: 'Less acidic than espresso and easier to keep on hand.', icon: '🧋' },
  { id: 'mx-cream', name: 'Heavy cream', kind: 'mixer', category: 'mixer', abv: 0, notes: ['rich', 'dairy'], subs: ['mx-milk'], blurb: 'For dessert drinks. Curdles against citrus, so it never shares a shaker with lemon.', icon: '🥛' },
  { id: 'mx-milk', name: 'Milk', kind: 'mixer', category: 'mixer', abv: 0, notes: ['dairy', 'mild'], subs: ['mx-cream'], blurb: 'Thinner than cream and behaves the same way around acid — badly.', icon: '🥛' },
  { id: 'mx-lemonade', name: 'Lemonade', kind: 'mixer', category: 'mixer', abv: 0, notes: ['sweet', 'sour'], subs: [], blurb: 'Sugar and lemon pre-balanced. Convenient, and the reason many punches need nothing else.', icon: '🍋' },
  { id: 'mx-iced-tea', name: 'Iced tea', kind: 'mixer', category: 'mixer', abv: 0, notes: ['tannin', 'brisk'], subs: ['mx-black-tea'], blurb: 'Tannic and dry. Half lemonade, half tea is an Arnold Palmer and needs no help.', icon: '🧊' },

  // ── Sweet ──────────────────────────────────────────────────────────────
  { id: 'sw-simple', name: 'Simple syrup', kind: 'syrup', category: 'sweet', abv: 0, notes: ['sweet', 'neutral'], subs: ['sw-agave', 'sw-honey'], blurb: 'Equal sugar and water, dissolved. Sugar that mixes cold — the reason it exists.', icon: '🍯' },
  { id: 'sw-grenadine', name: 'Grenadine', kind: 'syrup', category: 'sweet', abv: 0, notes: ['pomegranate', 'sweet', 'red'], subs: [], blurb: 'Pomegranate syrup. Real grenadine tastes of fruit; the cheap stuff is red sugar, and both sink beautifully.', icon: '🍒' },
  { id: 'sw-agave', name: 'Agave nectar', kind: 'syrup', category: 'sweet', abv: 0, notes: ['sweet', 'earthy'], subs: ['sw-simple'], blurb: 'Sweeter than simple syrup, so use less. Natural partner to tequila and mezcal.', icon: '🌵' },
  { id: 'sw-honey', name: 'Honey syrup', kind: 'syrup', category: 'sweet', abv: 0, notes: ['honey', 'floral'], subs: ['sw-simple'], blurb: 'Honey cut with warm water so it will actually mix. Straight honey seizes in a cold shaker.', icon: '🍯' },
  { id: 'sw-orgeat', name: 'Orgeat', kind: 'syrup', category: 'sweet', abv: 0, notes: ['almond', 'floral', 'rich'], subs: ['lq-amaretto'], blurb: 'Almond syrup with orange flower water. The secret of the mai tai and impossible to fake convincingly.', icon: '🌰' },
  { id: 'sw-demerara', name: 'Demerara syrup', kind: 'syrup', category: 'sweet', abv: 0, notes: ['molasses', 'caramel'], subs: ['sw-simple'], blurb: 'Raw sugar syrup — darker and rounder than simple. Rum and whiskey both improve on it.', icon: '🟤' },
  { id: 'sw-sugar', name: 'Sugar', kind: 'syrup', category: 'sweet', abv: 0, notes: ['sweet'], subs: ['sw-simple'], blurb: 'Granulated or cubed. Only useful where something gets muddled against it.', icon: '🧂' },

  // ── Flavor ─────────────────────────────────────────────────────────────
  { id: 'fl-angostura', name: 'Angostura bitters', kind: 'bitters', category: 'flavor', abv: 44, notes: ['clove', 'cinnamon', 'bitter'], subs: [], blurb: 'Concentrated aromatic bitters. Two dashes changes a drink; a whole ounce would ruin one.', icon: '🫙' },
  { id: 'fl-orange-bitters', name: 'Orange bitters', kind: 'bitters', category: 'flavor', abv: 28, notes: ['orange peel', 'spice'], subs: ['fl-angostura'], blurb: 'Brighter and less clove-heavy than Angostura. Belongs in gin drinks.', icon: '🫙' },
  { id: 'fl-mint', name: 'Fresh mint', kind: 'garnish', category: 'flavor', abv: 0, notes: ['cool', 'green'], subs: [], blurb: 'Slap it, do not shred it — bruising releases the oils, tearing releases chlorophyll and bitterness.', icon: '🌿' },
  { id: 'fl-basil', name: 'Fresh basil', kind: 'garnish', category: 'flavor', abv: 0, notes: ['peppery', 'anise'], subs: ['fl-mint'], blurb: 'Peppery and slightly aniseed. Works anywhere mint does, but louder.', icon: '🌿' },
  { id: 'fl-jalapeno', name: 'Jalapeño', kind: 'garnish', category: 'flavor', abv: 0, notes: ['heat', 'green'], subs: ['fl-hot-sauce'], blurb: 'Two slices muddled is warm; four is hot. Heat builds in the shaker, so start low.', icon: '🌶️' },
  { id: 'fl-cucumber', name: 'Cucumber', kind: 'garnish', category: 'flavor', abv: 0, notes: ['fresh', 'green', 'cool'], subs: [], blurb: 'Cooling and faintly sweet. Gin and cucumber is barely a recipe and still works.', icon: '🥒' },
  { id: 'fl-salt', name: 'Salt', kind: 'extra', category: 'flavor', abv: 0, notes: ['saline'], subs: [], blurb: 'A pinch in a sour suppresses bitterness and makes fruit taste more like itself.', icon: '🧂', staple: true },
  { id: 'fl-pepper', name: 'Black pepper', kind: 'extra', category: 'flavor', abv: 0, notes: ['spice', 'heat'], subs: [], blurb: 'Savoury drinks only, and always freshly ground.', icon: '⚫', staple: true },
  { id: 'fl-hot-sauce', name: 'Hot sauce', kind: 'extra', category: 'flavor', abv: 0, notes: ['heat', 'vinegar'], subs: ['fl-jalapeno'], blurb: 'Heat plus acid. A few dashes is the difference between a bloody mary and tomato juice.', icon: '🌶️' },
  { id: 'fl-worcestershire', name: 'Worcestershire', kind: 'extra', category: 'flavor', abv: 0, notes: ['umami', 'savoury'], subs: [], blurb: 'Anchovy, tamarind and vinegar. Pure savoury depth, and nothing else does its job.', icon: '🫗' },

  // ── Garnish ────────────────────────────────────────────────────────────
  { id: 'gn-lime', name: 'Lime', kind: 'garnish', category: 'garnish', abv: 0, notes: ['citrus', 'aromatic'], subs: ['gn-lemon'], blurb: 'Wedge to squeeze, wheel to look at, peel for the oils. Three garnishes from one fruit.', icon: '🍈' },
  { id: 'gn-lemon', name: 'Lemon', kind: 'garnish', category: 'garnish', abv: 0, notes: ['citrus', 'bright'], subs: ['gn-lime'], blurb: 'A twist expressed over the surface changes the smell of a drink before it is tasted.', icon: '🍋' },
  { id: 'gn-orange', name: 'Orange', kind: 'garnish', category: 'garnish', abv: 0, notes: ['sweet citrus', 'oil'], subs: ['gn-lemon'], blurb: 'The peel matters more than the flesh. Express it skin-down over the glass.', icon: '🍊' },
  { id: 'gn-cherry', name: 'Cocktail cherry', kind: 'garnish', category: 'garnish', abv: 0, notes: ['sweet', 'dark'], subs: [], blurb: 'The good ones are dark and syrupy, not neon. Worth the upgrade for manhattans.', icon: '🍒' },
  { id: 'gn-olive', name: 'Olive', kind: 'garnish', category: 'garnish', abv: 0, notes: ['briny', 'savoury'], subs: [], blurb: 'Brine in a martini is a decision, not an accident. Three olives, never two.', icon: '🫒' },
  { id: 'gn-celery', name: 'Celery', kind: 'garnish', category: 'garnish', abv: 0, notes: ['green', 'savoury'], subs: [], blurb: 'Structural as much as decorative — it is a stirrer you can eat.', icon: '🥬' },
  { id: 'gn-pineapple', name: 'Pineapple wedge', kind: 'garnish', category: 'garnish', abv: 0, notes: ['tropical', 'sweet'], subs: [], blurb: 'A wedge on the rim signals what the drink is before anyone tastes it.', icon: '🍍' },
  { id: 'gn-strawberry', name: 'Strawberry', kind: 'garnish', category: 'garnish', abv: 0, notes: ['berry', 'sweet'], subs: [], blurb: 'Muddles as well as it garnishes.', icon: '🍓' },
  { id: 'gn-watermelon', name: 'Watermelon', kind: 'garnish', category: 'garnish', abv: 0, notes: ['fresh', 'sweet', 'summer'], subs: [], blurb: 'Mostly water, which means it dilutes as it flavours. Muddle it and skip some of the ice.', icon: '🍉' },

  // ── Ice ────────────────────────────────────────────────────────────────
  { id: 'ic-cubes', name: 'Ice cubes', kind: 'ice', category: 'ice', abv: 0, notes: ['cold'], subs: [], blurb: 'Dilution is an ingredient. Fill the shaker properly — half-empty shakers over-water the drink.', icon: '🧊', staple: true },
  { id: 'ic-crushed', name: 'Crushed ice', kind: 'ice', category: 'ice', abv: 0, notes: ['cold', 'fast melt'], subs: ['ic-cubes'], blurb: 'Chills and dilutes fast. Right for juleps and swizzles, wrong for anything meant to last.', icon: '❄️' },
  { id: 'ic-big-cube', name: 'Large cube', kind: 'ice', category: 'ice', abv: 0, notes: ['slow melt'], subs: ['ic-cubes'], blurb: 'Less surface area, slower dilution. For spirit-forward drinks you sip.', icon: '🧊' },

  // ── Glass ──────────────────────────────────────────────────────────────
  { id: 'gl-rocks', name: 'Rocks glass', kind: 'glass', category: 'glass', abv: 0, notes: [], subs: [], blurb: 'Short and heavy. For anything served over ice without a lengthener.', icon: '🥃' },
  { id: 'gl-highball', name: 'Highball', kind: 'glass', category: 'glass', abv: 0, notes: [], subs: ['gl-collins'], blurb: 'Tall and narrow, which keeps carbonation alive longer than a wide glass.', icon: '🥛' },
  { id: 'gl-collins', name: 'Collins glass', kind: 'glass', category: 'glass', abv: 0, notes: [], subs: ['gl-highball'], blurb: 'Taller and narrower still. Built for soda-topped drinks.', icon: '🥤' },
  { id: 'gl-coupe', name: 'Coupe', kind: 'glass', category: 'glass', abv: 0, notes: [], subs: ['gl-martini'], blurb: 'Stemmed and shallow. Keeps a hand off the bowl, which keeps the drink cold.', icon: '🥂' },
  { id: 'gl-martini', name: 'Martini glass', kind: 'glass', category: 'glass', abv: 0, notes: [], subs: ['gl-coupe'], blurb: 'Dramatic and spill-prone. The coupe does the same job without the cleanup.', icon: '🍸' },
  { id: 'gl-flute', name: 'Flute', kind: 'glass', category: 'glass', abv: 0, notes: [], subs: ['gl-coupe'], blurb: 'Narrow to preserve bubbles. Sparkling only.', icon: '🥂' },
  { id: 'gl-mug', name: 'Copper mug', kind: 'glass', category: 'glass', abv: 0, notes: [], subs: ['gl-highball'], blurb: 'Conducts cold straight to your hand. Traditional for mules and genuinely colder.', icon: '🍺' },
  { id: 'gl-hurricane', name: 'Hurricane glass', kind: 'glass', category: 'glass', abv: 0, notes: [], subs: ['gl-collins'], blurb: 'Big, curved and unsubtle. For blended tropical drinks that need the volume.', icon: '🍹' },

  // ── Tools ──────────────────────────────────────────────────────────────
  { id: 'tl-shaker', name: 'Cocktail shaker', kind: 'tool', category: 'tool', abv: 0, notes: [], subs: [], blurb: 'Anything with citrus, juice or dairy gets shaken. A sealed jar works in a pinch.', icon: '🍸' },
  { id: 'tl-jigger', name: 'Jigger', kind: 'tool', category: 'tool', abv: 0, notes: [], subs: [], blurb: 'Cocktails are ratios. Free-pouring is how a good recipe becomes an average drink.', icon: '⏳' },
  { id: 'tl-strainer', name: 'Strainer', kind: 'tool', category: 'tool', abv: 0, notes: [], subs: [], blurb: 'Holds the ice back. A fine mesh on top catches pulp and mint fragments.', icon: '🕸️' },
  { id: 'tl-muddler', name: 'Muddler', kind: 'tool', category: 'tool', abv: 0, notes: [], subs: [], blurb: 'Press and twist, do not pulverise. The back of a wooden spoon does fine.', icon: '🪵' },
  { id: 'tl-barspoon', name: 'Bar spoon', kind: 'tool', category: 'tool', abv: 0, notes: [], subs: [], blurb: 'Long and twisted so it spins between your fingers. For stirring and for floats.', icon: '🥄' },
  { id: 'tl-peeler', name: 'Peeler', kind: 'tool', category: 'tool', abv: 0, notes: [], subs: [], blurb: 'A wide, pith-free strip of peel is the difference between a twist and a mess.', icon: '🔪' },

  // ── Vibe ───────────────────────────────────────────────────────────────
  { id: 'vb-umbrella', name: 'Paper umbrellas', kind: 'extra', category: 'vibe', abv: 0, notes: [], subs: [], blurb: 'Contributes nothing to flavour and everything to the occasion.', icon: '🌂' },
  { id: 'vb-straws', name: 'Straws', kind: 'extra', category: 'vibe', abv: 0, notes: [], subs: [], blurb: 'Crushed-ice drinks need them. Reusable ones survive a whole party.', icon: '🥤' },
  { id: 'vb-rim-salt', name: 'Rimming salt', kind: 'extra', category: 'vibe', abv: 0, notes: ['saline'], subs: ['fl-salt'], blurb: 'Rim half the glass so the drinker can choose. Coarse, not table salt.', icon: '🧂' },
  { id: 'vb-sparkler', name: 'Sparklers', kind: 'extra', category: 'vibe', abv: 0, notes: [], subs: [], blurb: 'For punches that arrive rather than get served.', icon: '✨' },
];

export const CATALOG: CatalogItem[] = [...rows, ...BAR_ROWS].map((r) => ({
  id: r.id,
  name: r.name,
  kind: r.kind,
  category: r.category,
  spiritType: r.spirit ?? null,
  styleSubtype: r.style ?? null,
  typicalAbv: r.abv ?? 0,
  flavorNotes: r.notes ?? [],
  substituteIds: r.subs ?? [],
  blurb: r.blurb,
  isZeroProof: (r.abv ?? 0) === 0,
  isStaple: r.staple ?? false,
  icon: r.icon,
}));

export const CATALOG_BY_ID: Record<string, CatalogItem> = Object.fromEntries(
  CATALOG.map((c) => [c.id, c])
);

/** One-tap starter kit for the empty state — the eight things most bars open with. */
export const STARTER_KIT = [
  'sp-vodka',
  'sp-gin',
  'sp-rum-white',
  'sp-tequila-blanco',
  'mx-lime-juice',
  'mx-soda',
  'sw-simple',
  'ic-cubes',
];
