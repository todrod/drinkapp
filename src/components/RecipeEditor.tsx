import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { CATALOG } from '../data/catalog';
import type { DrinkRecipe, Method, RecipeIngredient, Role, Unit } from '../types';
import { C, F, R } from '../theme';
import { isAlcoholFree, recipeIssues, roleForCatalog } from '../logic/recipes';
import { isCarbonated } from '../logic/hosting';
import { Body, Chip, Dim, GhostButton, Label, Panel, PrimaryButton } from './ui';
import { Sheet } from './Sheet';

const UNITS: Unit[] = ['oz', 'ml', 'tsp', 'dash', 'piece', 'splash', 'top', 'part'];
const ROLES: Role[] = ['base', 'mixer', 'modifier', 'sweetener', 'garnish', 'ice'];
export function RecipeEditor({ recipe, onClose, onSave }: { recipe: DrinkRecipe; onClose: () => void; onSave: (r: DrinkRecipe) => void }) {
  const [draft, setDraft] = useState(() => ({ ...recipe, ingredients: recipe.ingredients.map((i) => ({ ...i })) }));
  const [amounts, setAmounts] = useState(() => recipe.ingredients.map((i) => i.amount === null ? '' : String(i.amount)));
  const [ingQuery, setIngQuery] = useState('');
  const [steps, setSteps] = useState(recipe.steps.join('\n'));
  const [unitIndex, setUnitIndex] = useState<number | null>(null);
  const [roleIndex, setRoleIndex] = useState<number | null>(null);
  const resolved: DrinkRecipe = { ...draft, steps: steps.split('\n').map((s) => s.trim()).filter(Boolean) };
  const invalidAmount = amounts.some((a) => a.trim() && (!Number.isFinite(Number(a.replace(',', '.'))) || Number(a.replace(',', '.')) <= 0));
  const issues = recipeIssues(resolved);
  const suggestions = ingQuery.trim() ? CATALOG.filter((c) => c.name.toLowerCase().includes(ingQuery.trim().toLowerCase()) && !['glass', 'tool', 'vibe'].includes(c.category)).slice(0, 5) : [];
  const changeIngredient = (index: number, patch: Partial<RecipeIngredient>) => setDraft((prev) => ({ ...prev, ingredients: prev.ingredients.map((i, n) => n === index ? { ...i, ...patch } : i) }));
  const addIngredient = (name: string, id: string | null) => {
    setDraft((prev) => ({ ...prev, ingredients: [...prev.ingredients, { catalogItemId: id, displayName: name, amount: null, unit: 'oz', role: roleForCatalog(id), isOptional: false, alcohol: 'unknown' }] }));
    setAmounts((prev) => [...prev, '']); setIngQuery('');
  };
  return <Sheet title={recipe.name ? 'Edit recipe' : 'New recipe'} eyebrow="Your recipe notebook" onClose={onClose} closeLabel="Cancel">
    <Label>Name</Label><TextInput autoFocus={!recipe.name} value={draft.name} maxLength={100} accessibilityLabel="Recipe name" placeholder="What do you call it?" placeholderTextColor={C.faint} style={styles.input} onChangeText={(name) => setDraft({ ...draft, name })} />
    <Label>Method</Label><View style={styles.wrap}>{(['build', 'shake', 'stir', 'blend', 'muddle'] as Method[]).map((method) => <Chip key={method} label={method} active={draft.method === method} onPress={() => setDraft({ ...draft, method })} />)}</View>
    {draft.method === 'shake' && draft.ingredients.some(isCarbonated) ? <Dim style={{ color: C.text }}>Shake only the still ingredients. Write a separate step to add bubbles after shaking.</Dim> : null}
    <Label>Ingredients & measures</Label>
    {draft.ingredients.map((ing, index) => <Panel key={index} style={{ gap: 10 }}>
      <View style={styles.row}><Body style={{ flex: 1 }}>{ing.displayName}</Body><GhostButton label="Remove" accessibilityLabel={`Remove ${ing.displayName}`} onPress={() => {
        setDraft({ ...draft, ingredients: draft.ingredients.filter((_, n) => n !== index) }); setAmounts(amounts.filter((_, n) => n !== index)); setUnitIndex(null); setRoleIndex(null);
      }} /></View>
      <View style={styles.row}>
        <TextInput value={amounts[index] ?? ''} accessibilityLabel={`Amount for ${ing.displayName}`} keyboardType="decimal-pad" placeholder="Amount" placeholderTextColor={C.faint} style={[styles.input, { flex: 1, minWidth: 72 }]} onChangeText={(text) => {
          setAmounts((prev) => prev.map((a, n) => n === index ? text : a));
          const n = text.trim() ? Number(text.replace(',', '.')) : null;
          changeIngredient(index, { amount: n !== null && Number.isFinite(n) ? n : null });
        }} />
        <GhostButton label={`${ing.unit} ▾`} onPress={() => setUnitIndex(unitIndex === index ? null : index)} />
        <GhostButton label={`${ing.role} ▾`} onPress={() => setRoleIndex(roleIndex === index ? null : index)} />
      </View>
      {unitIndex === index ? <View style={styles.wrap}>{UNITS.map((unit) => <Chip key={unit} label={unit} active={ing.unit === unit} onPress={() => { changeIngredient(index, { unit }); setUnitIndex(null); }} />)}</View> : null}
      {roleIndex === index ? <View style={styles.wrap}>{ROLES.map((role) => <Chip key={role} label={role} active={ing.role === role} onPress={() => { changeIngredient(index, { role }); setRoleIndex(null); }} />)}</View> : null}
      <View style={styles.wrap}><Chip label="Optional" active={ing.isOptional} onPress={() => changeIngredient(index, { isOptional: !ing.isOptional })} /></View>
      {!ing.catalogItemId ? <View style={{ gap: 10 }}><Dim>Does this ingredient contain alcohol?</Dim><View style={styles.wrap}>
        {(['unknown', 'none', 'contains'] as const).map((alcohol) => <Chip key={alcohol} label={alcohol === 'none' ? 'No alcohol' : alcohol === 'contains' ? 'Contains alcohol' : 'Not sure'} active={(ing.alcohol ?? 'unknown') === alcohol} onPress={() => changeIngredient(index, { alcohol })} />)}
      </View></View> : null}
    </Panel>)}
    <TextInput value={ingQuery} onChangeText={setIngQuery} maxLength={100} accessibilityLabel="Add an ingredient" placeholder="Add an ingredient" placeholderTextColor={C.faint} style={styles.input} />
    {suggestions.map((s) => <Pressable key={s.id} accessibilityRole="button" accessibilityLabel={`Add ${s.name}`} onPress={() => addIngredient(s.name, s.id)} style={styles.suggestion}><Body>{s.name}</Body><Dim>Catalog match</Dim></Pressable>)}
    {ingQuery.trim() ? <GhostButton label={`Add “${ingQuery.trim()}” as free text`} onPress={() => addIngredient(ingQuery.trim(), null)} /> : null}
    <Label>Steps · one per line</Label><TextInput multiline value={steps} onChangeText={setSteps} accessibilityLabel="Mixing steps" placeholder="Add your mixing steps, one per line" placeholderTextColor={C.faint} style={[styles.input, { minHeight: 140, textAlignVertical: 'top' }]} />
    <Label>Glass & garnish</Label><TextInput value={draft.glass?.replace('gl-', '') ?? ''} onChangeText={(glass) => setDraft({ ...draft, glass: glass || null })} accessibilityLabel="Serving glass" placeholder="Glass (optional)" placeholderTextColor={C.faint} style={styles.input} />
    <TextInput value={draft.garnish ?? ''} onChangeText={(garnish) => setDraft({ ...draft, garnish: garnish || null })} accessibilityLabel="Garnish" placeholder="Garnish (optional)" placeholderTextColor={C.faint} style={styles.input} />
    <View accessibilityLiveRegion="polite" style={{ gap: 8 }}>
      {invalidAmount ? <Body style={{ color: C.text }}>Enter a positive number for each filled amount.</Body> : null}
      {issues.length ? <Dim>Draft · {issues.join(' ')} Drafts stay in your notebook until ready to serve.</Dim> : <Dim style={{ color: C.text }}>Ready for serving and party planning.</Dim>}
      <Dim>{isAlcoholFree(resolved) ? 'Confirmed alcohol-free ingredients.' : 'Contains alcohol or an ingredient with unknown alcohol content.'}</Dim>
    </View>
    <PrimaryButton label={issues.length ? 'Save draft' : 'Save recipe'} disabled={!draft.name.trim() || invalidAmount} onPress={() => onSave({ ...resolved, name: draft.name.trim(), isZeroProof: isAlcoholFree(resolved) })} />
  </Sheet>;
}
const styles = StyleSheet.create({
  input: { backgroundColor: C.ink, color: C.text, borderColor: C.line2, borderWidth: 1, borderRadius: R.sm, minHeight: 48, padding: 12, fontSize: 16, fontFamily: F.regular },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  suggestion: { padding: 12, minHeight: 48, backgroundColor: C.panel, borderRadius: R.sm, gap: 4 },
});
