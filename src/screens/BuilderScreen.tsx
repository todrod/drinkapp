import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { accentOf, C, F, R, S } from '../theme';
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
  Title,
} from '../components/ui';
import { useData } from '../store';
import { CATALOG_BY_ID } from '../data/catalog';
import { Category, DrinkRecipe, InventoryItem } from '../types';
import { pluralize } from '../format';
import { Icon } from '../icons';
import { IngredientArt } from '../components/IngredientArt';
import { artForCatalog } from '../data/art';
import { blankRecipe } from './RecipesScreen';
import { TabKey } from '../components/NavPill';

interface Step {
  key: string;
  label: string;
  heading: string;
  categories: Category[];
  max: number;
}

const STEPS: Step[] = [
  { key: 'base', label: 'BASE', heading: 'CHOOSE YOUR BASE', categories: ['beverage'], max: 2 },
  { key: 'mixers', label: 'MIXERS', heading: 'CHOOSE YOUR MIXERS', categories: ['mixer'], max: 3 },
  {
    key: 'toppings',
    label: 'TOPPINGS',
    heading: 'FINISH IT OFF',
    categories: ['sweet', 'flavor', 'garnish'],
    max: 3,
  },
];

export function BuilderScreen({ goTo }: { goTo: (tab: TabKey) => void }) {
  const { kit, recipes, saveRecipe } = useData();
  const [stepIndex, setStepIndex] = useState(0);
  const [picked, setPicked] = useState<Record<string, string[]>>({ base: [], mixers: [], toppings: [] });
  const [done, setDone] = useState(false);
  const [subFilter, setSubFilter] = useState<string | null>(null);

  const fill = useRef(new Animated.Value(0)).current;

  const step = STEPS[stepIndex];
  const selected = picked[step.key] ?? [];

  const progress = done ? 1 : (stepIndex + selected.length / Math.max(step.max, 1)) / STEPS.length;

  useEffect(() => {
    Animated.timing(fill, {
      toValue: Math.min(progress, 1),
      duration: 320,
      useNativeDriver: false,
    }).start();
  }, [progress, fill]);

  // Only things actually in the cabinet — the whole point is building from stock.
  const options = useMemo(() => {
    const inStep = kit.filter((k) => step.categories.includes(k.category) && k.level !== 'out');
    if (!subFilter) return inStep;
    return inStep.filter((k) => {
      const cat = k.catalogItemId ? CATALOG_BY_ID[k.catalogItemId] : null;
      return cat?.spiritType === subFilter || cat?.kind === subFilter;
    });
  }, [kit, step, subFilter]);

  const subFilters = useMemo(() => {
    const set = new Set<string>();
    for (const k of kit) {
      if (!step.categories.includes(k.category)) continue;
      const cat = k.catalogItemId ? CATALOG_BY_ID[k.catalogItemId] : null;
      if (cat?.spiritType) set.add(cat.spiritType);
      else if (cat?.kind && step.key !== 'base') set.add(cat.kind);
    }
    return Array.from(set).sort();
  }, [kit, step]);

  const allPicked = useMemo(
    () => Object.values(picked).flat(),
    [picked]
  );

  /**
   * Selection is keyed by inventory row id, not catalog id. Several bottles
   * deliberately share one catalog id — eight gins all resolve `sp-gin` — so
   * keying by catalog id would light up every gin at once.
   */
  const toggle = (item: InventoryItem) => {
    Haptics.selectionAsync().catch(() => {});
    setPicked((prev) => {
      const cur = prev[step.key] ?? [];
      if (cur.includes(item.id)) return { ...prev, [step.key]: cur.filter((x) => x !== item.id) };
      if (cur.length >= step.max) return prev;
      return { ...prev, [step.key]: [...cur, item.id] };
    });
  };

  /** The picked rows, resolved back to catalog ids for matching and saving. */
  const pickedCatalogIds = useMemo(() => {
    const byId = new Map(kit.map((k) => [k.id, k]));
    const ids = allPicked
      .map((rowId) => byId.get(rowId)?.catalogItemId)
      .filter(Boolean) as string[];
    return Array.from(new Set(ids));
  }, [allPicked, kit]);

  const pickedRows = useMemo(() => {
    const byId = new Map(kit.map((k) => [k.id, k]));
    return allPicked.map((rowId) => byId.get(rowId)).filter(Boolean) as InventoryItem[];
  }, [allPicked, kit]);

  // Recipes ranked by how much of the build they actually contain.
  const matches = useMemo(() => {
    if (pickedCatalogIds.length === 0) return [];
    return recipes
      .map((r) => {
        const ids = new Set(r.ingredients.map((i) => i.catalogItemId).filter(Boolean) as string[]);
        const hits = pickedCatalogIds.filter((p) => ids.has(p)).length;
        return { recipe: r, hits, total: pickedCatalogIds.length };
      })
      .filter((m) => m.hits > 0)
      .sort((a, b) => b.hits - a.hits || a.recipe.name.localeCompare(b.recipe.name))
      .slice(0, 6);
  }, [recipes, pickedCatalogIds]);

  const reset = () => {
    setPicked({ base: [], mixers: [], toppings: [] });
    setStepIndex(0);
    setDone(false);
    setSubFilter(null);
  };

  const saveAsRecipe = () => {
    const draft: DrinkRecipe = {
      ...blankRecipe(),
      name: 'My build ' + new Date().toLocaleDateString(),
      ingredients: pickedRows.map((row) => {
        const cat = row.catalogItemId ? CATALOG_BY_ID[row.catalogItemId] : null;
        return {
          catalogItemId: row.catalogItemId,
          displayName: row.name,
          amount: null,
          unit: 'oz' as const,
          role: (cat && cat.category === 'beverage' ? 'base' : 'mixer') as 'base' | 'mixer',
          isOptional: false,
        };
      }),
      steps: ['Built in the Drink Builder — adjust the measures to taste.'],
    };
    saveRecipe(draft);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    goTo('recipes');
  };

  if (kit.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <Title style={styles.screenTitle}>DRINK BUILDER</Title>
        <EmptyState
          icon="glass-cocktail"
          title="Nothing to build with"
          body="The builder works from what's actually in your cabinet, so it needs stock first."
          action={<PrimaryButton label="OPEN MY CABINET" onPress={() => goTo('cabinet')} />}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Title style={styles.screenTitle}>DRINK BUILDER</Title>

      {/* ── Stepper ─────────────────────────────────────────────────────── */}
      <View style={styles.stepper}>
        {STEPS.map((s, i) => {
          const state = done || i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'todo';
          return (
            <React.Fragment key={s.key}>
              {i > 0 ? <View style={[styles.stepLine, state !== 'todo' && styles.stepLineOn]} /> : null}
              <Pressable
                onPress={() => {
                  if (i <= stepIndex || done) {
                    setDone(false);
                    setStepIndex(i);
                    setSubFilter(null);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={`Step ${i + 1}, ${s.label}`}
                style={styles.stepItem}
              >
                <View
                  style={[
                    styles.stepDot,
                    state === 'active' && styles.stepDotActive,
                    state === 'done' && styles.stepDotDone,
                  ]}
                >
                  {state === 'done' ? <Icon name="check" size={11} color={C.ink} /> : null}
                </View>
                <Text style={[styles.stepLabel, state !== 'todo' && { color: C.teal }]}>
                  {i + 1}. {s.label}
                </Text>
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>

      {done ? (
        <>
          <Panel style={{ gap: S.md }}>
            <Label color={C.teal}>Your build</Label>
            <View style={styles.pickWrap}>
              {pickedRows.map((row) => (
                <Chip key={row.id} label={row.name} small />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: S.sm }}>
              <PrimaryButton label="SAVE AS RECIPE" onPress={saveAsRecipe} style={{ flex: 1 }} />
              <GhostButton label="Start over" onPress={reset} color={C.teal} style={{ flex: 1 }} />
            </View>
          </Panel>

          <Label style={{ marginTop: S.lg }}>
            {matches.length ? 'Closest drinks in the library' : 'No library match'}
          </Label>
          {matches.length === 0 ? (
            <Dim style={{ marginTop: S.sm }}>
              Nothing in the library uses those together — which might mean you have invented
              something. Save it and see.
            </Dim>
          ) : (
            <View style={{ gap: S.sm, marginTop: S.sm }}>
              {matches.map((m) => (
                <View key={m.recipe.id} style={styles.matchRow}>
                  <View style={[styles.matchDot, { backgroundColor: accentOf(m.recipe.accent) }]} />
                  <View style={{ flex: 1 }}>
                    <Body>{m.recipe.name}</Body>
                    <Dim>
                      uses {m.hits} of your {m.total} {pluralize(m.total, 'pick')}
                    </Dim>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <>
          <View style={styles.stepHeadRow}>
            <Text style={styles.stepHeading}>
              STEP {stepIndex + 1}: {step.heading}
            </Text>
            <Text style={styles.stepCount}>
              ({selected.length}/{step.max})
            </Text>
          </View>

          {subFilters.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rail}>
              <View style={styles.railRow}>
                <Chip label="All" active={!subFilter} onPress={() => setSubFilter(null)} small />
                {subFilters.map((f) => (
                  <Chip
                    key={f}
                    label={f}
                    active={subFilter === f}
                    onPress={() => setSubFilter(subFilter === f ? null : f)}
                    small
                  />
                ))}
              </View>
            </ScrollView>
          ) : null}

          <View style={styles.body}>
            <ScrollView
              style={styles.optionScroll}
              contentContainerStyle={styles.optionGrid}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {options.map((item) => {
                const on = selected.includes(item.id);
                const full = !on && selected.length >= step.max;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggle(item)}
                    disabled={full}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={({ pressed }) => [
                      styles.tile,
                      on && styles.tileOn,
                      full && { opacity: 0.35 },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <View style={[styles.tilePlus, on && { backgroundColor: C.teal }]}>
                      <Icon name={on ? 'check' : 'plus'} size={11} color={on ? C.ink : C.dim} />
                    </View>
                    <View style={styles.tileIcon}>
                      <IngredientArt {...artForCatalog(item.catalogItemId, item.category)} size={40} />
                    </View>
                    <Text style={styles.tileName} numberOfLines={2}>
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
              {options.length === 0 ? (
                <Dim style={{ paddingVertical: S.lg }}>
                  Nothing in the cabinet fits this step yet.
                </Dim>
              ) : null}
            </ScrollView>

            {/* ── The glass ─────────────────────────────────────────────── */}
            <View style={styles.glassCol}>
              <View style={styles.glass}>
                <Animated.View
                  style={[
                    styles.glassFill,
                    {
                      height: fill.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['4%', '86%'],
                      }),
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[C.tealSoft, C.tealDeep]}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>
              <Text style={styles.glassCount}>
                {allPicked.length} {pluralize(allPicked.length, 'item')}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.lg }}>
            {stepIndex > 0 ? (
              <GhostButton
                label="Back"
                onPress={() => {
                  setStepIndex(stepIndex - 1);
                  setSubFilter(null);
                }}
                style={{ flex: 1 }}
              />
            ) : null}
            <PrimaryButton
              label={stepIndex === STEPS.length - 1 ? 'FINISH' : 'NEXT'}
              disabled={stepIndex === 0 && selected.length === 0}
              onPress={() => {
                setSubFilter(null);
                if (stepIndex === STEPS.length - 1) setDone(true);
                else setStepIndex(stepIndex + 1);
              }}
              style={{ flex: 2 }}
            />
          </View>
          {stepIndex === 0 && selected.length === 0 ? (
            <Dim style={{ textAlign: 'center', marginTop: S.sm }}>Pick at least one base to continue.</Dim>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: S.lg, paddingTop: S.lg, paddingBottom: 130, gap: S.md },
  screenTitle: { fontSize: 24, letterSpacing: 1 },

  stepper: { flexDirection: 'row', alignItems: 'center', marginVertical: S.sm },
  stepItem: { alignItems: 'center', gap: 5 },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: C.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    borderColor: C.teal,
    backgroundColor: 'rgba(53,214,196,0.25)',
    shadowColor: C.teal,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  stepDotDone: { borderColor: C.teal, backgroundColor: C.teal },

  stepLabel: { color: C.faint, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  stepLine: { flex: 1, height: 1, backgroundColor: C.line2, marginHorizontal: 6, marginBottom: 14 },
  stepLineOn: { backgroundColor: C.teal },

  stepHeadRow: { flexDirection: 'row', alignItems: 'baseline', gap: S.sm },
  stepHeading: { color: C.text, fontSize: 12.5, fontWeight: '800', letterSpacing: 1.1 },
  stepCount: { color: C.teal, fontSize: 12, fontWeight: '800' },

  rail: { flexGrow: 0, marginHorizontal: -S.lg },
  railRow: { flexDirection: 'row', gap: 6, paddingHorizontal: S.lg },

  body: { flexDirection: 'row', gap: S.md, marginTop: S.sm },
  // Capped so the glass and the Next button stay on screen; the grid scrolls
  // inside itself rather than pushing them below the fold.
  optionScroll: { flex: 1, maxHeight: 330 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, paddingBottom: S.sm },
  tile: {
    width: '31.2%',
    aspectRatio: 0.78,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.glass,
    padding: S.sm,
    justifyContent: 'flex-end',
    gap: 3,
  },
  tileOn: {
    borderColor: C.teal,
    backgroundColor: 'rgba(53,214,196,0.12)',
    shadowColor: C.teal,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  tilePlus: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tileIcon: { marginBottom: 4, height: 42, justifyContent: 'flex-end' },
  tileName: { color: C.text, fontSize: 10, fontWeight: '700', lineHeight: 13 },

  glassCol: { width: 76, alignItems: 'center', gap: 6 },
  glass: {
    width: 62,
    height: 148,
    borderWidth: 1.5,
    borderColor: 'rgba(140,232,224,0.4)',
    borderTopWidth: 0,
    borderBottomLeftRadius: R.md,
    borderBottomRightRadius: R.md,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  glassFill: { width: '100%', overflow: 'hidden' },
  glassCount: { color: C.faint, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },

  pickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    padding: S.md,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.glass,
  },
  matchDot: { width: 8, height: 8, borderRadius: 4 },
});
