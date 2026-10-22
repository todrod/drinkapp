import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { C, F, R } from '../theme';
import { CATEGORIES, CATEGORY_LABEL, LEVELS } from '../types';
import { CATALOG, CATALOG_BY_ID } from '../data/catalog';
import { inventoryNameKey, validateInventoryDraft, type InventoryDraft } from '../logic/inventory';
import { Body, Chip, Dim, GhostButton, Label, PrimaryButton } from './ui';

export function InventoryItemForm({ initial, onSave, onCancel, saveLabel = 'Save item' }: {
  initial: InventoryDraft; onSave: (draft: InventoryDraft) => void; onCancel: () => void; saveLabel?: string;
}) {
  const [draft, setDraft] = useState(initial);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const catalog = draft.catalogItemId ? CATALOG_BY_ID[draft.catalogItemId] : null;
  const matches = useMemo(() => {
    const key = inventoryNameKey(query);
    return key ? CATALOG.filter((item) => inventoryNameKey(item.name).includes(key)).slice(0, 10) : [];
  }, [query]);
  return <View style={{ gap: 14 }}>
    <Label>Item name</Label>
    <TextInput accessibilityLabel="Inventory item name" value={draft.name} maxLength={120} onChangeText={(name) => setDraft({ ...draft, name })} style={styles.input} />
    <Label>Brand (optional)</Label>
    <TextInput accessibilityLabel="Inventory item brand" value={draft.brand ?? ''} maxLength={120} onChangeText={(brand) => setDraft({ ...draft, brand })} placeholder="e.g. Tanqueray" placeholderTextColor={C.faint} style={styles.input} />
    <Label>Remaining stock</Label>
    <View style={styles.wrap}>{LEVELS.map((level) => <Chip key={level} label={level === 'out' ? 'Out of stock' : level[0].toUpperCase() + level.slice(1)} active={draft.level === level} onPress={() => setDraft({ ...draft, level })} />)}</View>
    <Label>Recipe matching</Label>
    <Body>{catalog ? `Used as ${catalog.name} in recipes` : 'Custom item · no catalog type linked'}</Body>
    <Dim>Keep your bottle’s name and choose what it can replace in a recipe. An out-of-stock item won’t count as available.</Dim>
    {catalog ? <GhostButton label="Use as a custom item" onPress={() => setDraft({ ...draft, catalogItemId: null })} /> : null}
    <TextInput accessibilityLabel="Find inventory recipe type" value={query} onChangeText={setQuery} placeholder="Find a type, e.g. gin or lime juice" placeholderTextColor={C.faint} style={styles.input} />
    {matches.map((item) => <GhostButton key={item.id} label={`Use ${item.name}`} onPress={() => { setDraft({ ...draft, catalogItemId: item.id, category: item.category }); setQuery(''); }} />)}
    {query.trim() && !matches.length ? <Dim>No matching type. You can keep this as a custom item.</Dim> : null}
    <Label>Category</Label>
    {catalog ? <Body>{CATEGORY_LABEL[catalog.category]}</Body> : <View style={styles.wrap}>{CATEGORIES.map((category) => <Chip key={category} label={CATEGORY_LABEL[category]} active={draft.category === category} onPress={() => setDraft({ ...draft, category })} />)}</View>}
    {error ? <Body accessibilityRole="alert">{error}</Body> : null}
    <PrimaryButton label={saveLabel} onPress={() => {
      try { onSave(validateInventoryDraft(draft)); } catch (problem) { setError(problem instanceof Error ? problem.message : 'Couldn’t save this item.'); }
    }} />
    <GhostButton label="Cancel editing" onPress={onCancel} />
  </View>;
}
const styles = StyleSheet.create({
  input: { minHeight: 50, borderWidth: 1, borderColor: C.line2, borderRadius: R.md, padding: 13, color: C.text, backgroundColor: C.ink, fontFamily: F.regular, fontSize: 17 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
