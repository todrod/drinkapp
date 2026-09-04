import { CATALOG_BY_ID } from './catalog';
import { BOOK_SEEDS, THEMED_SEEDS } from './library';
import { Ing, Seed } from './seed';
import { DrinkRecipe, RecipeIngredient } from '../types';

/**
 * Bundled recipe library. Every ingredient resolves to a catalog id, which is
 * what lets the generator answer "can I pour this?" with a lookup instead of a
 * string comparison.
 *
 * Tuple form: [catalogId, amount, unit, role, optional?]
 */
const seeds: Seed[] = [
  {
    name: 'Margarita', method: 'shake', glass: 'gl-rocks', accent: '#C6FF3D',
    tags: ['refreshing', 'citrus', 'classic'],
    ing: [
      ['sp-tequila-blanco', 2, 'oz', 'base'],
      ['lq-triple-sec', 1, 'oz', 'modifier'],
      ['mx-lime-juice', 1, 'oz', 'mixer'],
      ['sw-agave', 0.25, 'oz', 'sweetener', true],
      ['vb-rim-salt', null, 'piece', 'garnish', true],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Salt half the rim with a lime wedge.', 'Shake tequila, triple sec and lime with ice for 12 seconds.', 'Strain over fresh ice.'],
    garnish: 'Lime wheel',
  },
  {
    name: 'Spicy Margarita', method: 'shake', glass: 'gl-rocks', accent: '#FF3DBE',
    tags: ['spicy', 'citrus'],
    ing: [
      ['sp-tequila-blanco', 2, 'oz', 'base'],
      ['mx-lime-juice', 1, 'oz', 'mixer'],
      ['sw-agave', 0.75, 'oz', 'sweetener'],
      ['fl-jalapeno', 3, 'piece', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Muddle three jalapeño slices in the shaker.', 'Add everything else and shake hard with ice.', 'Double-strain over fresh ice so no seeds get through.'],
    garnish: 'Jalapeño slice',
  },
  {
    name: 'Daiquiri', method: 'shake', glass: 'gl-coupe', accent: '#33E6FF',
    tags: ['refreshing', 'citrus', 'classic'],
    ing: [
      ['sp-rum-white', 2, 'oz', 'base'],
      ['mx-lime-juice', 1, 'oz', 'mixer'],
      ['sw-simple', 0.75, 'oz', 'sweetener'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake everything hard with ice for 12 seconds.', 'Double-strain into a chilled coupe.'],
    garnish: 'Lime wheel',
  },
  {
    name: 'Mojito', method: 'muddle', glass: 'gl-collins', accent: '#C6FF3D',
    tags: ['refreshing', 'tropical', 'summer'],
    ing: [
      ['sp-rum-white', 2, 'oz', 'base'],
      ['mx-lime-juice', 0.75, 'oz', 'mixer'],
      ['sw-simple', 0.5, 'oz', 'sweetener'],
      ['fl-mint', 10, 'piece', 'modifier'],
      ['mx-soda', 2, 'oz', 'mixer'],
      ['ic-crushed', null, 'piece', 'ice'],
    ],
    steps: ['Press the mint against the glass with lime and syrup — do not shred it.', 'Add rum and pack with crushed ice.', 'Top with soda and stir up from the bottom.'],
    garnish: 'Mint sprig, slapped',
  },
  {
    name: 'Moscow Mule', method: 'build', glass: 'gl-mug', accent: '#FFB43D',
    tags: ['refreshing', 'spicy'],
    ing: [
      ['sp-vodka', 2, 'oz', 'base'],
      ['mx-lime-juice', 0.5, 'oz', 'mixer'],
      ['mx-ginger-beer', 4, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Build over ice in the mug.', 'Top with ginger beer and stir once.'],
    garnish: 'Lime wedge',
  },
  {
    name: 'Old Fashioned', method: 'stir', glass: 'gl-rocks', accent: '#FFB43D',
    tags: ['spirit-forward', 'nightcap', 'classic'],
    ing: [
      ['sp-bourbon', 2, 'oz', 'base'],
      ['sw-demerara', 0.25, 'oz', 'sweetener'],
      ['fl-angostura', 2, 'dash', 'modifier'],
      ['gn-orange', null, 'piece', 'garnish'],
      ['ic-big-cube', null, 'piece', 'ice'],
    ],
    steps: ['Stir whiskey, syrup and bitters with ice for 30 seconds.', 'Strain over one large cube.', 'Express the orange peel over the surface, then drop it in.'],
    garnish: 'Orange peel',
  },
  {
    name: 'Negroni', method: 'stir', glass: 'gl-rocks', accent: '#FF3DBE',
    tags: ['bitter', 'spirit-forward', 'classic'],
    ing: [
      ['sp-gin', 1, 'oz', 'base'],
      ['lq-campari', 1, 'oz', 'modifier'],
      ['lq-vermouth-sweet', 1, 'oz', 'modifier'],
      ['ic-big-cube', null, 'piece', 'ice'],
    ],
    steps: ['Stir equal parts with ice for 30 seconds.', 'Strain over a large cube.', 'Express an orange peel over the top.'],
    garnish: 'Orange peel',
  },
  {
    name: 'Aperol Spritz', method: 'build', glass: 'gl-highball', accent: '#FFB43D',
    tags: ['refreshing', 'brunch', 'low-abv'],
    ing: [
      ['lq-aperol', 2, 'oz', 'base'],
      ['wn-prosecco', 3, 'oz', 'mixer'],
      ['mx-soda', 1, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Fill the glass with ice.', 'Prosecco first, then Aperol, then a splash of soda — in that order, so it mixes itself.'],
    garnish: 'Orange slice',
  },
  {
    name: 'Gin & Tonic', method: 'build', glass: 'gl-highball', accent: '#33E6FF',
    tags: ['refreshing', 'easy', 'classic'],
    ing: [
      ['sp-gin', 2, 'oz', 'base'],
      ['mx-tonic', 4, 'oz', 'mixer'],
      ['gn-lime', null, 'piece', 'garnish'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Fill the glass to the top with ice — more ice means slower dilution.', 'Pour gin, then tonic down a bar spoon.'],
    garnish: 'Lime wedge',
  },
  {
    name: 'Cuba Libre', method: 'build', glass: 'gl-highball', accent: '#A855F7',
    tags: ['easy', 'party'],
    ing: [
      ['sp-rum-white', 2, 'oz', 'base'],
      ['mx-cola', 4, 'oz', 'mixer'],
      ['mx-lime-juice', 0.5, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Build over ice.', 'The lime is what separates this from rum and coke.'],
    garnish: 'Lime wedge',
  },
  {
    name: 'Whiskey Sour', method: 'shake', glass: 'gl-rocks', accent: '#FFB43D',
    tags: ['citrus', 'classic'],
    ing: [
      ['sp-bourbon', 2, 'oz', 'base'],
      ['mx-lemon-juice', 0.75, 'oz', 'mixer'],
      ['sw-simple', 0.75, 'oz', 'sweetener'],
      ['fl-angostura', 2, 'dash', 'modifier', true],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake hard with ice for 12 seconds.', 'Strain over fresh ice.', 'Dash the bitters across the surface.'],
    garnish: 'Cocktail cherry',
  },
  {
    name: 'Cosmopolitan', method: 'shake', glass: 'gl-martini', accent: '#FF3DBE',
    tags: ['citrus', 'party'],
    ing: [
      ['sp-vodka', 1.5, 'oz', 'base'],
      ['lq-triple-sec', 0.5, 'oz', 'modifier'],
      ['mx-cranberry', 1, 'oz', 'mixer'],
      ['mx-lime-juice', 0.5, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake everything with ice until the tin frosts.', 'Double-strain into a chilled glass.'],
    garnish: 'Orange peel',
  },
  {
    name: 'Espresso Martini', method: 'shake', glass: 'gl-coupe', accent: '#A855F7',
    tags: ['nightcap', 'rich'],
    ing: [
      ['sp-vodka', 2, 'oz', 'base'],
      ['lq-coffee', 1, 'oz', 'modifier'],
      ['mx-espresso', 1, 'oz', 'mixer'],
      ['sw-simple', 0.25, 'oz', 'sweetener', true],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Pull the espresso fresh — the crema is what makes the foam.', 'Shake very hard with ice for 15 seconds.', 'Double-strain and let the head settle.'],
    garnish: 'Three coffee beans',
  },
  {
    name: 'Piña Colada', method: 'blend', glass: 'gl-hurricane', accent: '#C6FF3D',
    tags: ['tropical', 'summer', 'party'],
    ing: [
      ['sp-rum-white', 2, 'oz', 'base'],
      ['mx-coconut-cream', 1.5, 'oz', 'mixer'],
      ['mx-pineapple', 2, 'oz', 'mixer'],
      ['ic-crushed', null, 'piece', 'ice'],
    ],
    steps: ['Blend everything with a cup of crushed ice until smooth.', 'Pour and add a straw.'],
    garnish: 'Pineapple wedge',
  },
  {
    name: "Dark 'n Stormy", method: 'build', glass: 'gl-highball', accent: '#FFB43D',
    tags: ['spicy', 'easy'],
    ing: [
      ['sp-rum-dark', 2, 'oz', 'base'],
      ['mx-ginger-beer', 4, 'oz', 'mixer'],
      ['mx-lime-juice', 0.5, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Ginger beer and lime over ice first.', 'Float the dark rum on top so it sinks slowly — that is the storm.'],
    garnish: 'Lime wedge',
  },
  {
    name: 'Paloma', method: 'build', glass: 'gl-collins', accent: '#FF3DBE',
    tags: ['refreshing', 'citrus', 'summer'],
    ing: [
      ['sp-tequila-blanco', 2, 'oz', 'base'],
      ['mx-grapefruit', 3, 'oz', 'mixer'],
      ['mx-lime-juice', 0.5, 'oz', 'mixer'],
      ['mx-soda', 1, 'oz', 'mixer'],
      ['vb-rim-salt', null, 'piece', 'garnish', true],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Salt the rim.', 'Build over ice and top with soda.'],
    garnish: 'Grapefruit wedge',
  },
  {
    name: 'Bloody Mary', method: 'build', glass: 'gl-highball', accent: '#FF3DBE',
    tags: ['savoury', 'brunch'],
    ing: [
      ['sp-vodka', 2, 'oz', 'base'],
      ['mx-tomato', 4, 'oz', 'mixer'],
      ['mx-lemon-juice', 0.5, 'oz', 'mixer'],
      ['fl-worcestershire', 3, 'dash', 'modifier'],
      ['fl-hot-sauce', 3, 'dash', 'modifier'],
      ['fl-pepper', null, 'piece', 'modifier'],
      ['gn-celery', null, 'piece', 'garnish'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Roll the drink between two tins rather than shaking — shaking makes it frothy and thin.', 'Pour over fresh ice.', 'Season aggressively; tomato swallows salt.'],
    garnish: 'Celery stalk and a lemon wedge',
  },
  {
    name: 'Mai Tai', method: 'shake', glass: 'gl-rocks', accent: '#C6FF3D',
    tags: ['tropical', 'party'],
    ing: [
      ['sp-rum-white', 1, 'oz', 'base'],
      ['sp-rum-dark', 1, 'oz', 'base'],
      ['sw-orgeat', 0.5, 'oz', 'sweetener'],
      ['lq-triple-sec', 0.5, 'oz', 'modifier'],
      ['mx-lime-juice', 1, 'oz', 'mixer'],
      ['ic-crushed', null, 'piece', 'ice'],
    ],
    steps: ['Shake everything with ice.', 'Pour unstrained into the glass and top with crushed ice.'],
    garnish: 'Mint sprig and a spent lime shell',
  },
  {
    name: 'Manhattan', method: 'stir', glass: 'gl-coupe', accent: '#A855F7',
    tags: ['spirit-forward', 'nightcap', 'classic'],
    ing: [
      ['sp-rye', 2, 'oz', 'base'],
      ['lq-vermouth-sweet', 1, 'oz', 'modifier'],
      ['fl-angostura', 2, 'dash', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Stir with ice for 30 seconds.', 'Strain into a chilled coupe.'],
    garnish: 'Cocktail cherry',
  },
  {
    name: 'Dry Martini', method: 'stir', glass: 'gl-martini', accent: '#33E6FF',
    tags: ['spirit-forward', 'classic'],
    ing: [
      ['sp-gin', 2.5, 'oz', 'base'],
      ['lq-vermouth-dry', 0.5, 'oz', 'modifier'],
      ['fl-orange-bitters', 1, 'dash', 'modifier', true],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Stir with plenty of ice for 30 seconds — never shake.', 'Strain into a glass you froze beforehand.'],
    garnish: 'Olives or a lemon twist',
  },
  {
    name: 'Tom Collins', method: 'build', glass: 'gl-collins', accent: '#C6FF3D',
    tags: ['refreshing', 'citrus', 'summer'],
    ing: [
      ['sp-gin', 2, 'oz', 'base'],
      ['mx-lemon-juice', 1, 'oz', 'mixer'],
      ['sw-simple', 0.5, 'oz', 'sweetener'],
      ['mx-soda', 2, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake gin, lemon and syrup with ice.', 'Strain into an ice-filled collins glass and top with soda.'],
    garnish: 'Lemon wheel and a cherry',
  },
  {
    name: 'Mimosa', method: 'build', glass: 'gl-flute', accent: '#FFB43D',
    tags: ['brunch', 'easy', 'low-abv'],
    ing: [
      ['wn-prosecco', 3, 'oz', 'base'],
      ['mx-oj', 3, 'oz', 'mixer'],
    ],
    steps: ['Prosecco first, juice second — pouring the other way flattens it.'],
    garnish: 'Orange twist',
  },
  {
    name: 'French 75', method: 'shake', glass: 'gl-flute', accent: '#33E6FF',
    tags: ['citrus', 'party', 'classic'],
    ing: [
      ['sp-gin', 1, 'oz', 'base'],
      ['mx-lemon-juice', 0.5, 'oz', 'mixer'],
      ['sw-simple', 0.5, 'oz', 'sweetener'],
      ['wn-champagne', 3, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake gin, lemon and syrup with ice.', 'Strain into a flute and top with champagne.'],
    garnish: 'Lemon twist',
  },
  {
    name: 'Caipirinha', method: 'muddle', glass: 'gl-rocks', accent: '#C6FF3D',
    tags: ['refreshing', 'citrus'],
    ing: [
      ['sp-cachaca', 2, 'oz', 'base'],
      ['gn-lime', 1, 'piece', 'mixer'],
      ['sw-sugar', 2, 'tsp', 'sweetener'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Quarter the lime and muddle it with the sugar right in the glass.', 'Add cachaça and fill with ice.', 'Stir until the glass frosts.'],
  },
  {
    name: 'Amaretto Sour', method: 'shake', glass: 'gl-rocks', accent: '#FFB43D',
    tags: ['citrus', 'rich'],
    ing: [
      ['lq-amaretto', 1.5, 'oz', 'base'],
      ['sp-bourbon', 0.75, 'oz', 'modifier'],
      ['mx-lemon-juice', 0.75, 'oz', 'mixer'],
      ['sw-simple', 0.25, 'oz', 'sweetener', true],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake hard with ice.', 'Strain over a large cube.'],
    garnish: 'Lemon peel and a cherry',
  },
  {
    name: 'Gin Basil Smash', method: 'muddle', glass: 'gl-rocks', accent: '#C6FF3D',
    tags: ['refreshing', 'herbal', 'summer'],
    ing: [
      ['sp-gin', 2, 'oz', 'base'],
      ['mx-lemon-juice', 0.75, 'oz', 'mixer'],
      ['sw-simple', 0.75, 'oz', 'sweetener'],
      ['fl-basil', 8, 'piece', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Muddle the basil with the syrup.', 'Add gin and lemon, shake hard.', 'Double-strain over fresh ice.'],
    garnish: 'Basil top',
  },
  {
    name: 'Cucumber Gimlet', method: 'shake', glass: 'gl-coupe', accent: '#33E6FF',
    tags: ['refreshing', 'summer', 'herbal'],
    ing: [
      ['sp-gin', 2, 'oz', 'base'],
      ['mx-lime-juice', 0.75, 'oz', 'mixer'],
      ['sw-simple', 0.5, 'oz', 'sweetener'],
      ['fl-cucumber', 4, 'piece', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Muddle the cucumber gently.', 'Shake with everything else and double-strain.'],
    garnish: 'Cucumber ribbon',
  },

  // ── Zero proof ─────────────────────────────────────────────────────────
  {
    name: 'Tropical Sunset Punch', method: 'build', glass: 'gl-hurricane', accent: '#FFB43D',
    tags: ['tropical', 'party', 'zero-proof'],
    ing: [
      ['mx-pineapple', 2, 'oz', 'base'],
      ['mx-oj', 2, 'oz', 'mixer'],
      ['mx-lemonade', 2, 'oz', 'mixer'],
      ['sw-grenadine', 0.5, 'oz', 'sweetener'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Build the juices over ice and stir.', 'Pour the grenadine down the inside of the glass last — it sinks and makes the sunset.'],
    garnish: 'Orange wheel and a cherry',
  },
  {
    name: 'Virgin Mojito', method: 'muddle', glass: 'gl-collins', accent: '#C6FF3D',
    tags: ['refreshing', 'summer', 'zero-proof'],
    ing: [
      ['mx-lime-juice', 0.75, 'oz', 'base'],
      ['sw-simple', 0.5, 'oz', 'sweetener'],
      ['fl-mint', 10, 'piece', 'modifier'],
      ['mx-soda', 5, 'oz', 'mixer'],
      ['ic-crushed', null, 'piece', 'ice'],
    ],
    steps: ['Press the mint against the glass with the lime and syrup.', 'Pack with crushed ice and top with soda.'],
    garnish: 'Mint sprig',
  },
  {
    name: 'Watermelon Mint Cooler', method: 'muddle', glass: 'gl-collins', accent: '#FF3DBE',
    tags: ['refreshing', 'summer', 'zero-proof'],
    ing: [
      ['gn-watermelon', 4, 'piece', 'base'],
      ['mx-lime-juice', 0.5, 'oz', 'mixer'],
      ['sw-simple', 0.5, 'oz', 'sweetener'],
      ['fl-mint', 8, 'piece', 'modifier'],
      ['mx-soda', 3, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Muddle the watermelon and mint together.', 'Add lime and syrup, shake, then strain over ice.', 'Top with soda.'],
    garnish: 'Watermelon wedge',
  },
  {
    name: 'Shirley Temple', method: 'build', glass: 'gl-highball', accent: '#FF3DBE',
    tags: ['easy', 'party', 'zero-proof'],
    ing: [
      ['mx-lemon-lime', 6, 'oz', 'base'],
      ['sw-grenadine', 0.5, 'oz', 'sweetener'],
      ['gn-cherry', null, 'piece', 'garnish'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Soda over ice, grenadine poured slowly down the side.'],
    garnish: 'Cocktail cherry',
  },
  {
    name: 'Arnold Palmer', method: 'build', glass: 'gl-collins', accent: '#FFB43D',
    tags: ['refreshing', 'easy', 'zero-proof'],
    ing: [
      ['mx-iced-tea', 4, 'oz', 'base'],
      ['mx-lemonade', 4, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Equal parts over ice. That is the whole recipe.'],
    garnish: 'Lemon wheel',
  },
  {
    name: 'Ginger Lime Fizz', method: 'build', glass: 'gl-highball', accent: '#C6FF3D',
    tags: ['spicy', 'refreshing', 'zero-proof'],
    ing: [
      ['mx-ginger-beer', 5, 'oz', 'base'],
      ['mx-lime-juice', 0.75, 'oz', 'mixer'],
      ['sw-honey', 0.25, 'oz', 'sweetener', true],
      ['fl-mint', 5, 'piece', 'modifier', true],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Build over ice and stir once.'],
    garnish: 'Lime wheel and mint',
  },

  // ── Tiki ───────────────────────────────────────────────────────────────
  {
    name: 'Jungle Bird', method: 'shake', glass: 'gl-rocks', accent: '#FF3DBE',
    tags: ['tiki', 'bitter', 'tropical'],
    ing: [
      ['sp-rum-dark', 1.5, 'oz', 'base'],
      ['lq-campari', 0.75, 'oz', 'modifier'],
      ['mx-pineapple', 1.5, 'oz', 'mixer'],
      ['mx-lime-juice', 0.5, 'oz', 'mixer'],
      ['sw-demerara', 0.5, 'oz', 'sweetener'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake everything hard with ice.', 'Strain over fresh ice.'],
    garnish: 'Pineapple wedge',
  },
  {
    name: 'Saturn', method: 'shake', glass: 'gl-collins', accent: '#FFB43D',
    tags: ['tiki', 'tropical', 'citrus'],
    ing: [
      ['sp-gin', 1.5, 'oz', 'base'],
      ['mx-lemon-juice', 0.5, 'oz', 'mixer'],
      ['sw-passion-fruit', 0.5, 'oz', 'sweetener'],
      ['sw-orgeat', 0.25, 'oz', 'sweetener'],
      ['lq-falernum', 0.25, 'oz', 'modifier'],
      ['ic-crushed', null, 'piece', 'ice'],
    ],
    steps: ['Shake with ice.', 'Pour unstrained and top with crushed ice.'],
    garnish: 'Lemon peel and a cherry',
  },
  {
    name: 'Test Pilot', method: 'shake', glass: 'gl-collins', accent: '#C6FF3D',
    tags: ['tiki', 'tropical', 'spirit-forward'],
    ing: [
      ['sp-rum-aged', 1.5, 'oz', 'base'],
      ['sp-rum-jamaican', 0.75, 'oz', 'base'],
      ['lq-falernum', 0.5, 'oz', 'modifier'],
      ['lq-curacao-dry', 0.5, 'oz', 'modifier'],
      ['mx-lime-juice', 0.75, 'oz', 'mixer'],
      ['fl-angostura', 1, 'dash', 'modifier'],
      ['lq-absinthe', 1, 'dash', 'modifier'],
      ['ic-crushed', null, 'piece', 'ice'],
    ],
    steps: ['Shake everything with crushed ice.', 'Pour unstrained; top up with more crushed ice.'],
    garnish: 'Mint and a cherry',
  },
  {
    name: 'Royal Mai Tai', method: 'shake', glass: 'gl-rocks', accent: '#33E6FF',
    tags: ['tiki', 'tropical', 'classic'],
    ing: [
      ['sp-rum-aged', 1, 'oz', 'base'],
      ['sp-rum-jamaican', 1, 'oz', 'base'],
      ['lq-curacao-dry', 0.5, 'oz', 'modifier'],
      ['sw-orgeat', 0.5, 'oz', 'sweetener'],
      ['mx-lime-juice', 1, 'oz', 'mixer'],
      ['ic-crushed', null, 'piece', 'ice'],
    ],
    steps: ['Shake hard with ice.', 'Pour unstrained over crushed ice.'],
    garnish: 'Spent lime shell and mint',
  },

  // ── Amari & aperitivo ──────────────────────────────────────────────────
  {
    name: 'Boulevardier', method: 'stir', glass: 'gl-rocks', accent: '#FF3DBE',
    tags: ['bitter', 'spirit-forward', 'nightcap'],
    ing: [
      ['sp-bourbon', 1.5, 'oz', 'base'],
      ['lq-campari', 1, 'oz', 'modifier'],
      ['lq-vermouth-sweet', 1, 'oz', 'modifier'],
      ['ic-big-cube', null, 'piece', 'ice'],
    ],
    steps: ['Stir with ice for 30 seconds.', 'Strain over a large cube.'],
    garnish: 'Orange peel',
  },
  {
    name: 'Americano', method: 'build', glass: 'gl-highball', accent: '#FF3DBE',
    tags: ['bitter', 'low-abv', 'refreshing'],
    ing: [
      ['lq-campari', 1, 'oz', 'base'],
      ['lq-vermouth-sweet', 1, 'oz', 'modifier'],
      ['mx-soda', 3, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Build over ice and stir once.'],
    garnish: 'Orange slice',
  },
  {
    name: 'Bicicletta', method: 'build', glass: 'gl-highball', accent: '#FFB43D',
    tags: ['bitter', 'low-abv', 'brunch'],
    ing: [
      ['lq-campari', 1.5, 'oz', 'base'],
      ['wn-white', 3, 'oz', 'mixer'],
      ['mx-soda', 1, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Build over plenty of ice.', 'Wine first, then Campari, then a splash of soda.'],
    garnish: 'Lemon wheel',
  },
  {
    name: 'Toronto', method: 'stir', glass: 'gl-coupe', accent: '#A855F7',
    tags: ['bitter', 'spirit-forward', 'nightcap'],
    ing: [
      ['sp-bourbon', 2, 'oz', 'base'],
      ['lq-fernet', 0.25, 'oz', 'modifier'],
      ['sw-demerara', 0.25, 'oz', 'sweetener'],
      ['fl-angostura', 2, 'dash', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Stir with ice for 30 seconds.', 'Strain into a chilled coupe.'],
    garnish: 'Orange peel',
  },
  {
    name: 'Hanky Panky', method: 'stir', glass: 'gl-coupe', accent: '#A855F7',
    tags: ['bitter', 'spirit-forward', 'classic'],
    ing: [
      ['sp-gin', 1.5, 'oz', 'base'],
      ['lq-vermouth-sweet', 1.5, 'oz', 'modifier'],
      ['lq-fernet', 0.25, 'oz', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Stir with ice.', 'Strain into a chilled coupe.'],
    garnish: 'Orange peel',
  },
  {
    name: 'Fernet & Coke', method: 'build', glass: 'gl-highball', accent: '#C6FF3D',
    tags: ['bitter', 'easy', 'party'],
    ing: [
      ['lq-fernet', 2, 'oz', 'base'],
      ['mx-cola', 4, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Build over ice. Argentina drinks it by the litre for a reason.'],
  },
  {
    name: 'Amaro & Tonic', method: 'build', glass: 'gl-highball', accent: '#33E6FF',
    tags: ['bitter', 'low-abv', 'easy'],
    ing: [
      ['lq-amaro', 2, 'oz', 'base'],
      ['mx-tonic', 4, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Build over ice; stir once so the tonic does not flatten.'],
    garnish: 'Orange peel',
  },

  // ── Sours & classics ───────────────────────────────────────────────────
  {
    name: 'Sidecar', method: 'shake', glass: 'gl-coupe', accent: '#FFB43D',
    tags: ['citrus', 'classic', 'spirit-forward'],
    ing: [
      ['sp-cognac', 2, 'oz', 'base'],
      ['lq-cointreau', 1, 'oz', 'modifier'],
      ['mx-lemon-juice', 0.75, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake hard with ice.', 'Double-strain into a chilled coupe.'],
    garnish: 'Lemon twist',
  },
  {
    name: 'Between the Sheets', method: 'shake', glass: 'gl-coupe', accent: '#FF3DBE',
    tags: ['citrus', 'classic'],
    ing: [
      ['sp-cognac', 0.75, 'oz', 'base'],
      ['sp-rum-white', 0.75, 'oz', 'base'],
      ['lq-cointreau', 0.75, 'oz', 'modifier'],
      ['mx-lemon-juice', 0.5, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake with ice.', 'Double-strain into a chilled coupe.'],
    garnish: 'Lemon twist',
  },
  {
    name: 'White Lady', method: 'shake', glass: 'gl-coupe', accent: '#33E6FF',
    tags: ['citrus', 'classic'],
    ing: [
      ['sp-gin', 2, 'oz', 'base'],
      ['lq-cointreau', 1, 'oz', 'modifier'],
      ['mx-lemon-juice', 0.75, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake hard with ice.', 'Double-strain into a chilled coupe.'],
    garnish: 'Lemon twist',
  },
  {
    name: 'Corpse Reviver No. 2', method: 'shake', glass: 'gl-coupe', accent: '#C6FF3D',
    tags: ['citrus', 'classic', 'brunch'],
    ing: [
      ['sp-gin', 0.75, 'oz', 'base'],
      ['lq-cointreau', 0.75, 'oz', 'modifier'],
      ['lq-vermouth-dry', 0.75, 'oz', 'modifier'],
      ['mx-lemon-juice', 0.75, 'oz', 'mixer'],
      ['lq-absinthe', 1, 'dash', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Rinse the chilled glass with absinthe and discard the excess.', 'Shake the rest with ice and double-strain in.'],
    garnish: 'Lemon twist',
  },
  {
    name: 'Martinez', method: 'stir', glass: 'gl-coupe', accent: '#A855F7',
    tags: ['spirit-forward', 'classic'],
    ing: [
      ['sp-gin', 1.5, 'oz', 'base'],
      ['lq-vermouth-sweet', 1.5, 'oz', 'modifier'],
      ['lq-maraschino', 0.25, 'oz', 'modifier'],
      ['fl-orange-bitters', 2, 'dash', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Stir with ice for 30 seconds.', 'Strain into a chilled coupe.'],
    garnish: 'Lemon twist',
  },
  {
    name: 'Brooklyn', method: 'stir', glass: 'gl-coupe', accent: '#FF3DBE',
    tags: ['spirit-forward', 'bitter', 'classic'],
    ing: [
      ['sp-bourbon', 2, 'oz', 'base'],
      ['lq-vermouth-dry', 0.75, 'oz', 'modifier'],
      ['lq-maraschino', 0.25, 'oz', 'modifier'],
      ['lq-amaro', 0.25, 'oz', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Stir with ice.', 'Strain into a chilled coupe.'],
    garnish: 'Cocktail cherry',
  },
  {
    name: 'Vieux Carré', method: 'stir', glass: 'gl-rocks', accent: '#FFB43D',
    tags: ['spirit-forward', 'nightcap', 'classic'],
    ing: [
      ['sp-cognac', 1, 'oz', 'base'],
      ['sp-bourbon', 1, 'oz', 'base'],
      ['lq-vermouth-sweet', 1, 'oz', 'modifier'],
      ['lq-benedictine', 0.25, 'oz', 'modifier'],
      ['fl-angostura', 2, 'dash', 'modifier'],
      ['fl-peychauds', 2, 'dash', 'modifier'],
      ['ic-big-cube', null, 'piece', 'ice'],
    ],
    steps: ['Stir everything with ice for 30 seconds.', 'Strain over a large cube.'],
    garnish: 'Lemon peel',
  },
  {
    name: 'Sazerac', method: 'stir', glass: 'gl-rocks', accent: '#FF3DBE',
    tags: ['spirit-forward', 'nightcap', 'classic'],
    ing: [
      ['sp-bourbon', 2, 'oz', 'base'],
      ['sw-demerara', 0.25, 'oz', 'sweetener'],
      ['fl-peychauds', 4, 'dash', 'modifier'],
      ['lq-absinthe', 1, 'dash', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Rinse a chilled rocks glass with absinthe and tip out the excess.', 'Stir whiskey, syrup and Peychaud’s with ice.', 'Strain into the rinsed glass — no ice.'],
    garnish: 'Lemon peel, expressed and discarded',
  },

  // ── Rich & dessert ─────────────────────────────────────────────────────
  {
    name: 'Black Russian', method: 'build', glass: 'gl-rocks', accent: '#A855F7',
    tags: ['easy', 'nightcap'],
    ing: [
      ['sp-vodka', 2, 'oz', 'base'],
      ['lq-coffee', 1, 'oz', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Build over ice and stir.'],
  },
  {
    name: 'White Russian', method: 'build', glass: 'gl-rocks', accent: '#EAEDF6',
    tags: ['rich', 'nightcap', 'easy'],
    ing: [
      ['sp-vodka', 2, 'oz', 'base'],
      ['lq-coffee', 1, 'oz', 'modifier'],
      ['mx-half-and-half', 1, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Build vodka and coffee liqueur over ice.', 'Float the cream on top and let the drinker stir it in.'],
  },
  {
    name: 'Brandy Alexander', method: 'shake', glass: 'gl-coupe', accent: '#FFB43D',
    tags: ['rich', 'nightcap'],
    ing: [
      ['sp-cognac', 1.5, 'oz', 'base'],
      ['lq-choc', 1, 'oz', 'modifier'],
      ['mx-half-and-half', 1, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake hard with ice — it needs the aeration.', 'Double-strain into a chilled coupe.'],
    garnish: 'Grated nutmeg',
  },
  {
    name: 'Stout Nightcap', method: 'build', glass: 'gl-highball', accent: '#A855F7',
    tags: ['rich', 'nightcap'],
    ing: [
      ['br-stout', 4, 'oz', 'base'],
      ['lq-coffee', 1, 'oz', 'modifier'],
      ['sp-rum-aged', 0.5, 'oz', 'modifier'],
    ],
    steps: ['Pour the stout first and let the head settle.', 'Add the liqueur and rum down a bar spoon so it layers.'],
  },

  // ── Long & easy ────────────────────────────────────────────────────────
  {
    name: 'Lychee Gimlet', method: 'shake', glass: 'gl-coupe', accent: '#FF3DBE',
    tags: ['refreshing', 'citrus', 'summer'],
    ing: [
      ['sp-gin', 2, 'oz', 'base'],
      ['mx-lime-juice', 0.75, 'oz', 'mixer'],
      ['sw-lychee', 0.75, 'oz', 'sweetener'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake hard with ice.', 'Double-strain into a chilled coupe.'],
    garnish: 'Lime wheel',
  },
  {
    name: 'Madeira Cobbler', method: 'build', glass: 'gl-rocks', accent: '#FFB43D',
    tags: ['low-abv', 'refreshing', 'brunch'],
    ing: [
      ['wn-madeira', 3, 'oz', 'base'],
      ['lq-curacao-dry', 0.5, 'oz', 'modifier'],
      ['sw-simple', 0.25, 'oz', 'sweetener'],
      ['ic-crushed', null, 'piece', 'ice'],
    ],
    steps: ['Build over crushed ice and swizzle until the glass frosts.'],
    garnish: 'Whatever fruit is in the house',
  },
  {
    name: 'Michelada', method: 'build', glass: 'gl-collins', accent: '#FF3DBE',
    tags: ['savoury', 'brunch', 'refreshing'],
    ing: [
      ['br-pumpkin-ale', 8, 'oz', 'base'],
      ['mx-tomato', 2, 'oz', 'mixer'],
      ['mx-lime-juice', 0.5, 'oz', 'mixer'],
      ['fl-salt', null, 'piece', 'modifier'],
      ['fl-pepper', null, 'piece', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Salt the rim.', 'Tomato, lime and seasoning over ice, then top with beer.'],
    garnish: 'Lime wedge',
  },
  {
    name: 'Autumn Highball', method: 'build', glass: 'gl-highball', accent: '#FFB43D',
    tags: ['easy', 'party'],
    ing: [
      ['lq-spiced-cider', 1.5, 'oz', 'base'],
      ['br-pumpkin-ale', 4, 'oz', 'mixer'],
      ['fl-tiki-bitters', 2, 'dash', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Build over ice; the ale is already spiced, so go easy on the bitters.'],
    garnish: 'Apple slice',
  },
];

function expand(ing: Ing): RecipeIngredient {
  const [id, amount, unit, role] = ing;
  const optional = ing.length > 4 ? Boolean(ing[4]) : false;
  const cat = CATALOG_BY_ID[id];
  return {
    catalogItemId: id,
    displayName: cat ? cat.name : id,
    amount,
    unit,
    role,
    isOptional: optional,
  };
}

function toRecipe(s: Seed, id: string): DrinkRecipe {
  const ingredients = s.ing.map(expand);
  const isZeroProof = ingredients.every((ri) => {
    const cat = ri.catalogItemId ? CATALOG_BY_ID[ri.catalogItemId] : null;
    return !cat || cat.typicalAbv === 0;
  });
  return {
    id,
    name: s.name,
    origin: 'seed',
    method: s.method,
    glass: s.glass,
    ingredients,
    steps: s.steps,
    garnish: s.garnish ?? null,
    vibeTags: s.tags,
    accent: s.accent,
    isZeroProof,
    timesMade: 0,
    lastMadeAt: null,
    isFavorite: false,
    rating: null,
    sourceUrl: null,
    sourceNote: s.source ?? null,
    theme: s.theme ?? null,
    createdAt: Date.now(),
  };
}

/**
 * Id prefixes are stable per collection, so adding a recipe to one list never
 * renumbers another — which matters because loadRecipes merges by id.
 */
export const SEED_RECIPES: DrinkRecipe[] = [
  ...seeds.map((s, i) => toRecipe(s, `seed-${i + 1}`)),
  ...BOOK_SEEDS.map((s, i) => toRecipe(s, `book-${i + 1}`)),
  ...THEMED_SEEDS.map((s, i) => toRecipe(s, `theme-${i + 1}`)),
];

/** Every distinct vibe tag in the library, for the Shaker filter rail. */
export const VIBE_TAGS = Array.from(new Set(SEED_RECIPES.flatMap((r) => r.vibeTags)))
  .filter((t) => t !== 'zero-proof')
  .sort();
