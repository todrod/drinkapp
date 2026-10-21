import { CATALOG } from '../data/catalog';
import { inCollection, type Collection } from '../data/curation';
import { THEMES } from '../data/seed';
import type { DrinkRecipe } from '../types';
import { containsPhrase, normalizeText } from './text';
import { isAlcoholFree } from './recipes';

interface Concept {
  key: string; label: string; aliases: string[];
  ingredients?: string[]; tags?: string[]; theme?: string; collection?: Collection;
  names?: string[]; zeroProof?: boolean; easy?: boolean; favorite?: boolean; raw?: string;
}
interface Group { concepts: Concept[]; label: string }
export interface DrinkIntent {
  include: Group[]; exclude: Group[]; unknown: string[]; suggestions: string[];
  excludedIngredientIds: Set<string>;
}
export interface IdeaMatch { recipe: DrinkRecipe; score: number; matched: string[]; missing: string[] }
export interface DiscoveryResult { intent: DrinkIntent; matches: IdeaMatch[]; closest: IdeaMatch[] }

/** Preserve requested ingredients/flavors, while allowing substitutes inside an explicit OR group. */
export function ideaAllowsSubstitution(intent: DrinkIntent, wantedId: string, usedId: string): boolean {
  return intent.include.every((group) => {
    const ingredientIds = group.concepts.flatMap((c) => c.ingredients ?? []);
    return !ingredientIds.includes(wantedId) || ingredientIds.includes(usedId);
  });
}
const idsForSpirit = (spirit: string) => CATALOG.filter((c) => c.spiritType === spirit).map((c) => c.id);
const concept = (key: string, aliases: string[], tags: string[] = [key], ingredients?: string[]): Concept =>
  ({ key, label: aliases[0], aliases, tags, ingredients });
const CONCEPTS: Concept[] = [
  ...['gin', 'vodka', 'rum', 'tequila', 'mezcal', 'whiskey', 'brandy'].map((spirit) => ({
    key: spirit, label: spirit, aliases: spirit === 'whiskey' ? ['whiskey', 'whisky'] : [spirit],
    ingredients: [...idsForSpirit(spirit), ...(spirit === 'gin' ? ['lq-sloe-gin'] : [])],
  })),
  { key: 'zero-proof', label: 'alcohol-free', aliases: ['alcohol free', 'non alcoholic', 'nonalcoholic', 'zero proof', 'mocktail', 'mocktails', 'no alcohol', 'without alcohol', 'no booze', 'without booze', 'virgin', 'booze free', 'sober'], zeroProof: true },
  concept('refreshing', ['refreshing', 'refresh', 'crisp', 'cooling', 'thirst quenching', 'light and fresh', 'light', 'fresh']),
  concept('low-abv', ['low abv', 'low alcohol', 'lower alcohol', 'low proof'], ['low-abv']),
  { key: 'favorite', label: 'my favorites', aliases: ['my favorites', 'my favourites', 'favorites', 'favourites'], favorite: true },
  concept('tropical', ['tropical', 'tiki', 'vacation', 'island', 'caribbean', 'beachy'], ['tropical', 'tiki']),
  concept('citrus', ['citrus', 'citrusy', 'zesty', 'bright', 'tangy', 'tart', 'sour'], ['citrus', 'tart']),
  concept('fruity', ['fruity', 'fruit', 'juicy'], ['fruity', 'tropical', 'berry', 'peach']),
  concept('berry', ['berry', 'berries', 'berry flavored'], ['berry'], ['mx-cranberry', 'lq-blackberry', 'lq-raspberry', 'lq-cassis', 'sw-raspberry', 'mx-strawberry-puree', 'gn-strawberry']),
  concept('spicy', ['spicy', 'spice', 'spiced', 'hot', 'heat', 'fiery'], ['spicy', 'spiced'], ['fl-jalapeno', 'fl-hot-sauce', 'fl-ginger', 'mx-ginger-beer']),
  concept('smoky', ['smoky', 'smokey', 'smoke', 'peaty', 'peat'], ['smoky'], ['sp-mezcal', 'sp-scotch-peated']),
  concept('herbal', ['herbal', 'herby', 'herbs', 'botanical', 'garden fresh'], ['herbal'], ['fl-mint', 'fl-basil', 'lq-chartreuse-green', 'lq-chartreuse-yellow']),
  concept('floral', ['floral', 'flowery', 'flowers', 'elderflower'], ['floral'], ['lq-elderflower', 'lq-italicus', 'fl-lavender-bitters']),
  concept('bitter', ['bitter', 'bittersweet', 'aperitivo', 'aperitif'], ['bitter', 'bittersweet', 'aperitif'], ['lq-campari', 'lq-aperol', 'lq-amaro', 'lq-fernet', 'lq-nonino']),
  concept('sweet', ['sweet', 'sugary', 'candy'], ['sweet', 'dessert']),
  concept('dry', ['dry', 'less sweet', 'not too sweet', 'not very sweet', 'not sweet'], ['dry', 'spirit-forward', 'bitter', 'citrus', 'tart']),
  concept('spirit-forward', ['spirit forward', 'boozy', 'bold', 'strong', 'sipping'], ['spirit-forward']),
  concept('creamy', ['creamy', 'cream', 'rich', 'velvety', 'silky'], ['creamy', 'silky', 'rich'], ['mx-cream', 'mx-half-and-half', 'mx-coconut-cream', 'lq-irish-cream', 'lq-tiramisu']),
  concept('dessert', ['dessert', 'sweet treat', 'after dinner', 'decadent'], ['dessert']),
  concept('coffee', ['coffee', 'espresso', 'caffeinated', 'cafe', 'mocha'], ['coffee'], ['mx-espresso', 'mx-cold-brew', 'lq-coffee', 'lq-tiramisu']),
  concept('chocolate', ['chocolate', 'chocolaty', 'chocolatey', 'cocoa'], ['chocolate'], ['lq-choc', 'lq-cacao-white', 'fl-chocolate-bitters']),
  concept('coconut', ['coconut', 'coco'], ['coconut'], ['mx-coconut-cream']),
  concept('mint', ['mint', 'minty', 'peppermint'], ['mint'], ['fl-mint', 'lq-peppermint', 'lq-menthe-green']),
  concept('ginger', ['ginger', 'gingery'], [], ['fl-ginger', 'mx-ginger-beer', 'mx-ginger-ale']),
  concept('scotch', ['scotch'], [], ['sp-scotch', 'sp-scotch-peated']),
  concept('lime', ['lime', 'limey'], [], ['mx-lime-juice', 'gn-lime']),
  concept('lemon', ['lemon', 'lemony'], [], ['mx-lemon-juice', 'gn-lemon', 'mx-lemonade', 'lq-limoncello']),
  concept('orange', ['orange', 'orangey'], [], ['mx-oj', 'gn-orange', 'lq-triple-sec', 'lq-cointreau', 'lq-curacao-dry', 'lq-blood-orange']),
  concept('pineapple', ['pineapple'], [], ['mx-pineapple', 'gn-pineapple']),
  concept('strawberry', ['strawberry', 'strawberries'], [], ['gn-strawberry', 'mx-strawberry-puree']),
  concept('dairy', ['dairy', 'milk'], [], ['mx-milk', 'mx-cream', 'mx-half-and-half', 'mx-creamer', 'lq-irish-cream', 'lq-tiramisu']),
  concept('egg', ['egg', 'eggs', 'egg white'], [], ['mx-egg-white']),
  concept('nutty', ['nutty', 'nuts', 'nut', 'almond', 'peanut'], ['nutty'], ['sw-orgeat', 'lq-amaretto', 'sp-pb-whiskey', 'lq-hazelnut']),
  concept('tea', ['tea', 'black tea', 'iced tea'], ['tea'], ['mx-iced-tea', 'mx-black-tea']),
  concept('caramel', ['caramel', 'butterscotch', 'toffee'], ['caramel'], ['sp-caramel-whisky', 'lq-caramel', 'lq-butterscotch']),
  concept('lychee', ['lychee', 'litchi'], ['lychee'], ['sw-lychee']),
  concept('passion-fruit', ['passion fruit', 'passionfruit'], ['passion-fruit'], ['sw-passion-fruit', 'mx-passion-puree', 'lq-passion-fruit']),
  concept('apple', ['apple', 'orchard', 'cider'], ['apple'], ['sp-apple-brandy', 'lq-spiced-cider']),
  concept('bubbly', ['bubbly', 'bubbles', 'sparkling', 'fizzy', 'fizz', 'spritz'], ['bubbly'], ['mx-soda', 'wn-prosecco', 'wn-champagne', 'mx-tonic', 'mx-ginger-ale', 'mx-ginger-beer']),
  concept('brunch', ['brunch', 'breakfast', 'sunday morning'], ['brunch']),
  concept('cozy', ['cozy', 'cosy', 'comforting', 'rainy day', 'rainy night', 'rainy', 'fireside', 'winter', 'fall'], ['cozy', 'nightcap', 'autumn', 'holiday']),
  concept('nightcap', ['nightcap', 'late night', 'evening', 'relaxing', 'relax', 'unwind'], ['nightcap', 'spirit-forward']),
  concept('celebration', ['celebration', 'celebrate', 'birthday', 'wedding', 'toast', 'festive'], ['celebration', 'bubbly', 'brunch']),
  concept('romantic', ['romantic', 'date night', 'valentine', 'valentines'], ['berry', 'floral', 'bubbly', 'silky']),
  concept('summer', ['summer', 'sunny', 'poolside', 'bbq', 'barbecue', 'picnic'], ['summer', 'tropical', 'refreshing']),
  { key: 'easy', label: 'easy', aliases: ['easy', 'simple', 'quick', 'beginner', 'two ingredient', 'three ingredient'], easy: true },
  ...(['classic', 'specialty', 'trending', 'highly-rated', 'all-time', 'themed'] as Collection[]).map((collection): Concept => ({
    key: collection, label: collection === 'highly-rated' ? 'highly rated' : collection === 'all-time' ? 'all-time favorites' : collection,
    aliases: collection === 'highly-rated' ? ['highly rated', 'top rated', 'best rated', 'critics picks'] :
      collection === 'all-time' ? ['all time favorites', 'all time favourites', 'crowd pleaser', 'crowd pleasers', 'popular favorites'] :
      collection === 'trending' ? ['trending', 'top trending', 'popular', '2026', 'trend', 'trends'] :
      collection === 'themed' ? ['theme', 'themed', 'fantasy'] : [collection, collection + 's'], collection,
  })),
  { key: 'holiday', label: 'holiday', aliases: ['holiday', 'christmas', 'xmas', 'noel', 'winter holiday', 'thanksgiving', 'new year', 'new years'], theme: 'holiday' },
  { key: 'garden', label: 'garden party', aliases: ['garden', 'garden party', 'spring'], theme: 'garden' },
  { key: 'beach', label: 'beach escape', aliases: ['beach', 'beach escape', 'beach holiday', 'beach vacation'], theme: 'beach', tags: ['tropical'] },
  { key: 'spooky', label: 'spooky', aliases: ['spooky', 'halloween', 'scary', 'haunted', 'gothic', 'witch', 'witchy'], theme: 'spooky' },
  { key: 'galaxy', label: 'galaxy', aliases: ['galaxy', 'space', 'star wars', 'sci fi', 'scifi', 'cosmic', 'alien'], theme: 'galaxy' },
  { key: 'middle-earth', label: 'Middle-earth', aliases: ['middle earth', 'lord of the rings', 'lotr', 'hobbit', 'elvish', 'tolkien'], theme: 'middle-earth' },
  { key: 'fairytale', label: 'fairytale', aliases: ['fairytale', 'fairy tale', 'wizard', 'magical', 'enchanted', 'princess'], theme: 'fairytale' },
  ...CATALOG.filter((c) => !['glass', 'tool', 'ice', 'extra'].includes(c.kind)).map((c): Concept => ({
    key: c.id, label: c.name.toLowerCase(), aliases: [c.name], ingredients: [c.id],
  })),
];
const STOP_WORDS = new Set('a an the i im id ill am feel feeling want would like love me my please something anything drink drinks cocktail cocktails make made give find with using based for thats that is its to of on in some little really very tonight today and or but just you your can could do have it idea mood vibe vibes surprise too more any nice good tasty delicious inspired'.split(' '));
const NEGATION = new Set(['no', 'not', 'without', 'avoid', 'exclude', 'excluding', 'minus', 'hold']);

function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0; let j = 0; let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length >= b.length) i++;
    if (b.length >= a.length) j++;
  }
  return edits + (i < a.length || j < b.length ? 1 : 0) <= 1;
}

export function parseDrinkIdea(query: string, recipes: DrinkRecipe[]): DrinkIntent {
  const dictionary = new Map<string, Concept>();
  // Explicit aliases win over catalog names ("cream" is a texture, "heavy cream" an ingredient).
  for (const c of CONCEPTS) for (const alias of c.aliases) {
    const key = normalizeText(alias);
    if (!dictionary.has(key)) dictionary.set(key, c);
  }
  for (const r of recipes) {
    const name = normalizeText(r.name);
    const existing = dictionary.get(name);
    // A user's recipe named "Tropical" must not replace the tropical vocabulary.
    dictionary.set(name, existing ? { ...existing, names: [...(existing.names ?? []), name] } :
      { key: `name:${name}`, label: r.name, aliases: [name], names: [name] });
  }
  for (const t of THEMES) if (!dictionary.has(normalizeText(t.label))) {
    dictionary.set(normalizeText(t.label), { key: t.id, label: t.label, aliases: [t.label], theme: t.id });
  }
  const words = normalizeText(query.slice(0, 240)).replace(/\b(?:not (?:too |very )?sweet|less sweet)\b/g, 'dry without sweet').split(' ').filter(Boolean);
  const intent: DrinkIntent = { include: [], exclude: [], unknown: [], suggestions: [], excludedIngredientIds: new Set() };
  const maxPhrase = Math.max(...[...dictionary.keys()].map((s) => s.split(' ').length));
  let negative = false; let previousNegative = false; let joinOr = false;
  for (let i = 0; i < words.length;) {
    // Match "no alcohol" before interpreting "no" as a generic exclusion.
    let found: Concept | undefined; let consumed = 0;
    for (let size = Math.min(maxPhrase, words.length - i); size > 0; size--) {
      const value = dictionary.get(words.slice(i, i + size).join(' '));
      if (value) { found = value; consumed = size; break; }
    }
    if (!found && NEGATION.has(words[i])) { negative = true; i++; continue; }
    if (!found && ['and', 'or'].includes(words[i])) {
      joinOr = words[i] === 'or' && !previousNegative;
      negative = previousNegative;
      i++; continue;
    }
    if (!found && ['with', 'but'].includes(words[i])) { negative = false; previousNegative = false; joinOr = false; i++; continue; }
    if (!found && STOP_WORDS.has(words[i])) { i++; continue; }
    if (!found) {
      const raw = words[i];
      found = { key: `word:${raw}`, label: raw, aliases: [raw], raw };
      intent.unknown.push(raw);
      if (raw.length >= 5) {
        const suggestion = [...dictionary.keys()].find((alias) => !alias.includes(' ') && withinOneEdit(raw, alias));
        if (suggestion && !intent.suggestions.includes(suggestion)) intent.suggestions.push(suggestion);
      }
      consumed = 1;
    }
    const target = negative ? intent.exclude : intent.include;
    if (!negative && joinOr && target.length) {
      const group = target[target.length - 1];
      group.concepts.push(found);
      group.label += ` or ${found.label}`;
    } else if (!target.some((g) => g.concepts.some((c) => c.key === found!.key))) {
      target.push({ concepts: [found], label: found.label });
    }
    if (negative) for (const id of found.ingredients ?? []) intent.excludedIngredientIds.add(id);
    previousNegative = negative; negative = false; joinOr = false; i += consumed;
  }
  return intent;
}

function matchesConcept(r: DrinkRecipe, c: Concept): boolean {
  if (c.favorite) return r.isFavorite;
  if (c.zeroProof) return isAlcoholFree(r);
  if (c.collection) return inCollection(r, c.collection);
  if (c.easy) return r.ingredients.filter((i) => !i.isOptional && ['base', 'modifier', 'mixer', 'sweetener'].includes(i.role)).length <= 3;
  if (c.names?.includes(normalizeText(r.name))) return true;
  if (c.theme && r.theme === c.theme) return true;
  if (c.tags?.some((tag) => r.vibeTags.includes(tag))) return true;
  if (c.ingredients && r.ingredients.some((i) => i.catalogItemId && c.ingredients!.includes(i.catalogItemId))) return true;
  if (c.raw) {
    const text = normalizeText([r.name, ...r.vibeTags, ...r.ingredients.map((i) => i.displayName),
      r.theme ? THEMES.find((t) => t.id === r.theme)?.label : ''].join(' '));
    return containsPhrase(text, c.raw) || (c.raw.length >= 3 && text.split(' ').some((word) => word.startsWith(c.raw!)));
  }
  return false;
}

/** Pure local pipeline: normalize → phrases/aliases → constraints → intersection → relevance. */
export function discoverDrinks(recipes: DrinkRecipe[], query: string): DiscoveryResult {
  const intent = parseDrinkIdea(query, recipes);
  const matches: IdeaMatch[] = []; const closest: IdeaMatch[] = [];
  for (const recipe of recipes) {
    if (intent.exclude.some((group) => group.concepts.some((c) => matchesConcept(recipe, c)))) continue;
    // Even the explicitly labelled alternatives must honor an alcohol-free request.
    if (intent.include.some((g) => g.concepts.every((c) => c.zeroProof)) && !isAlcoholFree(recipe)) continue;
    const matched: string[] = []; const missing: string[] = [];
    let score = 0;
    for (const group of intent.include) {
      const hits = group.concepts.filter((c) => matchesConcept(recipe, c));
      if (hits.length) {
        matched.push(group.label);
        score += hits.some((c) => c.names) ? 100 : hits.some((c) => c.ingredients) ? 25 : 15;
      } else missing.push(group.label);
    }
    const entry = { recipe, score, matched, missing };
    if (!missing.length) matches.push(entry);
    else if (matched.length) closest.push(entry);
  }
  const sort = (a: IdeaMatch, b: IdeaMatch) => b.score - a.score || a.recipe.name.localeCompare(b.recipe.name);
  matches.sort(sort); closest.sort((a, b) => a.missing.length - b.missing.length || sort(a, b));
  // A partial word that actually matched a name/ingredient is understood, not an unknown term.
  intent.unknown = intent.unknown.filter((word) => !recipes.some((r) => matchesConcept(r, { key: word, label: word, aliases: [], raw: word })));
  return { intent, matches, closest: closest.slice(0, 3) };
}
