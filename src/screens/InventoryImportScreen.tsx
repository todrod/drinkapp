import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useData } from '../store';
import { C, F, R } from '../theme';
import { CATALOG_BY_ID } from '../data/catalog';
import { pickInventoryFile } from '../inventoryFiles';
import { inventoryNameKey } from '../logic/inventory';
import { MAX_INVENTORY_FILE_BYTES, parseInventoryList, type InventoryPreview } from '../logic/inventoryImport';
import { InventoryItemForm } from '../components/InventoryItemForm';
import { Sheet } from '../components/Sheet';
import { Body, Dim, GhostButton, Heading, Label, Panel, PrimaryButton } from '../components/ui';

export function InventoryImportScreen({ onClose, onImported }: { onClose: () => void; onImported: (message: string) => void }) {
  const { profile, kit, importInventory, storageError } = useData();
  const [text, setText] = useState('');
  const [filename, setFilename] = useState('Pasted list');
  const [preview, setPreview] = useState<InventoryPreview | null>(null);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<number | null>(null);
  const [limit, setLimit] = useState(40);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const owned = useMemo(() => new Set(kit.map((item) => inventoryNameKey(item.name))), [kit]);
  const selected = preview?.rows.filter((row, index) => !excluded.has(index) && !owned.has(inventoryNameKey(row.name))) ?? [];
  const showPreview = (source: string, name: string) => {
    const parsed = parseInventoryList(source);
    setPreview(parsed); setFilename(name); setExcluded(new Set()); setEditing(null); setLimit(40); setError('');
  };
  const chooseFile = async () => {
    setBusy(true); setError('');
    try {
      const file = await pickInventoryFile();
      if (file && mounted.current) showPreview(file.text, file.name);
    } catch (problem) { if (mounted.current) setError(problem instanceof Error ? problem.message : 'Couldn’t read this file.'); }
    finally { if (mounted.current) setBusy(false); }
  };
  return <Sheet title={editing === null ? 'Import inventory' : 'Review imported item'} eyebrow={`Add to ${profile.name}`} onClose={onClose}>
    {editing !== null && preview ? <InventoryItemForm key={editing} initial={preview.rows[editing]} saveLabel="Save preview changes" onCancel={() => setEditing(null)} onSave={(draft) => {
      if (preview.rows.some((row, index) => index !== editing && inventoryNameKey(row.name) === inventoryNameKey(draft.name))) throw new Error('Another row in this list already has that name.');
      setPreview({ ...preview, rows: preview.rows.map((row, index) => index === editing ? draft : row) }); setEditing(null);
    }} /> : <>
      {!preview ? <>
        <Heading>Bring your list, build your bar</Heading>
        <Body>Choose a CSV, TXT/TSV or JSON file, or paste your list below. Everything is read on this device.</Body>
        <Dim>One item per line works. For a spreadsheet, export CSV with a Name column; Category, Level and Brand are optional. Up to 500 items and 1 MB per import.</Dim>
        <GhostButton label={busy ? 'Reading inventory file…' : 'Choose inventory file'} disabled={busy} onPress={() => { void chooseFile(); }} />
        <Label>Or paste your inventory list</Label>
        <TextInput accessibilityLabel="Paste inventory list" multiline value={text} maxLength={MAX_INVENTORY_FILE_BYTES} onChangeText={setText} editable={!busy} placeholder={'Gin\nLime juice\nSimple syrup'} placeholderTextColor={C.faint} style={styles.input} />
        <PrimaryButton label="Preview list" disabled={busy || !text.trim()} onPress={() => { try { showPreview(text, 'Pasted list'); } catch (problem) { setError(problem instanceof Error ? problem.message : 'Couldn’t read this list.'); } }} />
        <Dim>For Excel files, save a CSV copy first. Photos and PDFs aren’t supported. A Shaker backup imports inventory only here; full-bar restore is in local backups.</Dim>
      </> : <>
        <Heading>Review before adding</Heading>
        <Body>{filename} · {preview.rows.length} unique items · {selected.length} selected</Body>
        <Dim>Existing names are skipped. Separate named bottles can share a recipe type. Use Edit to correct names, stock levels or a type match.</Dim>
        {preview.duplicateCount ? <Dim>{preview.duplicateCount} repeated names were skipped in this list.</Dim> : null}
        {preview.issues.length ? <Panel><Heading>Check these rows</Heading>{preview.issues.slice(0, 12).map((issue, index) => <Dim key={index}>{issue}</Dim>)}{preview.issues.length > 12 ? <Dim>And {preview.issues.length - 12} more row warnings. Correct the source list if needed.</Dim> : null}</Panel> : null}
        {preview.rows.slice(0, limit).map((row, index) => {
          const exists = owned.has(inventoryNameKey(row.name)); const included = !exists && !excluded.has(index);
          const catalog = row.catalogItemId ? CATALOG_BY_ID[row.catalogItemId] : null;
          return <Panel key={index}>
            <Heading>{row.name}</Heading>
            <Dim>{catalog ? `Recipe type: ${catalog.name}` : 'Custom item · choose a type for recipe matching'} · {row.level === 'out' ? 'Out of stock' : row.level}</Dim>
            {exists ? <Body>Already in your inventory · skipped</Body> : null}
            <View style={styles.actions}>
              <Pressable accessibilityRole="checkbox" accessibilityLabel={`Include ${row.name}`} accessibilityState={{ checked: included, disabled: exists }} aria-checked={included} aria-disabled={exists} disabled={exists} style={[styles.include, included && { backgroundColor: C.accentDeep }]} onPress={() => setExcluded((old) => { const next = new Set(old); next.has(index) ? next.delete(index) : next.add(index); return next; })}>
                <Body>{exists ? 'Already added' : included ? 'Included' : 'Skipped'}</Body>
              </Pressable>
              <GhostButton label="Edit" accessibilityLabel={`Edit ${row.name}`} onPress={() => setEditing(index)} />
            </View>
          </Panel>;
        })}
        {preview.rows.length > limit ? <GhostButton label="Show more imported items" onPress={() => setLimit(limit + 40)} /> : null}
        {storageError ? <Body accessibilityRole="alert">Resolve the device storage warning before importing.</Body> : null}
        <PrimaryButton label={`Add ${selected.length} ${selected.length === 1 ? 'item' : 'items'} to inventory`} disabled={!selected.length || !!storageError} onPress={() => {
          try {
            const result = importInventory(selected);
            onImported(`Added ${result.added} ${result.added === 1 ? 'item' : 'items'} to ${profile.name}.${result.skipped ? ` Skipped ${result.skipped} duplicate names.` : ''}`);
          } catch (problem) { setError(problem instanceof Error ? problem.message : 'Couldn’t save the imported list.'); }
        }} />
        <GhostButton label="Choose a different list" onPress={() => { setPreview(null); setError(''); }} />
      </>}
      {error ? <Body accessibilityRole="alert">{error}</Body> : null}
    </>}
  </Sheet>;
}
const styles = StyleSheet.create({
  input: { minHeight: 170, textAlignVertical: 'top', borderWidth: 1, borderColor: C.line2, borderRadius: R.md, color: C.text, backgroundColor: C.ink, fontFamily: F.regular, fontSize: 17, lineHeight: 26, padding: 14 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 12 },
  include: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 14, borderRadius: R.pill, borderWidth: 1, borderColor: C.line2 },
});
