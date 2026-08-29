import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { C, F, R, S } from '../theme';
import {
  Body,
  Chip,
  Dim,
  EmptyState,
  GhostButton,
  Heading,
  Label,
  Panel,
  PrimaryButton,
  ScreenHeader,
  Title,
} from '../components/ui';
import { useData } from '../store';
import { CATALOG } from '../data/catalog';
import { DrinkRecipe, Method, RecipeIngredient, Unit } from '../types';
import { buildOwned, matchRecipe } from '../logic/generator';
import { formatIngredient, pluralize } from '../format';

const ACCENTS = [C.lime, C.cyan, C.magenta, C.amber, C.violet];

export function BookScreen() {
  const { recipes, kit, prefs, saveRecipe, removeRecipe, markMade, toggleFavorite } = useData();
  const [detail, setDetail] = useState<DrinkRecipe | null>(null);
  const [editing, setEditing] = useState<DrinkRecipe | null>(null);
  const [surprise, setSurprise] = useState<DrinkRecipe | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);

  const owned = useMemo(() => buildOwned(kit), [kit]);

  const visible = useMemo(
    () => (onlyMine ? recipes.filter((r) => r.origin === 'user') : recipes),
    [recipes, onlyMine]
  );

  const pickSurprise = () => {
    if (!visible.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const pick = visible[Math.floor(Math.random() * visible.length)];
    setSurprise(pick);
    setDetail(pick);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="My Drink Book"
          subtitle={`${recipes.length} ${pluralize(recipes.length, 'recipe')} · ${
            recipes.filter((r) => r.origin === 'user').length
          } yours`}
        />

        <View style={styles.filterRow}>
          <Chip label="All" active={!onlyMine} onPress={() => setOnlyMine(false)} />
          <Chip label="Mine only" active={onlyMine} color={C.magenta} onPress={() => setOnlyMine(true)} />
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="Surprise me" onPress={pickSurprise} style={{ flex: 1 }} />
          <GhostButton
            label="+ New"
            color={C.magenta}
            onPress={() => setEditing(blankRecipe())}
            style={{ flex: 1 }}
          />
        </View>
        {surprise ? (
          <Dim style={{ textAlign: 'center' }}>
            From your book — you may need to shop.
          </Dim>
        ) : null}

        {visible.length === 0 ? (
          <EmptyState
            icon="📖"
            title={onlyMine ? 'No recipes of your own yet' : 'Your book is empty'}
            body="Write down what you actually pour. Only the name is required — you can fill in the rest later."
            action={<PrimaryButton label="Add a recipe" onPress={() => setEditing(blankRecipe())} />}
          />
        ) : (
          <View style={styles.grid}>
            {visible.map((r) => {
              const m = matchRecipe(r, owned, prefs.allowSubstitutes);
              return (
                <Pressable
                  key={r.id}
                  onPress={() => setDetail(r)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
                >
                  <View style={[styles.cardGlow, { backgroundColor: r.accent }]} />
                  <View style={styles.cardTop}>
                    <Text style={styles.cardBadge}>
                      {r.origin === 'user' ? 'MINE' : r.origin === 'trending' ? 'TRENDING' : 'CLASSIC'}
                    </Text>
                    {r.isFavorite ? <Text style={styles.star}>★</Text> : null}
                  </View>
                  <Text style={styles.cardName} numberOfLines={2}>
                    {r.name}
                  </Text>
                  <Dim numberOfLines={1}>
                    {r.ingredients.length} {pluralize(r.ingredients.length, 'ingredient')}
                  </Dim>
                  <View style={styles.cardFoot}>
                    <View style={[styles.pourDot, { backgroundColor: m.ok ? C.lime : C.faint }]} />
                    <Text style={[styles.pourText, { color: m.ok ? C.lime : C.faint }]}>
                      {m.ok ? 'CAN POUR' : `NEED ${m.missing.length}`}
                    </Text>
                    {r.timesMade > 0 ? <Text style={styles.made}>·  made {r.timesMade}×</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <DetailSheet
        recipe={detail}
        owned={owned}
        allowSubstitutes={prefs.allowSubstitutes}
        onClose={() => setDetail(null)}
        onMade={(r) => {
          markMade(r.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }}
        onFavorite={(r) => toggleFavorite(r.id)}
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

function blankRecipe(): DrinkRecipe {
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
    sourceUrl: null,
    createdAt: Date.now(),
  };
}

function DetailSheet({
  recipe,
  owned,
  allowSubstitutes,
  onClose,
  onMade,
  onFavorite,
  onEdit,
  onDelete,
}: {
  recipe: DrinkRecipe | null;
  owned: ReturnType<typeof buildOwned>;
  allowSubstitutes: boolean;
  onClose: () => void;
  onMade: (r: DrinkRecipe) => void;
  onFavorite: (r: DrinkRecipe) => void;
  onEdit: (r: DrinkRecipe) => void;
  onDelete: (r: DrinkRecipe) => void;
}) {
  if (!recipe) return null;
  const m = matchRecipe(recipe, owned, allowSubstitutes);
  const missing = new Set(m.missing.concat(m.softMissing));

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Label color={recipe.accent}>
                  {recipe.method}{recipe.glass ? ` · ${recipe.glass.replace('gl-', '')}` : ''}
                </Label>
                <Title style={{ marginTop: 4 }}>{recipe.name}</Title>
              </View>
              <Pressable onPress={onClose} accessibilityRole="button" hitSlop={12}>
                <Text style={styles.close}>Close</Text>
              </Pressable>
            </View>

            {recipe.sourceUrl ? (
              <Dim style={{ marginBottom: S.md }}>Source: {recipe.sourceUrl}</Dim>
            ) : null}

            <Label style={{ marginTop: S.md }}>Ingredients</Label>
            <View style={{ marginTop: S.sm, gap: 6 }}>
              {recipe.ingredients.map((ing, i) => {
                const have = !missing.has(ing.displayName);
                return (
                  <View key={i} style={styles.ingRow}>
                    <View style={[styles.dot, { backgroundColor: have ? C.lime : C.faint }]} />
                    <Body style={[{ flex: 1 }, !have && { color: C.dim }]}>
                      {formatIngredient(ing)}
                    </Body>
                    {!have ? <Text style={styles.missing}>MISSING</Text> : null}
                  </View>
                );
              })}
              {recipe.ingredients.length === 0 ? (
                <Dim>No ingredients written down yet.</Dim>
              ) : null}
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
              <PrimaryButton label="I made this" onPress={() => onMade(recipe)} />
              <View style={{ flexDirection: 'row', gap: S.sm }}>
                <GhostButton
                  label={recipe.isFavorite ? '★ Favorited' : '☆ Favorite'}
                  color={recipe.isFavorite ? C.amber : C.text}
                  onPress={() => onFavorite(recipe)}
                  style={{ flex: 1 }}
                />
                <GhostButton label="Edit" onPress={() => onEdit(recipe)} style={{ flex: 1 }} />
              </View>
              {recipe.origin === 'user' ? (
                <GhostButton label="Delete" color={C.magenta} onPress={() => onDelete(recipe)} />
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

  const setAmount = (index: number, raw: string) => {
    const value = raw.trim() === '' ? null : Number(raw.replace(',', '.'));
    const next = [...draft.ingredients];
    next[index] = { ...next[index], amount: Number.isFinite(value as number) ? (value as number) : null };
    setDraft({ ...draft, ingredients: next });
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
              style={[styles.input, { fontSize: 19, fontFamily: F.display }]}
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
              <View key={i} style={styles.editIngRow}>
                <TextInput
                  value={ing.amount === null ? '' : String(ing.amount)}
                  onChangeText={(t) => setAmount(i, t)}
                  placeholder="—"
                  placeholderTextColor={C.faint}
                  keyboardType="decimal-pad"
                  style={[styles.input, styles.amountInput]}
                  accessibilityLabel={`Amount for ${ing.displayName}`}
                />
                <View style={{ flex: 1 }}>
                  <Body numberOfLines={1}>{ing.displayName}</Body>
                  <Dim>{ing.catalogItemId ? 'matched to catalog' : 'free text'}</Dim>
                </View>
                <Pressable
                  onPress={() =>
                    setDraft({
                      ...draft,
                      ingredients: draft.ingredients.filter((_, j) => j !== i),
                    })
                  }
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${ing.displayName}`}
                >
                  <Text style={styles.remove}>✕</Text>
                </Pressable>
              </View>
            ))}

            <TextInput
              value={ingQuery}
              onChangeText={setIngQuery}
              placeholder="Add an ingredient"
              placeholderTextColor={C.faint}
              style={[styles.input, { marginTop: S.sm }]}
              accessibilityLabel="Add an ingredient"
            />
            {suggestions.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => addIngredient(s.name, s.id)}
                style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
              >
                <Text style={{ fontSize: 16 }}>{s.icon}</Text>
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
              <View key={i} style={styles.editIngRow}>
                <Text style={styles.stepNum}>{String(i + 1).padStart(2, '0')}</Text>
                <Body style={{ flex: 1 }}>{s}</Body>
                <Pressable
                  onPress={() => setDraft({ ...draft, steps: draft.steps.filter((_, j) => j !== i) })}
                  hitSlop={10}
                  accessibilityRole="button"
                >
                  <Text style={styles.remove}>✕</Text>
                </Pressable>
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.sm }}>
              <TextInput
                value={stepText}
                onChangeText={setStepText}
                placeholder="Add a step"
                placeholderTextColor={C.faint}
                style={[styles.input, { flex: 1 }]}
                accessibilityLabel="Add a step"
                onSubmitEditing={() => {
                  if (!stepText.trim()) return;
                  setDraft({ ...draft, steps: [...draft.steps, stepText.trim()] });
                  setStepText('');
                }}
              />
              <GhostButton
                label="Add"
                color={C.lime}
                onPress={() => {
                  if (!stepText.trim()) return;
                  setDraft({ ...draft, steps: [...draft.steps, stepText.trim()] });
                  setStepText('');
                }}
                style={{ paddingHorizontal: S.lg, justifyContent: 'center' }}
              />
            </View>

            <Label style={{ marginTop: S.lg }}>Garnish</Label>
            <TextInput
              value={draft.garnish ?? ''}
              onChangeText={(t) => setDraft({ ...draft, garnish: t || null })}
              placeholder="Optional"
              placeholderTextColor={C.faint}
              style={styles.input}
              accessibilityLabel="Garnish"
            />

            <View style={{ marginTop: S.xl, marginBottom: S.xxl }}>
              <PrimaryButton
                label="Save recipe"
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
  scroll: { padding: S.lg, paddingTop: S.xl, paddingBottom: 140, gap: S.md },
  filterRow: { flexDirection: 'row', gap: S.sm },
  actions: { flexDirection: 'row', gap: S.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.sm },
  card: {
    width: '48.5%',
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.glass,
    padding: S.md,
    gap: 5,
    minHeight: 132,
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    opacity: 0.16,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBadge: { color: C.faint, fontSize: 8.5, fontWeight: '800', letterSpacing: 1 },
  star: { color: C.amber, fontSize: 13 },
  cardName: { color: C.text, fontFamily: F.display, fontSize: 17, lineHeight: 21 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 'auto' },
  pourDot: { width: 6, height: 6, borderRadius: 3 },
  pourText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  made: { color: C.faint, fontSize: 10 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.panel,
    borderTopLeftRadius: R.lg,
    borderTopRightRadius: R.lg,
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
    justifyContent: 'space-between', marginBottom: S.md, gap: S.md,
  },
  close: { color: C.lime, fontWeight: '700', fontSize: 14, paddingTop: 4 },
  ingRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  dot: { width: 5, height: 5, borderRadius: 3 },
  missing: { color: C.amber, fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  stepRow: { flexDirection: 'row', gap: S.md },
  stepNum: { color: C.faint, fontSize: 11, fontWeight: '700', paddingTop: 4, width: 20 },
  input: {
    backgroundColor: C.ink2,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    color: C.text,
    paddingHorizontal: S.md,
    paddingVertical: 11,
    fontSize: 15,
    marginTop: S.sm,
  },
  amountInput: { width: 64, textAlign: 'center', marginTop: 0 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: S.sm },
  editIngRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  remove: { color: C.faint, fontSize: 15, paddingHorizontal: 4 },
  suggestion: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingVertical: 11, paddingHorizontal: S.md,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  matchTag: { color: C.lime, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
});
