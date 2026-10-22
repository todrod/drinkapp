import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useData } from '../store';
import { C, F, R } from '../theme';
import type { InventoryItem } from '../types';
import { draftFor, inventoryNameKey } from '../logic/inventory';
import { InventoryItemForm } from '../components/InventoryItemForm';
import { Sheet } from '../components/Sheet';
import { Body, Dim, GhostButton, Heading, Panel, PrimaryButton } from '../components/ui';

export function InventoryManageScreen({ onClose, onRemoved, undoCount, onUndo, initialId = null }: {
  onClose: () => void; onRemoved: (items: InventoryItem[]) => void; undoCount: number; onUndo: () => void; initialId?: string | null;
}) {
  const { profile, kit, editInventoryItem, removeInventoryItems, storageError } = useData();
  const [editingId, setEditingId] = useState(initialId);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmClear, setConfirmClear] = useState(false);
  const [limit, setLimit] = useState(40);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const editing = kit.find((item) => item.id === editingId);
  const shown = useMemo(() => kit.filter((item) => inventoryNameKey(item.name + ' ' + (item.brand ?? '')).includes(inventoryNameKey(query))), [kit, query]);
  const selectedIds = kit.filter((item) => selected.has(item.id)).map((item) => item.id);
  const remove = (ids: string[]) => {
    try {
      const removed = removeInventoryItems(ids);
      onRemoved(removed); setSelected(new Set()); setConfirmClear(false); setEditingId(null); setError('');
      setNotice(`Removed ${removed.length} ${removed.length === 1 ? 'item' : 'items'}. You can undo below.`);
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Couldn’t remove these items.'); }
  };
  const undo = () => { try { onUndo(); setNotice('Inventory restored.'); setError(''); } catch (problem) { setError(problem instanceof Error ? problem.message : 'Couldn’t restore these items.'); } };
  return <Sheet title={editing ? 'Edit ingredient' : 'Edit inventory'} eyebrow={profile.name} onClose={onClose}>
    {editing ? <>
      <InventoryItemForm key={editing.id} initial={draftFor(editing)} onCancel={() => setEditingId(null)} onSave={(draft) => { editInventoryItem(editing.id, draft); setEditingId(null); setNotice('Item saved.'); }} />
      <GhostButton label={`Remove ${editing.name}`} onPress={() => remove([editing.id])} disabled={!!storageError} />
    </> : <>
      <Body>Edit names, brands, recipe types and stock levels. Select items to remove several at once.</Body>
      <TextInput accessibilityLabel="Search inventory to edit" value={query} onChangeText={(value) => { setQuery(value); setLimit(40); }} placeholder="Find an item" placeholderTextColor={C.faint} style={styles.input} />
      <Dim>{shown.length} items shown · {selectedIds.length} selected</Dim>
      <View style={styles.actions}>
        <GhostButton label={`Select ${query.trim() ? 'matching' : 'all'} ${shown.length} items`} disabled={!shown.length} onPress={() => setSelected(new Set([...selected, ...shown.map((item) => item.id)]))} />
        {selectedIds.length ? <GhostButton label="Deselect all" onPress={() => setSelected(new Set())} /> : null}
      </View>
      {selectedIds.length ? <PrimaryButton label={`Remove ${selectedIds.length} selected ${selectedIds.length === 1 ? 'item' : 'items'}`} disabled={!!storageError} onPress={() => remove(selectedIds)} /> : null}
      {notice ? <Body accessibilityLiveRegion="polite">{notice}</Body> : null}
      {undoCount ? <GhostButton label={`Undo removal of ${undoCount} ${undoCount === 1 ? 'item' : 'items'}`} onPress={undo} /> : null}
      {shown.slice(0, limit).map((item) => <Panel key={item.id}>
        <Pressable accessibilityRole="checkbox" accessibilityLabel={`Select ${item.name}`} accessibilityState={{ checked: selected.has(item.id) }} aria-checked={selected.has(item.id)} onPress={() => setSelected((old) => { const next = new Set(old); next.has(item.id) ? next.delete(item.id) : next.add(item.id); return next; })} style={styles.select}>
          <Body>{selected.has(item.id) ? '☑' : '☐'}</Body><View style={{ flex: 1 }}><Heading>{item.name}</Heading><Dim>{item.brand ? `${item.brand} · ` : ''}{item.level === 'out' ? 'Out of stock' : item.level}</Dim></View>
        </Pressable>
        <View style={styles.actions}><GhostButton label="Edit" accessibilityLabel={`Edit ${item.name}`} onPress={() => { setEditingId(item.id); setError(''); }} /><GhostButton label="Remove" accessibilityLabel={`Remove ${item.name}`} onPress={() => remove([item.id])} disabled={!!storageError} /></View>
      </Panel>)}
      {shown.length > limit ? <GhostButton label="Show more inventory items" onPress={() => setLimit(limit + 40)} /> : null}
      {!kit.length ? <Body>Your inventory is empty. Import a list or add ingredients from My bar.</Body> : null}
      {confirmClear ? <Panel>
        <Heading>Clear {profile.name}?</Heading>
        <Body>This removes all {kit.length} inventory items in this bar. Recipes, shopping lists and party menus stay saved.</Body>
        <Dim>You can undo while My bar stays open. Closing or switching away from My bar ends the undo option.</Dim>
        <PrimaryButton label={`Clear ${kit.length} inventory items`} disabled={!!storageError} onPress={() => remove(kit.map((item) => item.id))} />
        <GhostButton label="Cancel clearing inventory" onPress={() => setConfirmClear(false)} />
      </Panel> : <GhostButton label="Clear all inventory" disabled={!kit.length || !!storageError} onPress={() => setConfirmClear(true)} />}
    </>}
    {error ? <Body accessibilityRole="alert">{error}</Body> : null}
    {storageError ? <Body accessibilityRole="alert">Resolve the device storage warning before changing inventory.</Body> : null}
  </Sheet>;
}
const styles = StyleSheet.create({
  input: { minHeight: 50, borderWidth: 1, borderColor: C.line2, borderRadius: R.md, color: C.text, backgroundColor: C.ink, fontFamily: F.regular, fontSize: 17, padding: 13 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  select: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50 },
});
