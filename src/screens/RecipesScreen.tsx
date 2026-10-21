import { isAlcoholFree, isServingReady } from '../logic/recipes';
import React, { useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
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
  PrimaryButton,
  Press,
  Stars,
  Wordmark,
} from '../components/ui';
import { useData } from '../store';
import { DrinkRecipe } from '../types';
import { THEMES, THEME_BY_ID } from '../data/seed';
import { buildOwned, matchRecipe } from '../logic/generator';
import { pluralize } from '../format';
import { Icon } from '../icons';
import { CocktailArt } from '../components/CocktailArt';
import { CURATION_DATE, inCollection, RATING_SOURCE, TREND_SOURCE, trendingRank } from '../data/curation';
import { discoverDrinks, ideaAllowsSubstitution } from '../logic/discovery';

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

export function RecipesScreen({ onOpen, onNew }: { onOpen: (r: DrinkRecipe) => void; onNew: () => void }) {
  const { recipes, kit, prefs, toggleFavorite } =
    useData();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter | null>(null);
  const [onlyReady, setOnlyReady] = useState(false);
  const [theme, setTheme] = useState<string | null>(null);

  const owned = useMemo(() => buildOwned(kit), [kit]);
  const { width } = useWindowDimensions();
  const columns = width >= 1000 ? 4 : width >= 700 ? 3 : 2;
  const cardWidth = (Math.min(width, 1120) - 48 - 12 * (columns - 1)) / columns;
  const eligible = useMemo(() => prefs.zeroProofMode ? recipes.filter(isAlcoholFree) : recipes, [recipes, prefs.zeroProofMode]);
  const discovery = useMemo(() => discoverDrinks(eligible, query), [eligible, query]);

  const visible = useMemo(() => {
    const candidates = query.trim() ? discovery.matches.map((m) => m.recipe) : eligible;
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
  }, [eligible, query, discovery, filter, theme, onlyReady, owned, prefs.allowSubstitutes]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'web' ? 'none' : 'on-drag'}>
        <View style={styles.topBar}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.eyebrow}>FIND YOUR NEW FAVORITE</Text>
            <Wordmark>The recipe book</Wordmark>
            <Dim>{prefs.zeroProofMode ? 'Zero-proof mode · alcohol-free recipes only.' : 'A classic for every occasion. A twist for every mood.'}</Dim>
          </View>
          <Pressable
            onPress={onNew}
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
              <GhostButton label="Write my own recipe" onPress={onNew} />
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
                    onPress={() => onOpen(r)}
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
                      {isServingReady(r) ? <HaveCount have={have} total={total} /> : <Dim style={{ color: C.amber }}>Draft recipe</Dim>}
                      <Dim>{isServingReady(r) ? r.method.charAt(0).toUpperCase() + r.method.slice(1) + ' · View recipe' : 'Draft · add measures and steps'}</Dim>
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

    </View>
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
  themeTagText: { color: C.text, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  cardBody: { padding: S.md, gap: 4 },
  cardName: { color: C.text, fontFamily: F.medium, fontSize: 16, letterSpacing: -0.2, lineHeight: 21, minHeight: 42 },

});
