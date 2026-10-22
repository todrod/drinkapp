import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useData } from '../store';
import { C, F, R } from '../theme';
import { parseBackup, type ParsedBackup } from '../logic/backup';
import { MAX_PROFILES } from '../logic/localProfiles';
import { LOCAL_STORAGE_KIND, persistentStorageState, requestPersistentStorage, pickBackupFile, saveBackupFile, shareBackupFile } from '../localBackupFiles';
import { Body, Dim, GhostButton, Heading, Label, Panel, PrimaryButton } from '../components/ui';
import { Sheet } from '../components/Sheet';

export function LocalBarsScreen({ onClose }: { onClose: () => void }) {
  const { profile, profiles, kit, recipes, shopping, createLocalBar, switchLocalBar, renameLocalBar, backupLocalBar, restoreLocalBar, storageError, retryDeviceSave } = useData();
  const [name, setName] = useState(profile.name);
  const [newName, setNewName] = useState('');
  const [preview, setPreview] = useState<{ text: string; parsed: ParsedBackup } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [backupUri, setBackupUri] = useState<string | null>(null);
  const [persistent, setPersistent] = useState<boolean | null>(null);
  const mounted = useRef(true);
  const running = useRef(false);
  useEffect(() => { mounted.current = true; persistentStorageState().then((v) => { if (mounted.current) setPersistent(v); }); return () => { mounted.current = false; }; }, []);
  const action = async (fn: () => void | Promise<void>) => {
    if (running.current) return;
    running.current = true;
    setBusy(true); setError(''); setMessage('');
    try { await fn(); } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'That action could not be completed. Please try again.'); }
    finally { running.current = false; if (mounted.current) setBusy(false); }
  };
  return <Sheet title="Your bars, on your device" eyebrow="Personal by default" onClose={onClose} status={error ? <Body accessibilityRole="alert" accessibilityLiveRegion="assertive" style={{ color: C.text }}>{error}</Body> : message ? <Body accessibilityLiveRegion="polite" style={{ color: C.text }}>{message}</Body> : undefined}>
    <Panel raised style={{ gap: 12 }}>
      <Label color={C.text}>{LOCAL_STORAGE_KIND === 'phone' ? 'Saved on this phone' : 'Saved in this browser'}</Label>
      <Heading>{profile.name}</Heading><Body>{kit.length} stock items · {recipes.length} recipes · {shopping.length} shopping items</Body>
      <Dim>Your inventory, favorites, recipes and party plans are kept locally. Drink Shaker doesn’t upload them to a storage server or require an account.</Dim>
    </Panel>
    {storageError ? <Panel accent={C.amber} style={{ gap: 12 }}><Body style={{ color: C.text }}>{storageError}</Body><PrimaryButton label="Retry saving on this device" disabled={busy} onPress={() => action(() => { retryDeviceSave(); setMessage('Your current bar was saved on this device.'); })} /></Panel> : null}
    <Label>Rename this bar</Label>
    <TextInput value={name} onChangeText={setName} maxLength={60} accessibilityLabel="Local bar name" placeholder="e.g. Alex’s home bar" placeholderTextColor={C.faint} style={styles.input} editable={!busy} />
    <PrimaryButton label="Save bar name" disabled={busy || !name.trim() || name.trim() === profile.name} onPress={() => action(() => { renameLocalBar(name); setMessage('Bar name saved on this device.'); })} />
    <Heading>Local bars</Heading><Dim>Like individual folders, each bar keeps its own stock, favorites, shopping list and party menu. These are separate setups on this device, without passwords or sign-in.</Dim>
    {profiles.map((p) => <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`${p.name}${p.id === profile.id ? ', current local bar' : ', switch to local bar'}`} accessibilityState={{ selected: p.id === profile.id, disabled: busy || p.id === profile.id }} aria-pressed={p.id === profile.id} aria-disabled={busy || p.id === profile.id} disabled={busy || p.id === profile.id} onPress={() => action(() => switchLocalBar(p.id))} style={[styles.bar, p.id === profile.id && { borderColor: C.teal }]}>
      <View style={styles.initial}><Text style={styles.initialText}>{p.name[0]?.toUpperCase()}</Text></View><Body style={{ flex: 1 }}>{p.name}</Body><Dim style={{ color: C.text }}>{p.id === profile.id ? 'Current' : 'Open →'}</Dim>
    </Pressable>)}
    <Label>Start another bar</Label><TextInput value={newName} onChangeText={setNewName} maxLength={60} accessibilityLabel="New local bar name" placeholder="e.g. Patio bar or Vacation kit" placeholderTextColor={C.faint} style={styles.input} editable={!busy} />
    <PrimaryButton label="Create a new local bar" disabled={busy || !newName.trim() || profiles.length >= MAX_PROFILES || !!storageError} onPress={() => action(() => createLocalBar(newName))} />
    <Dim>New bars start with an empty inventory and the recipe library. The bar you’re using now stays saved.</Dim>
    <Heading>Keep a backup you control</Heading><Dim>Export this bar to a JSON file. Keep a copy in Files or Downloads to move it to another phone or restore after reinstalling the app or clearing browser data.</Dim>
    <PrimaryButton label="Export this bar to a backup file" disabled={busy} onPress={() => action(async () => {
      const result = await saveBackupFile(backupLocalBar(), profile.name, profile.id);
      if (mounted.current) { setBackupUri(result.uri ?? null); setMessage(result.message); }
    })} />
    {backupUri ? <GhostButton label="Save a copy to Files or another app" disabled={busy} onPress={() => action(() => shareBackupFile(backupUri))} /> : null}
    <GhostButton label="Import a backup file" disabled={busy} onPress={() => action(async () => {
      const text = await pickBackupFile();
      if (text !== null && mounted.current) setPreview({ text, parsed: parseBackup(text) });
    })} />
    {preview ? <Panel accent={C.teal} style={{ gap: 12 }}><Label color={C.text}>Ready to restore</Label><Heading>{preview.parsed.name}</Heading>
      <Body>{preview.parsed.data.kit.length} stock items · {preview.parsed.data.recipes.length} recipes · {preview.parsed.data.shopping.length} shopping items</Body>
      <Dim>Backup from {new Date(preview.parsed.exportedAt).toLocaleDateString()}. Restoring creates a new local bar and opens it. Your existing bars stay saved.</Dim>
      <PrimaryButton label="Restore as a new local bar" disabled={busy || !!storageError || profiles.length >= MAX_PROFILES} onPress={() => action(() => restoreLocalBar(preview.text))} />
      <GhostButton label="Cancel import" disabled={busy} onPress={() => setPreview(null)} />
    </Panel> : null}
    {LOCAL_STORAGE_KIND === 'browser' ? <Panel style={{ gap: 12 }}><Label>Browser storage</Label><Body>{persistent ? 'Persistent browser storage is enabled.' : 'This browser controls how long its local storage is kept.'}</Body>
      <Dim>Each browser and installed app has its own bars. Clearing site data removes browser bars; backup files let you bring them back.</Dim>
      {!persistent ? <GhostButton label="Request persistent browser storage" disabled={busy} onPress={() => action(async () => {
        const value = await requestPersistentStorage();
        if (mounted.current) { setPersistent(value); setMessage(value ? 'Persistent storage enabled. Keep a backup file as well.' : 'This browser manages storage automatically. Keep a backup file for reliable recovery.'); }
      })} /> : null}
    </Panel> : null}
    {profiles.length >= MAX_PROFILES ? <Dim>You have reached the limit of {MAX_PROFILES} local bars.</Dim> : null}
  </Sheet>;
}
const styles = StyleSheet.create({
  input: { minHeight: 50, padding: 13, borderWidth: 1, borderColor: C.line2, borderRadius: R.sm, backgroundColor: C.ink, color: C.text, fontSize: 16, fontFamily: F.regular },
  bar: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 72, padding: 14, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line2, borderRadius: R.md },
  initial: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: C.raise },
  initialText: { fontFamily: F.semibold, color: C.text, fontSize: 19 },
});
