import React, { useMemo, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F, R, S, SCREEN, SHADOW } from '../theme';
import { accentForRecipe } from '../data/liquids';
import {
  Body,
  Chip,
  Dim,
  EmptyState,
  GhostButton,
  HaveCount,
  Heading,
  Label,
  Panel,
  PrimaryButton,
  Press,
  Stars,
  Title,
  Wordmark,
} from '../components/ui';
import { useData } from '../store';
import { CATALOG } from '../data/catalog';
import { DrinkRecipe, Method, RecipeIngredient, Unit } from '../types';
import { THEMES, THEME_BY_ID } from '../data/seed';
import { buildOwned, matchRecipe } from '../logic/generator';
import { formatIngredient, pluralize } from '../format';
import { ACCENTS } from '../theme';
import { Icon } from '../icons';
import { CocktailArt } from '../components/CocktailArt';
import { IngredientArt } from '../components/IngredientArt';
import { artForCatalog } from '../data/art';
import { CURATION_DATE, inCollection, RATING_SOURCE, TREND_SOURCE, trendingRank } from '../data/curation';
import { discoverDrinks, ideaAllowsSubstitution, type DrinkIntent } from '../logic/discovery';
import { RecipeSources } from '../components/RecipeSources';

type Filter = 'on-hand' | 'classic' | 'books' | 'themed' | 'mine' | 'trending' | 'highly-rated' | 'all-time' | 'specialty' | 'zero-proof' | 'favorite';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'on-hand', label: 'Can make now' },
  { key: 'trending', label: 'Trending 2026' },
  { key: 'highly-rated', label: 'Highly rated' },
  { key: 'classic', label: 'Classics' },
  { key: 'all-time', label: 'All-time favorites' },
  { key: 'themed', label: 'Themes' },
  { key: 'specialty', label: 'Specialty' },
  { key: 'zero-proof', label: 'Alcohol-free' },
  { key: 'books', label: 'From the books' },
  { key: 'favorite', label: 'My favorites' },
  { key: 'mine', label: 'My recipes' },
];

export function RecipesScreen() {
  const { recipes, kit, prefs, saveRecipe, removeRecipe, markMade, toggleFavorite, rateRecipe } =
    useData();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter | null>(null);
  const [onlyReady, setOnlyReady] = useState(false);
  const [theme, setTheme] = useState<string | null>(null);
  const [detail, setDetail] = useState<DrinkRecipe | null>(null);
  const [editing, setEditing] = useState<DrinkRecipe | null>(null);

  const owned = useMemo(() => buildOwned(kit), [kit]);
  const { width } = useWindowDimensions();
  const columns = width >= 1000 ? 4 : width >= 700 ? 3 : 2;
  const cardWidth = (Math.min(width, 1120) - 48 - 12 * (columns - 1)) / columns;
  const currentDetail = detail ? recipes.find((recipe) => recipe.id === detail.id) ?? detail : null;
  const discovery = useMemo(() => discoverDrinks(recipes, query), [recipes, query]);

  const visible = useMemo(() => {
    const candidates = query.trim() ? discovery.matches.map((m) => m.recipe) : recipes;
    const filtered = candidates.filter((r) => {
      if (onlyReady && !matchRecipe(r, owned, prefs.allowSubstitutes, discovery.intent.excludedIngredientIds,
        (wanted, used) => ideaAllowsSubstitution(discovery.intent, wanted, used)).ok) return false;
      if (theme && r.theme !== theme) return false;
      switch (filter) {
        case 'trending': case 'highly-rated': case 'all-time': case 'classic': case 'specialty': case 'zero-proof':
          return inCollection(r, filter);
        case 'books':
          return r.id.startsWith('book-');
        case 'themed':
          return !!r.theme;
        case 'mine':
          return r.origin === 'user';
        case 'favorite':
          return r.isFavorite;
        default:
          return true;
      }
    });
    if (filter === 'trending') filtered.sort((a, b) => trendingRank(a) - trendingRank(b));
    return filtered;
  }, [recipes, query, discovery, filter, theme, onlyReady, owned, prefs.allowSubstitutes]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={styles.topBar}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.eyebrow}>FIND YOUR NEW FAVORITE</Text>
            <Wordmark>The recipe book</Wordmark>
            <Dim>A classic for every occasion. A twist for every mood.</Dim>
          </View>
          <Pressable
            onPress={() => setEditing(blankRecipe())}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="New recipe"
            style={styles.newButton}
          >
            <Icon name="plus" size={24} color={C.teal} />
          </Pressable>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Name, flavor, ingredient or theme"
          placeholderTextColor={C.faint}
          style={styles.search}
          accessibilityLabel="Search recipes"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rail}>
          <View style={styles.railRow}>
            {FILTERS.map((f) => (
              <Chip
                key={f.key}
                label={f.label}
                active={f.key === 'on-hand' ? onlyReady : filter === f.key}
                onPress={() => {
                  if (f.key === 'on-hand') { setOnlyReady((value) => !value); return; }
                  setFilter(filter === f.key ? null : f.key);
                  if (f.key !== 'themed') setTheme(null);
                }}
                small
              />
            ))}
          </View>
        </ScrollView>

        {filter === 'trending' || filter === 'highly-rated' ? <View style={{ gap: 4, marginTop: 12 }}>
          <Dim>{filter === 'trending' ? 'Bacardi’s forecasted top bar calls for 2026; Aperol represents the spritz family.' : 'Cocktail families featured on the first page of Difford’s rating-sorted finder. Recipes may vary; stars are your own ratings.'}</Dim>
          <Pressable accessibilityRole="link" accessibilityLabel="Open collection research source"
            onPress={() => { Linking.openURL(filter === 'trending' ? TREND_SOURCE : RATING_SOURCE).catch(() => {}); }}
            style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ color: C.accent, fontFamily: F.regular, fontSize: 12 }}>Source · checked {CURATION_DATE} · saved selection</Text>
          </Pressable>
        </View> : filter === 'all-time' ? <Dim style={{ marginTop: 12 }}>Familiar favorites, selected for this library. Save your own picks under My favorites.</Dim> : null}

        {query.trim() ? <Dim style={{ marginTop: 12 }} accessibilityLiveRegion="polite">
          {[...discovery.intent.include.map((g) => g.label), ...discovery.intent.exclude.map((g) => `without ${g.label}`)].join(' · ')}
          {discovery.intent.unknown.length ? ` · Not recognized: ${discovery.intent.unknown.join(', ')}` : ''}
        </Dim> : null}

        {filter === 'themed' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rail}>
            <View style={styles.railRow}>
              {THEMES.map((t) => (
                <Chip
                  key={t.id}
                  label={t.label}
                  active={theme === t.id}
                  color={t.accent}
                  onPress={() => setTheme(theme === t.id ? null : t.id)}
                  small
                />
              ))}
            </View>
          </ScrollView>
        ) : null}

        <Dim style={{ marginTop: S.md }}>
          {visible.length} {pluralize(visible.length, 'recipe')}
        </Dim>

        {visible.length === 0 ? (
          <EmptyState
            icon="book-open-variant"
            title="Nothing matches"
            body="Try clearing the filters, or write the drink down yourself."
            action={<View style={{ gap: S.sm }}>
              <PrimaryButton label="CLEAR SEARCH AND FILTERS" onPress={() => { setQuery(''); setFilter(null); setTheme(null); setOnlyReady(false); }} />
              <GhostButton label="Write my own recipe" onPress={() => setEditing(blankRecipe())} />
            </View>}
          />
        ) : (
          <View style={styles.grid}>
            {visible.map((r) => {
              const m = matchRecipe(r, owned, prefs.allowSubstitutes, discovery.intent.excludedIngredientIds,
                (wanted, used) => ideaAllowsSubstitution(discovery.intent, wanted, used));
              const total = r.ingredients.filter((i) => !i.isOptional).length;
              const have = total - m.missing.length - m.softMissing.length;
              return (
                <View key={r.id} style={[styles.card, { width: cardWidth }]}>
                  <Press
                    onPress={() => setDetail(r)}
                    scaleTo={0.965}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${r.name}`}
                    style={{ flex: 1 }}
                  >
                    <View style={styles.cardEdge} pointerEvents="none" />
                    <LinearGradient
                      colors={[accentForRecipe(r) + '24', accentForRecipe(r) + '08']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardArt}
                    >
                      <CocktailArt color={accentForRecipe(r)} glass={r.glass} size={128} />

                      {r.theme ? (
                        <View style={styles.themeTag}>
                          <Text style={styles.themeTagText}>
                            {THEME_BY_ID[r.theme]?.label}
                          </Text>
                        </View>
                      ) : r.id.startsWith('book-') ? (
                        <View style={styles.themeTag}>
                          <Text style={styles.themeTagText}>FROM A BOOK</Text>
                        </View>
                      ) : null}
                    </LinearGradient>

                    <View style={styles.cardBody}>
                      <Text style={styles.cardName} numberOfLines={2}>
                        {r.name}
                      </Text>
                      <Stars value={r.rating} size={11} />
                      <HaveCount have={have} total={total} />
                      <Dim style={{ fontSize: 11 }}>{r.method.charAt(0).toUpperCase() + r.method.slice(1)} · View recipe</Dim>
                    </View>
                  </Press>
                  <Pressable
                    onPress={() => toggleFavorite(r.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`${r.isFavorite ? 'Unfavorite' : 'Favorite'} ${r.name}`}
                    style={styles.heart}
                  >
                    <Icon
                      name={r.isFavorite ? 'heart' : 'heart-outline'}
                      size={17}
                      color={r.isFavorite ? C.rose : 'rgba(255,255,255,0.75)'}
                    />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <DetailSheet
        recipe={currentDetail}
        owned={owned}
        allowSubstitutes={prefs.allowSubstitutes}
        ideaIntent={discovery.intent}
        onClose={() => setDetail(null)}
        onMade={(r) => {
          markMade(r.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }}
        onFavorite={(r) => toggleFavorite(r.id)}
        onRate={(r, n) => rateRecipe(r.id, n)}
        onEdit={(r) => {
          setDetail(null);
          setEditing(r);
        }}
        onDelete={(r) => {
          removeRecipe(r.id);
          setDetail(null);
        }}
      />

      <Editor
        recipe={editing}
        onClose={() => setEditing(null)}
        onSave={(r) => {
          saveRecipe(r);
          setEditing(null);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }}
      />
    </View>
  );
}

export function blankRecipe(): DrinkRecipe {
  return {
    id: 'user-' + Math.random().toString(36).slice(2, 9),
    name: '',
    origin: 'user',
    method: 'shake',
    glass: null,
    ingredients: [],
    steps: [],
    garnish: null,
    vibeTags: [],
    accent: ACCENTS[Math.floor(Math.random() * ACCENTS.length)],
    isZeroProof: false,
    timesMade: 0,
    lastMadeAt: null,
    isFavorite: false,
    rating: null,
    sourceUrl: null,
    sourceNote: null,
    theme: null,
    createdAt: Date.now(),
  };
}

function DetailSheet({
  recipe,
  owned,
  allowSubstitutes,
  ideaIntent,
  onClose,
  onMade,
  onFavorite,
  onRate,
  onEdit,
  onDelete,
}: {
  recipe: DrinkRecipe | null;
  owned: ReturnType<typeof buildOwned>;
  allowSubstitutes: boolean;
  ideaIntent: DrinkIntent;
  onClose: () => void;
  onMade: (r: DrinkRecipe) => void;
  onFavorite: (r: DrinkRecipe) => void;
  onRate: (r: DrinkRecipe, n: number) => void;
  onEdit: (r: DrinkRecipe) => void;
  onDelete: (r: DrinkRecipe) => void;
}) {
  if (!recipe) return null;
  const m = matchRecipe(recipe, owned, allowSubstitutes, ideaIntent.excludedIngredientIds,
    (wanted, used) => ideaAllowsSubstitution(ideaIntent, wanted, used));
  const missing = new Set(m.missing.concat(m.softMissing));
  const total = recipe.ingredients.filter((i) => !i.isOptional).length;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Label color={accentForRecipe(recipe)}>
                  {recipe.method}
                  {recipe.glass ? ` · ${recipe.glass.replace('gl-', '')}` : ''}
                </Label>
                <Title style={{ marginTop: 4 }}>{recipe.name}</Title>
              </View>
              <Pressable onPress={onClose} accessibilityRole="button" hitSlop={12}>
                <Text style={styles.close}>Close</Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: S.md, marginTop: S.sm }}>
              <Dim>Your rating</Dim>
              <Stars value={recipe.rating} size={18} onRate={(n) => onRate(recipe, n)} />
              <HaveCount have={total - m.missing.length - m.softMissing.length} total={total} />
            </View>

            <RecipeSources recipe={recipe} />
            {m.substitutions.map((sub, index) => <Dim key={index} style={{ color: C.amber, marginTop: 8 }}>Use {sub.used} for {sub.wanted}.</Dim>)}

            <Label style={{ marginTop: S.lg }}>Ingredients</Label>
            <View style={{ marginTop: S.sm, gap: 6 }}>
              {recipe.ingredients.map((ing, i) => {
                const have = !missing.has(ing.displayName);
                return (
                  <View key={i} style={styles.ingRow}>
                    <View style={[styles.dot, { backgroundColor: have ? C.teal : C.faint }]} />
                    <Body style={[{ flex: 1 }, !have && { color: C.dim }]}>
                      {formatIngredient(ing)}
                    </Body>
                    {!have ? <Text style={styles.missing}>MISSING</Text> : null}
                  </View>
                );
              })}
              {recipe.ingredients.length === 0 ? <Dim>No ingredients written down yet.</Dim> : null}
            </View>

            {recipe.steps.length ? (
              <>
                <Label style={{ marginTop: S.lg }}>Method</Label>
                <View style={{ marginTop: S.sm, gap: 8 }}>
                  {recipe.steps.map((s, i) => (
                    <View key={i} style={styles.stepRow}>
                      <Text style={styles.stepNum}>{String(i + 1).padStart(2, '0')}</Text>
                      <Body style={{ flex: 1 }}>{s}</Body>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            {recipe.garnish ? (
              <>
                <Label style={{ marginTop: S.lg }}>Garnish</Label>
                <Body style={{ marginTop: 4 }}>{recipe.garnish}</Body>
              </>
            ) : null}

            <View style={{ gap: S.sm, marginTop: S.xl, marginBottom: S.xxl }}>
              <PrimaryButton label="MAKE IT" onPress={() => onMade(recipe)} />
              <View style={{ flexDirection: 'row', gap: S.sm }}>
                <GhostButton
                  label={recipe.isFavorite ? 'Favorited' : 'Favorite'}
                  color={recipe.isFavorite ? C.rose : C.text}
                  onPress={() => onFavorite(recipe)}
                  style={{ flex: 1 }}
                />
                <GhostButton label="Edit" onPress={() => onEdit(recipe)} style={{ flex: 1 }} />
              </View>
              {recipe.origin === 'user' ? (
                <GhostButton label="Delete" color={C.rose} onPress={() => onDelete(recipe)} />
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Editor({
  recipe,
  onClose,
  onSave,
}: {
  recipe: DrinkRecipe | null;
  onClose: () => void;
  onSave: (r: DrinkRecipe) => void;
}) {
  const [draft, setDraft] = useState<DrinkRecipe | null>(recipe);
  const [ingQuery, setIngQuery] = useState('');
  const [stepText, setStepText] = useState('');

  React.useEffect(() => {
    setDraft(recipe);
    setIngQuery('');
    setStepText('');
  }, [recipe]);

  if (!draft) return null;

  const suggestions = ingQuery.trim()
    ? CATALOG.filter((c) => c.name.toLowerCase().includes(ingQuery.trim().toLowerCase())).slice(0, 5)
    : [];

  const addIngredient = (name: string, catalogItemId: string | null) => {
    const ing: RecipeIngredient = {
      catalogItemId,
      displayName: name,
      amount: null,
      unit: 'oz' as Unit,
      role: 'mixer',
      isOptional: false,
    };
    setDraft({ ...draft, ingredients: [...draft.ingredients, ing] });
    setIngQuery('');
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Heading>{recipe?.name ? 'Edit recipe' : 'New recipe'}</Heading>
            <Pressable onPress={onClose} accessibilityRole="button" hitSlop={12}>
              <Text style={styles.close}>Cancel</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Label>Name</Label>
            <TextInput
              value={draft.name}
              onChangeText={(t) => setDraft({ ...draft, name: t })}
              placeholder="What do you call it?"
              placeholderTextColor={C.faint}
              style={[styles.search, { fontSize: 19, fontFamily: F.semibold }]}
              accessibilityLabel="Recipe name"
            />

            <Label style={{ marginTop: S.lg }}>Method</Label>
            <View style={styles.chipRow}>
              {(['shake', 'stir', 'build', 'blend', 'muddle'] as Method[]).map((m) => (
                <Chip
                  key={m}
                  label={m}
                  active={draft.method === m}
                  onPress={() => setDraft({ ...draft, method: m })}
                  small
                />
              ))}
            </View>

            <Label style={{ marginTop: S.lg }}>Ingredients</Label>
            {draft.ingredients.map((ing, i) => (
              <View key={i} style={styles.editRow}>
                <TextInput
                  value={ing.amount === null ? '' : String(ing.amount)}
                  onChangeText={(t) => {
                    const v = t.trim() === '' ? null : Number(t.replace(',', '.'));
                    const next = [...draft.ingredients];
                    next[i] = { ...next[i], amount: Number.isFinite(v as number) ? (v as number) : null };
                    setDraft({ ...draft, ingredients: next });
                  }}
                  placeholder="—"
                  placeholderTextColor={C.faint}
                  keyboardType="decimal-pad"
                  style={[styles.search, styles.amountInput]}
                  accessibilityLabel={`Amount for ${ing.displayName}`}
                />
                <View style={{ flex: 1 }}>
                  <Body numberOfLines={1}>{ing.displayName}</Body>
                  <Dim>{ing.catalogItemId ? 'matched to catalog' : 'free text'}</Dim>
                </View>
                <Pressable
                  onPress={() =>
                    setDraft({ ...draft, ingredients: draft.ingredients.filter((_, j) => j !== i) })
                  }
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${ing.displayName}`}
                >
                  <Icon name="close" size={15} color={C.faint} />
                </Pressable>
              </View>
            ))}

            <TextInput
              value={ingQuery}
              onChangeText={setIngQuery}
              placeholder="Add an ingredient"
              placeholderTextColor={C.faint}
              style={styles.search}
              accessibilityLabel="Add an ingredient"
            />
            {suggestions.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => addIngredient(s.name, s.id)}
                style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
              >
                <IngredientArt {...artForCatalog(s.id, s.category)} seed={s.name} size={32} />
                <Body style={{ flex: 1 }}>{s.name}</Body>
                <Text style={styles.matchTag}>MATCH</Text>
              </Pressable>
            ))}
            {ingQuery.trim() && suggestions.length === 0 ? (
              <Pressable
                onPress={() => addIngredient(ingQuery.trim(), null)}
                style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
              >
                <Body style={{ flex: 1 }}>Add “{ingQuery.trim()}” as free text</Body>
              </Pressable>
            ) : null}

            <Label style={{ marginTop: S.lg }}>Steps</Label>
            {draft.steps.map((s, i) => (
              <View key={i} style={styles.editRow}>
                <Text style={styles.stepNum}>{String(i + 1).padStart(2, '0')}</Text>
                <Body style={{ flex: 1 }}>{s}</Body>
                <Pressable
                  onPress={() => setDraft({ ...draft, steps: draft.steps.filter((_, j) => j !== i) })}
                  hitSlop={10}
                  accessibilityRole="button"
                >
                  <Icon name="close" size={15} color={C.faint} />
                </Pressable>
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: S.sm }}>
              <TextInput
                value={stepText}
                onChangeText={setStepText}
                placeholder="Add a step"
                placeholderTextColor={C.faint}
                style={[styles.search, { flex: 1 }]}
                accessibilityLabel="Add a step"
              />
              <GhostButton
                label="Add"
                color={C.teal}
                onPress={() => {
                  if (!stepText.trim()) return;
                  setDraft({ ...draft, steps: [...draft.steps, stepText.trim()] });
                  setStepText('');
                }}
                style={{ paddingHorizontal: S.lg, justifyContent: 'center', marginTop: S.md }}
              />
            </View>

            <Label style={{ marginTop: S.lg }}>Garnish</Label>
            <TextInput
              value={draft.garnish ?? ''}
              onChangeText={(t) => setDraft({ ...draft, garnish: t || null })}
              placeholder="Optional"
              placeholderTextColor={C.faint}
              style={styles.search}
              accessibilityLabel="Garnish"
            />

            <View style={{ marginTop: S.xl, marginBottom: S.xxl }}>
              <PrimaryButton
                label="SAVE RECIPE"
                disabled={!draft.name.trim()}
                onPress={() => {
                  const isZeroProof = draft.ingredients.every((ing) => {
                    const cat = ing.catalogItemId
                      ? CATALOG.find((c) => c.id === ing.catalogItemId)
                      : null;
                    return !cat || cat.typicalAbv === 0;
                  });
                  onSave({ ...draft, name: draft.name.trim(), isZeroProof });
                }}
              />
              <Dim style={{ textAlign: 'center', marginTop: S.sm }}>
                Only the name is required. Fill in the rest whenever.
              </Dim>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { ...SCREEN },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  eyebrow: { color: C.accent, fontFamily: F.medium, fontSize: 10, letterSpacing: 2 },
  newButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },

  search: {
    backgroundColor: C.ink2,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    color: C.text,
    paddingHorizontal: S.md,
    paddingVertical: 11,
    fontSize: 15,
    marginTop: S.md,
  },
  rail: { flexGrow: 0, marginHorizontal: -S.lg, marginTop: S.md },
  railRow: { flexDirection: 'row', gap: 6, paddingHorizontal: S.lg },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  card: {
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.panel,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  cardEdge: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: C.edge,
    zIndex: 3,
  },
  cardArt: { height: 150, alignItems: 'center', justifyContent: 'center' },

  heart: { position: 'absolute', top: 2, right: 2, padding: 13 },
  themeTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(7,11,17,0.72)',
    borderRadius: R.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  themeTagText: { color: C.text, fontSize: 8.5, fontWeight: '800', letterSpacing: 0.4 },
  cardBody: { padding: S.md, gap: 4 },
  cardName: { color: C.text, fontFamily: F.medium, fontSize: 16, letterSpacing: -0.2, lineHeight: 21, minHeight: 42 },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    backgroundColor: C.panel,
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    padding: S.lg,
    height: '88%',
    borderTopWidth: 1,
    borderColor: C.line2,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: C.line2,
    alignSelf: 'center', marginBottom: S.md,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: S.md,
  },
  close: { color: C.teal, fontWeight: '800', fontSize: 14, paddingTop: 4 },

  ingRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  dot: { width: 5, height: 5, borderRadius: 3 },
  missing: { color: C.amber, fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  stepRow: { flexDirection: 'row', gap: S.md },
  stepNum: { color: C.faint, fontSize: 11, fontWeight: '800', paddingTop: 4, width: 20 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: S.sm },
  editRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  amountInput: { width: 64, textAlign: 'center', marginTop: 0 },
  remove: { color: C.faint, fontSize: 15, paddingHorizontal: 4 },
  suggestion: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingVertical: 11, paddingHorizontal: S.md,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: S.md },
  matchTag: { color: C.teal, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
});
