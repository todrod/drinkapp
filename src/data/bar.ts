import { CatalogRow, Level } from '../types';

/**
 * Catalog entries added to cover a real, well-stocked home bar — amari,
 * tiki modifiers, aperitifs, schnapps and the bitters shelf that the generic
 * starter catalog doesn't reach.
 *
 * Ids here are stable and additive; nothing in catalog.ts changes.
 */
export const BAR_ROWS: CatalogRow[] = [
  // ── Rum, expanded ──────────────────────────────────────────────────────
  { id: 'sp-rum-aged', name: 'Aged rum', kind: 'spirit', category: 'beverage', spirit: 'rum', style: 'aged', abv: 40, notes: ['oak', 'toffee', 'dried fruit'], subs: ['sp-rum-dark', 'sp-rum-white'], blurb: 'Years in barrel turn cane spirit soft and round. Good enough to sip, which is exactly why a mai tai made with it tastes different.', icon: '🥃' },
  { id: 'sp-rum-jamaican', name: 'Jamaican pot-still rum', kind: 'spirit', category: 'beverage', spirit: 'rum', style: 'overproof', abv: 57, notes: ['funk', 'banana', 'overproof'], subs: ['sp-rum-dark', 'sp-rum-aged'], blurb: 'High-ester and loud — the hogo. Half an ounce carries a whole tiki drink, and two ounces flattens it.', icon: '🔥' },

  // ── Brandy family ──────────────────────────────────────────────────────
  { id: 'sp-cognac', name: 'Cognac', kind: 'spirit', category: 'beverage', spirit: 'brandy', style: 'VSOP', abv: 40, notes: ['stone fruit', 'oak', 'floral'], subs: ['sp-brandy'], blurb: 'Grape brandy from one place in France, aged to a grade. VSOP is the sweet spot for mixing — old enough to taste of something, young enough to spend.', icon: '🍇' },
  { id: 'sp-apple-brandy', name: 'Apple brandy', kind: 'spirit', category: 'beverage', spirit: 'brandy', abv: 40, notes: ['apple', 'orchard', 'dry'], subs: ['sp-brandy'], blurb: 'Distilled cider, aged. Drier than it sounds and a natural swap into whiskey drinks in autumn.', icon: '🍎' },
  { id: 'sp-plum-brandy', name: 'Plum brandy', kind: 'spirit', category: 'beverage', spirit: 'brandy', abv: 42, notes: ['stone fruit', 'earthy', 'sharp'], subs: ['sp-brandy'], blurb: 'Central European fruit brandy — slivovitz and its cousins. Assertive, faintly savoury, best with a light hand.', icon: '🫐' },

  // ── Flavoured whiskey ──────────────────────────────────────────────────
  { id: 'sp-peach-whiskey', name: 'Peach whiskey', kind: 'liqueur', category: 'beverage', spirit: 'whiskey', abv: 35, notes: ['peach', 'sweet', 'corn'], subs: ['lq-peach'], blurb: 'Sweetened flavoured whiskey. Treat it as a modifier carrying its own sugar, not as a base.', icon: '🍑' },
  { id: 'sp-caramel-whisky', name: 'Caramel whisky', kind: 'liqueur', category: 'beverage', spirit: 'whiskey', abv: 35, notes: ['caramel', 'toffee', 'sweet'], subs: ['lq-caramel'], blurb: 'Dessert in a bottle. Cut it with something bitter or it flattens whatever it touches.', icon: '🍮' },
  { id: 'sp-pb-whiskey', name: 'Peanut butter whiskey', kind: 'liqueur', category: 'beverage', spirit: 'whiskey', abv: 35, notes: ['peanut', 'sweet', 'roast'], subs: [], blurb: 'Exactly what it says. Works better than it should against coffee, chocolate and stout.', icon: '🥜' },
  { id: 'lq-spiced-cider', name: 'Spiced cider whiskey', kind: 'liqueur', category: 'beverage', abv: 30, notes: ['apple', 'cinnamon', 'sweet'], subs: ['sp-apple-brandy'], blurb: 'Apple and baking spice on a whiskey base. Autumn highballs and hot drinks.', icon: '🍂' },

  // ── Orange & fruit liqueurs ────────────────────────────────────────────
  { id: 'lq-curacao-dry', name: 'Dry curaçao', kind: 'liqueur', category: 'beverage', abv: 40, notes: ['bitter orange', 'spice', 'oak'], subs: ['lq-cointreau', 'lq-triple-sec'], blurb: 'Curaçao made the old way — drier, spicier and less candied than triple sec. The tiki default.', icon: '🍊' },
  { id: 'lq-grand-marnier', name: 'Orange cognac liqueur', kind: 'liqueur', category: 'beverage', abv: 40, notes: ['orange', 'cognac', 'rich'], subs: ['lq-cointreau', 'lq-curacao-dry'], blurb: 'Orange liqueur built on brandy rather than neutral spirit, so it brings weight as well as citrus.', icon: '🍊' },
  { id: 'lq-apricot', name: 'Apricot liqueur', kind: 'liqueur', category: 'beverage', abv: 25, notes: ['apricot', 'stone fruit', 'sweet'], subs: ['lq-peach'], blurb: 'A pre-war staple that fell out of fashion and came back. Bridges gin and rum drinks equally well.', icon: '🍑' },
  { id: 'lq-maraschino', name: 'Maraschino liqueur', kind: 'liqueur', category: 'beverage', abv: 32, notes: ['cherry pit', 'nutty', 'dry'], subs: [], blurb: 'Not the syrup in the cherry jar — a dry, funky cherry-pit distillate. A quarter-ounce is usually plenty.', icon: '🍒' },
  { id: 'lq-limoncello', name: 'Limoncello', kind: 'liqueur', category: 'beverage', abv: 28, notes: ['lemon', 'sweet', 'zesty'], subs: [], blurb: 'Lemon peel steeped in neutral spirit and sweetened. Serve it very cold or not at all.', icon: '🍋' },
  { id: 'lq-hazelnut', name: 'Hazelnut liqueur', kind: 'liqueur', category: 'beverage', abv: 24, notes: ['hazelnut', 'toasted', 'sweet'], subs: ['lq-amaretto'], blurb: 'Toasted nut and vanilla. Pairs with coffee, chocolate and aged rum.', icon: '🌰' },
  { id: 'lq-choc', name: 'Chocolate liqueur', kind: 'liqueur', category: 'beverage', abv: 24, notes: ['cocoa', 'sweet'], subs: [], blurb: 'Stands in for crème de cacao in most dessert drinks.', icon: '🍫' },
  { id: 'lq-mandarine', name: 'Mandarin liqueur', kind: 'liqueur', category: 'beverage', abv: 30, notes: ['mandarin', 'bright', 'sweet'], subs: ['lq-triple-sec'], blurb: 'Softer and rounder than bitter-orange liqueurs.', icon: '🍊' },
  { id: 'lq-blood-orange', name: 'Blood orange liqueur', kind: 'liqueur', category: 'beverage', abv: 23, notes: ['orange', 'berry', 'sweet'], subs: ['lq-triple-sec'], blurb: 'Orange with a red-fruit edge. Good where you want colour as well as citrus.', icon: '🩸' },
  { id: 'lq-pear', name: 'Pear liqueur', kind: 'liqueur', category: 'beverage', abv: 38, notes: ['pear', 'orchard', 'sweet'], subs: [], blurb: 'Delicate — it disappears against anything bitter. Keep the rest of the drink quiet.', icon: '🍐' },
  { id: 'lq-cherry', name: 'Cherry liqueur', kind: 'liqueur', category: 'beverage', abv: 23, notes: ['cherry', 'sweet'], subs: ['lq-maraschino'], blurb: 'Sweet and jammy, unlike maraschino. The two are not interchangeable.', icon: '🍒' },
  { id: 'lq-caramel', name: 'Caramel liqueur', kind: 'liqueur', category: 'beverage', abv: 20, notes: ['caramel', 'cream', 'sweet'], subs: ['lq-butterscotch'], blurb: 'Dessert modifier. Sugar first, flavour second — cut the syrup elsewhere.', icon: '🍮' },
  { id: 'lq-butterscotch', name: 'Butterscotch schnapps', kind: 'liqueur', category: 'beverage', abv: 15, notes: ['butterscotch', 'sweet'], subs: ['lq-caramel'], blurb: 'Very sweet and very direct. Best hidden inside something with acid or coffee.', icon: '🧈' },
  { id: 'lq-peppermint', name: 'Peppermint schnapps', kind: 'liqueur', category: 'beverage', abv: 50, notes: ['mint', 'cool', 'sharp'], subs: [], blurb: 'Stands in for crème de menthe at higher proof — halve the pour if you swap.', icon: '🌱' },
  { id: 'lq-tiramisu', name: 'Tiramisu cream liqueur', kind: 'liqueur', category: 'beverage', abv: 17, notes: ['cream', 'coffee', 'cocoa'], subs: ['lq-irish-cream'], blurb: 'Dairy-based, so it curdles against citrus. Coffee and chocolate only.', icon: '🍰' },
  { id: 'lq-sloe-gin', name: 'Sloe gin', kind: 'liqueur', category: 'beverage', abv: 26, notes: ['sloe', 'tart', 'red fruit'], subs: [], blurb: 'Gin steeped with sloe berries and sugar. Tart, dark and much lower proof than gin.', icon: '🫐' },

  // ── Amari, aperitifs & digestifs ───────────────────────────────────────
  { id: 'lq-amaro', name: 'Amaro', kind: 'liqueur', category: 'beverage', spirit: 'aperitif', abv: 23, notes: ['bitter', 'herbal', 'orange peel'], subs: ['lq-campari'], blurb: 'Italian bittersweet herbal liqueur. Softer than Campari and a natural bridge between whiskey and citrus.', icon: '🌿' },
  { id: 'lq-fernet', name: 'Fernet', kind: 'liqueur', category: 'beverage', spirit: 'aperitif', abv: 39, notes: ['menthol', 'bitter', 'medicinal'], subs: ['lq-amaro'], blurb: 'The most aggressive amaro on the shelf. A quarter-ounce reads as a whole ingredient.', icon: '🖤' },
  { id: 'lq-benedictine', name: 'Bénédictine', kind: 'liqueur', category: 'beverage', abv: 40, notes: ['honey', 'herbal', 'saffron'], subs: [], blurb: 'Honeyed herbal liqueur with a secret recipe and a long reach — a quarter-ounce lifts whiskey drinks noticeably.', icon: '🍯' },
  { id: 'lq-jager', name: 'Jägermeister', kind: 'liqueur', category: 'beverage', spirit: 'aperitif', abv: 35, notes: ['anise', 'herbal', 'sweet'], subs: ['lq-amaro'], blurb: 'Sweeter and more anise-forward than most amari. Cold, and in small amounts, it mixes better than its reputation suggests.', icon: '🦌' },
  { id: 'lq-underberg', name: 'Underberg', kind: 'liqueur', category: 'beverage', spirit: 'aperitif', abv: 44, notes: ['bitter', 'herbal', 'dry'], subs: ['lq-fernet'], blurb: 'A single-serve digestif bitter. One bottle is exactly one dose, and it is not a mixer so much as a full stop.', icon: '🫗' },
  { id: 'lq-italicus', name: 'Bergamot liqueur', kind: 'liqueur', category: 'beverage', abv: 20, notes: ['bergamot', 'floral', 'citrus'], subs: ['lq-elderflower'], blurb: 'Bergamot and chamomile — like the smell of Earl Grey. Spectacular with prosecco or dry gin.', icon: '🌼' },
  { id: 'lq-absinthe', name: 'Absinthe', kind: 'liqueur', category: 'beverage', abv: 60, notes: ['anise', 'wormwood', 'herbal'], subs: [], blurb: 'Used in dashes and rinses far more often than in ounces. A rinsed glass flavours the whole drink.', icon: '💚' },
  { id: 'lq-allspice', name: 'Allspice dram', kind: 'liqueur', category: 'beverage', abv: 22, notes: ['allspice', 'clove', 'baking spice'], subs: [], blurb: 'Pimento dram. A quarter-ounce is the difference between a rum drink and a tiki drink.', icon: '🫘' },
  { id: 'lq-falernum', name: 'Falernum', kind: 'liqueur', category: 'beverage', abv: 11, notes: ['lime', 'clove', 'almond'], subs: ['sw-orgeat'], blurb: 'Lime, clove, ginger and almond in one low-proof bottle. Sweetener and spice at the same time.', icon: '🥥' },

  // ── Wine & beer ────────────────────────────────────────────────────────
  { id: 'wn-madeira', name: 'Madeira', kind: 'wine', category: 'beverage', spirit: 'aperitif', abv: 19, notes: ['nutty', 'caramel', 'oxidised'], subs: ['lq-vermouth-sweet'], blurb: 'Deliberately heated and oxidised fortified wine, so an open bottle keeps for months rather than days.', icon: '🍷' },
  { id: 'wn-white', name: 'White wine', kind: 'wine', category: 'beverage', abv: 12, notes: ['crisp', 'citrus'], subs: ['wn-prosecco'], blurb: 'For spritzes and low-ABV highballs where you want acid without more citrus.', icon: '🥂' },
  { id: 'br-stout', name: 'Stout', kind: 'beer', category: 'beverage', abv: 4.5, notes: ['roast', 'coffee', 'creamy'], subs: [], blurb: 'Roasted and creamy. Pairs with coffee and chocolate liqueurs better than any other beer.', icon: '🍺' },
  { id: 'br-pumpkin-ale', name: 'Pumpkin ale', kind: 'beer', category: 'beverage', abv: 5.5, notes: ['spice', 'malt', 'cinnamon'], subs: ['br-lager'], blurb: 'Already spiced, so it needs almost nothing added. Good with apple brandy or spiced cider.', icon: '🎃' },

  // ── Mixers ─────────────────────────────────────────────────────────────
  { id: 'mx-black-tea', name: 'Black tea', kind: 'mixer', category: 'mixer', abv: 0, notes: ['tannin', 'brisk'], subs: ['mx-iced-tea'], blurb: 'Brewed strong and chilled, it adds tannic grip that juice cannot.', icon: '🫖' },
  { id: 'mx-half-and-half', name: 'Half and half', kind: 'mixer', category: 'mixer', abv: 0, notes: ['dairy', 'rich'], subs: ['mx-cream', 'mx-milk'], blurb: 'Between milk and cream. Enough fat for a dessert drink without going claggy.', icon: '🥛' },
  { id: 'mx-creamer', name: 'Creamer', kind: 'mixer', category: 'mixer', abv: 0, notes: ['dairy', 'sweet'], subs: ['mx-half-and-half', 'mx-milk'], blurb: 'Shelf-stable and usually pre-sweetened — account for the sugar.', icon: '🥤' },

  // ── Syrups ─────────────────────────────────────────────────────────────
  { id: 'sw-passion-fruit', name: 'Passion fruit syrup', kind: 'syrup', category: 'sweet', abv: 0, notes: ['tropical', 'tart', 'floral'], subs: [], blurb: 'Sweet and genuinely sour at once, so it does two jobs. Back off the citrus when you use it.', icon: '🥭' },
  { id: 'sw-lychee', name: 'Lychee syrup', kind: 'syrup', category: 'sweet', abv: 0, notes: ['floral', 'sweet', 'perfumed'], subs: [], blurb: 'Perfumed and delicate. Gin and vodka carry it; anything aged buries it.', icon: '🌸' },

  // ── Bitters ────────────────────────────────────────────────────────────
  { id: 'fl-peychauds', name: "Peychaud's bitters", kind: 'bitters', category: 'flavor', abv: 35, notes: ['anise', 'cherry', 'floral'], subs: ['fl-angostura'], blurb: 'Lighter and more floral than Angostura, with a red tint. The Sazerac is built on it.', icon: '🫙' },
  { id: 'fl-tiki-bitters', name: 'Tiki bitters', kind: 'bitters', category: 'flavor', abv: 32, notes: ['allspice', 'cinnamon', 'clove'], subs: ['fl-angostura', 'lq-allspice'], blurb: 'Baking spice concentrated. Two dashes does what a quarter-ounce of dram does.', icon: '🗿' },
  { id: 'fl-tropical-bitters', name: 'Tropical bitters', kind: 'bitters', category: 'flavor', abv: 30, notes: ['tropical', 'floral', 'spice'], subs: ['fl-tiki-bitters'], blurb: 'Fruit-and-flower bitters for rum drinks that already have enough spice.', icon: '🌺' },
  { id: 'fl-lemon-bitters', name: 'Lemon bitters', kind: 'bitters', category: 'flavor', abv: 25, notes: ['lemon', 'zest'], subs: ['fl-orange-bitters'], blurb: 'Zest without juice — brightness with no extra acid.', icon: '🍋' },
  { id: 'fl-lavender-bitters', name: 'Lavender bitters', kind: 'bitters', category: 'flavor', abv: 40, notes: ['floral', 'herbal'], subs: [], blurb: 'Easy to overdo. One dash in a gin drink, then stop.', icon: '💜' },
  { id: 'fl-bokers', name: "Boker's bitters", kind: 'bitters', category: 'flavor', abv: 35, notes: ['cardamom', 'bitter', 'historic'], subs: ['fl-angostura'], blurb: 'A revived 19th-century formula — cardamom-led. What pre-Prohibition recipes actually meant by "bitters".', icon: '🫙' },
  { id: 'fl-cherry-bitters', name: 'Spiced cherry bitters', kind: 'bitters', category: 'flavor', abv: 35, notes: ['cherry', 'spice'], subs: ['fl-angostura'], blurb: 'Dark fruit and warm spice. At home in whiskey drinks.', icon: '🍒' },
  { id: 'fl-sassafras-bitters', name: 'Sassafras bitters', kind: 'bitters', category: 'flavor', abv: 35, notes: ['root beer', 'sweet spice'], subs: ['fl-angostura'], blurb: 'Root-beer register. Odd and very good with aged rum.', icon: '🌳' },
  { id: 'fl-chocolate-bitters', name: 'Chocolate bitters', kind: 'bitters', category: 'flavor', abv: 35, notes: ['cocoa', 'bitter'], subs: ['fl-angostura'], blurb: 'Dry cocoa, no sugar. Bridges whiskey and coffee.', icon: '🍫' },
];

/**
 * The actual shelf. Each entry is [display name, catalog id, level?].
 *
 * Several bottles map to the same generic catalog id on purpose — eight gins
 * all resolve `sp-gin`, so any recipe calling for gin is satisfied while the
 * kit still shows the real bottles.
 */
export const MY_BAR: [string, string, Level?][] = [
  // Gin
  ['Monkey 47 Schwarzwald Dry Gin', 'sp-gin'],
  ["Hendrick's Orbium", 'sp-gin'],
  ["Hendrick's Midsummer Solstice", 'sp-gin'],
  ['Barr Hill Gin', 'sp-gin', 'low'],
  ['Drumshanbo Gunpowder Gin', 'sp-gin'],
  ['St. George Terroir Gin', 'sp-gin'],
  ['Tanqueray Gin', 'sp-gin', 'low'],
  ['Esmé Gin (mini)', 'sp-gin', 'low'],
  ['Greenhouse Artisan Gin (mini)', 'sp-gin', 'low'],
  ["Tann's Gin (mini)", 'sp-gin', 'low'],
  ['Hofland Sloe Gin (mini)', 'lq-sloe-gin', 'low'],

  // Vodka
  ['Skyy Vodka', 'sp-vodka'],
  ['Wheatley Vodka', 'sp-vodka'],
  ['Clusius Tulip Vodka (mini)', 'sp-vodka', 'low'],

  // Rum
  ['Bacardi Superior', 'sp-rum-white'],
  ['Probitas Green Label', 'sp-rum-white'],
  ['Bacardi Añejo', 'sp-rum-aged'],
  ['Appleton Estate 12 Year', 'sp-rum-aged'],
  ['El Dorado 12 Year', 'sp-rum-aged'],
  ['Plantation 5 Year', 'sp-rum-aged'],
  ['Cruzan 5 Year Dark', 'sp-rum-aged'],
  ["Papa's Pilar Rum", 'sp-rum-aged'],
  ['Myers Dark Rum', 'sp-rum-dark'],
  ['Gosling’s Black Seal', 'sp-rum-dark'],
  ['Hamilton 86 Demerara', 'sp-rum-dark'],
  ['Smith & Cross', 'sp-rum-jamaican'],

  // Agave
  ['Ocho Tequila', 'sp-tequila-blanco'],

  // Whiskey
  ['Buffalo Trace', 'sp-bourbon'],
  ['Four Roses', 'sp-bourbon'],
  ['Crown Royal Peach', 'sp-peach-whiskey'],
  ['Black Velvet Toasted Caramel', 'sp-caramel-whisky'],
  ['Evan Williams Spiced Cider', 'lq-spiced-cider'],
  ['Skrewball-style PB&J Whiskey (mini)', 'sp-pb-whiskey', 'low'],
  ['Sheep Dog Peanut Butter Whiskey (mini)', 'sp-pb-whiskey', 'low'],

  // Brandy
  ['Haut de Vigne Cognac VSOP', 'sp-cognac'],
  ['E&J Apple Brandy', 'sp-apple-brandy', 'low'],
  ['Unidentified Plum Brandy', 'sp-plum-brandy'],

  // Orange & fruit liqueurs
  ['Cointreau', 'lq-cointreau'],
  ['Ferrand Dry Curaçao', 'lq-curacao-dry'],
  ['Grand Marnier', 'lq-grand-marnier'],
  ['DeKuyper Triple Sec', 'lq-triple-sec'],
  ['Drillaud Apricot Liqueur', 'lq-apricot'],
  ['Luxardo Maraschino', 'lq-maraschino'],
  ['Limoncello', 'lq-limoncello'],
  ['Lawn Dart Lemon Liqueur', 'lq-limoncello'],
  ['St-Germain', 'lq-elderflower'],
  ['Italicus', 'lq-italicus'],
  ['Morey Mandarine (mini)', 'lq-mandarine', 'low'],
  ['Blood Orange Schnapps (mini)', 'lq-blood-orange', 'low'],
  ['Pear Schnapps (mini)', 'lq-pear', 'low'],
  ['Cherry Schnapps (mini)', 'lq-cherry', 'low'],
  ['Peppermint Schnapps (mini)', 'lq-peppermint', 'low'],
  ['Hazelnut Schnapps (mini)', 'lq-hazelnut', 'low'],
  ['Frangelico', 'lq-hazelnut'],
  ['Disaronno', 'lq-amaretto'],
  ['Butterscotch Schnapps', 'lq-butterscotch', 'low'],

  // Cream & coffee
  ["O'Donnell's Irish Cream", 'lq-irish-cream'],
  ['Baileys', 'lq-irish-cream'],
  ["O'Donnell's Caramel (mini)", 'lq-caramel', 'low'],
  ["O'Donnell's Tiramisu (mini)", 'lq-tiramisu', 'low'],
  ['Kahlúa', 'lq-coffee'],
  ['Curaçao Coffee Liqueur (mini)', 'lq-coffee', 'low'],
  ['Curaçao Chocolate Liqueur (mini)', 'lq-choc', 'low'],

  // Amari, aperitifs, herbal
  ['Campari', 'lq-campari'],
  ['Aperol', 'lq-aperol'],
  ['Amaro Montenegro', 'lq-amaro'],
  ['Fernet-Branca', 'lq-fernet'],
  ['DOM Bénédictine', 'lq-benedictine'],
  ['Jägermeister', 'lq-jager'],
  ['Underberg', 'lq-underberg'],
  ['Velvet Falernum', 'lq-falernum'],
  ['St. Elizabeth Allspice Dram', 'lq-allspice'],
  ['Absente Absinthe', 'lq-absinthe'],
  ['Oregon Spirit Absinthe (mini)', 'lq-absinthe', 'low'],

  // Vermouth & fortified
  ['Martini Rossi Rosso', 'lq-vermouth-sweet'],
  ['Cocchi Vermouth di Torino', 'lq-vermouth-sweet'],
  ['Martini Rossi Extra Dry', 'lq-vermouth-dry'],
  ['Dolin Dry', 'lq-vermouth-dry'],
  ["Blandy's Madeira", 'wn-madeira'],

  // Wine & beer
  ['Red wine', 'wn-red'],
  ['White wine', 'wn-white'],
  ['Guinness', 'br-stout'],
  ['Pumpkin ale', 'br-pumpkin-ale'],

  // Bitters
  ['Angostura Aromatic', 'fl-angostura'],
  ['Angostura Orange', 'fl-orange-bitters'],
  ["Peychaud's", 'fl-peychauds'],
  ["Bittermens Elemakule Tiki", 'fl-tiki-bitters'],
  ['El Guapo Polynesian Kiss', 'fl-tropical-bitters'],
  ['Fee Brothers Lemon', 'fl-lemon-bitters'],
  ["Scrappy's Lavender", 'fl-lavender-bitters'],
  ["Boker's Bitters", 'fl-bokers'],
  ['Woodford Reserve Aromatic', 'fl-angostura'],
  ['Woodford Reserve Orange', 'fl-orange-bitters'],
  ['Woodford Reserve Spiced Cherry', 'fl-cherry-bitters'],
  ['Woodford Reserve Sassafras & Sorghum', 'fl-sassafras-bitters'],
  ['Woodford Reserve Chocolate', 'fl-chocolate-bitters'],

  // Juice & mixers
  ['Pineapple juice', 'mx-pineapple'],
  ['Lemon juice', 'mx-lemon-juice'],
  ['Lime juice', 'mx-lime-juice'],
  ['Tomato juice', 'mx-tomato'],
  ['Soda water', 'mx-soda'],
  ['Tonic water', 'mx-tonic'],
  ['Coke', 'mx-cola'],
  ['Ginger beer', 'mx-ginger-beer'],
  ['Black tea', 'mx-black-tea'],
  ['Milk', 'mx-milk'],
  ['Half and half', 'mx-half-and-half'],
  ['Creamer', 'mx-creamer'],
  ['Coco López', 'mx-coconut-cream'],

  // Syrups
  ['Simple syrup', 'sw-simple'],
  ['Demerara syrup', 'sw-demerara'],
  ["Rose's Grenadine", 'sw-grenadine'],
  ['Liquid Alchemist Orgeat', 'sw-orgeat'],
  ['Passion fruit syrup', 'sw-passion-fruit'],
  ['Lychee syrup', 'sw-lychee'],

  // Garnish
  ['Olives', 'gn-olive'],
];
