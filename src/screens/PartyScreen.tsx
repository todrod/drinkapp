import React, { useMemo, useState } from 'react';
import { Linking, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { DrinkRecipe } from '../types';
import { C, F, R, type } from '../theme';
import { useData } from '../store';
import { buildOwned, matchRecipe } from '../logic/generator';
import { alcoholStatus, isAlcoholFree, isServingReady } from '../logic/recipes';
import { batchLineLabel, batchRecipe, MAX_MENU, menuTotals, prepAdvice, validServings } from '../logic/hosting';
import { encodeGuestMenu, menuLink } from '../logic/guestMenu';
import { defaultShareAddress } from '../guestLink';
import { Body, Chip, Dim, GhostButton, Heading, Label, Panel, PrimaryButton } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { MenuQR } from '../components/MenuQR';
import { CocktailArt } from '../components/CocktailArt';
import { accentForRecipe } from '../data/liquids';

function ServingCount({ name, text, onText, onChange }: { name: string; text: string; onText: (text: string) => void; onChange: (n: number) => void }) {
  const valid = /^\d+$/.test(text) && validServings(Number(text));
  return <View style={{ gap: 5 }}>
    <View style={styles.row}><TextInput value={text} onChangeText={(next) => {
      onText(next); const n = Number(next); const ok = /^\d+$/.test(next) && validServings(n);
      if (ok) onChange(n);
    }} keyboardType="number-pad" maxLength={4} accessibilityLabel={`Planned servings for ${name}`} aria-invalid={!valid} style={[styles.input, { width: 76 }]} /><Dim>planned servings</Dim></View>
    {!valid ? <Dim style={{ color: C.text }}>Use a whole number from 1 to 100.</Dim> : null}
  </View>;
}

export type PartyMode = 'menu' | 'batch' | 'guest';
export function PartyScreen({ onClose, onFun, onRecipe, onServe, onShopping, mode, setMode }: {
  onClose: () => void; onRecipe: (r: DrinkRecipe) => void;
  onFun: () => void;
  onServe: (r: DrinkRecipe, servings?: number, unit?: 'ml' | 'oz') => void; onShopping: () => void;
  mode: PartyMode; setMode: (mode: PartyMode) => void;
}) {
  const { party, setParty, recipes, kit, prefs, addToParty, addToShopping } = useData();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'ready' | 'zero'>('ready');
  const [limit, setLimit] = useState(8);
  const [countDrafts, setCountDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [shareAddress, setShareAddress] = useState(defaultShareAddress);
  const [showAddress, setShowAddress] = useState(false);
  const owned = useMemo(() => buildOwned(kit), [kit]);
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const selected = party.entries.flatMap((entry) => {
    const recipe = byId.get(entry.recipeId);
    return recipe && isServingReady(recipe) && (!prefs.zeroProofMode || isAlcoholFree(recipe)) ? [{ recipe, servings: entry.servings }] : [];
  });
  const unavailable = party.entries.filter((e) => !selected.some((s) => s.recipe.id === e.recipeId));
  const selectedIds = new Set(party.entries.map((e) => e.recipeId));
  const candidates = recipes.filter((r) => isServingReady(r) && !selectedIds.has(r.id) && (!prefs.zeroProofMode || isAlcoholFree(r)) &&
    (!query.trim() || `${r.name} ${r.vibeTags.join(' ')} ${r.ingredients.map((i) => i.displayName).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())) &&
    (filter === 'all' || (filter === 'zero' ? isAlcoholFree(r) : matchRecipe(r, owned, prefs.allowSubstitutes).ok)))
    .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || a.name.localeCompare(b.name));
  const totals = menuTotals(selected, party.unit);
  const missing = totals.filter((line) => !line.optional && !owned.ids.has(line.catalogItemId ?? '') && !owned.names.has(line.name.trim().toLowerCase()));
  const badCounts = selected.some(({ recipe, servings }) => {
    const text = countDrafts[recipe.id] ?? String(servings);
    return !/^\d+$/.test(text) || !validServings(Number(text));
  });
  const zeroCount = selected.filter((s) => isAlcoholFree(s.recipe)).length;
  let link = ''; let linkError = '';
  if (selected.length) {
    try { link = menuLink(shareAddress, encodeGuestMenu(party.title, selected.map((s) => s.recipe))); }
    catch (e) { linkError = e instanceof Error ? e.message : 'The menu link is unavailable.'; }
  }
  let localAddress = false;
  try { localAddress = /^(localhost|127\.|\[::1\])/.test(new URL(shareAddress).hostname); } catch { /* error shown above */ }
  const copyLink = async () => {
    try { const copied = await Clipboard.setStringAsync(link); setNotice(copied ? 'Guest link copied. Anyone with it can view this menu snapshot.' : 'Select and copy the link below.'); }
    catch { setNotice('Select and copy the link below.'); }
  };
  const remove = (id: string) => setParty({ ...party, entries: party.entries.filter((e) => e.recipeId !== id) });
  return <Sheet title="Your party, on the menu" eyebrow="The host’s corner" onClose={onClose}>
    <Dim>Choose a few signatures, include an alcohol-free option, then prep with a plan.</Dim>
    {prefs.zeroProofMode ? <Body style={{ color: C.text }}>Zero-proof mode · showing alcohol-free recipes.</Body> : null}
    <View style={styles.tabs}>{([['menu', '1 · Menu'], ['batch', '2 · Batch & shop'], ['guest', '3 · Guest QR']] as const).map(([key, label]) => <Chip key={key} label={label} active={mode === key} onPress={() => { setMode(key); setNotice(''); }} />)}</View>
    <Panel raised style={{ gap: 10 }}>
      <Label>{selected.length} signatures · {zeroCount} alcohol-free</Label>
      <TextInput accessibilityLabel="Party name" value={party.title} onChangeText={(title) => setParty({ ...party, title })} maxLength={80} placeholder="Name your gathering" placeholderTextColor={C.faint} style={styles.titleInput} />
      {!zeroCount && selected.length ? <Dim style={{ color: C.text }}>Make everyone welcome · add an alcohol-free option.</Dim> : <Dim>Keep it easy to choose: 3–5 drinks is a good place to start.</Dim>}
    </Panel>
    {unavailable.map((e) => <Panel key={e.recipeId} style={{ gap: 8 }}><Dim>{byId.get(e.recipeId)?.name ?? 'Deleted recipe'} · {byId.has(e.recipeId) ? 'hidden by zero-proof mode or incomplete' : 'no longer in your recipe book'}.</Dim><GhostButton label={`Remove ${byId.get(e.recipeId)?.name ?? 'unavailable recipe'} from menu`} onPress={() => remove(e.recipeId)} /></Panel>)}
    {mode === 'menu' ? <>
      {selected.map(({ recipe, servings }) => <Panel key={recipe.id} style={{ gap: 12 }}>
        <View style={styles.row}>
          <CocktailArt color={accentForRecipe(recipe)} glass={recipe.glass} size={56} />
          <View style={{ flex: 1 }}><Heading>{recipe.name}</Heading><Dim style={isAlcoholFree(recipe) ? { color: C.text } : undefined}>{isAlcoholFree(recipe) ? 'Alcohol-free' : alcoholStatus(recipe) === 'contains' ? 'Contains alcohol' : 'Alcohol content unconfirmed'} · {recipe.method}</Dim></View>
          <Pressable onPress={() => remove(recipe.id)} accessibilityRole="button" accessibilityLabel={`Remove ${recipe.name} from menu`} style={styles.remove}><Body>×</Body></Pressable>
        </View>
        <ServingCount name={recipe.name} text={countDrafts[recipe.id] ?? String(servings)} onText={(text) => setCountDrafts((prev) => ({ ...prev, [recipe.id]: text }))} onChange={(n) => setParty({ ...party, entries: party.entries.map((e) => e.recipeId === recipe.id ? { ...e, servings: n } : e) })} />
        <Dim>{matchRecipe(recipe, owned, false).ok ? 'Ingredients on hand as written · check bottle quantities.' : `As written, needs: ${matchRecipe(recipe, owned, false).missing.join(', ')}`}</Dim>
        <View style={styles.row}><GhostButton label="View recipe" accessibilityLabel={`Recipe · ${recipe.name}`} onPress={() => onRecipe(recipe)} style={{ flex: 1 }} /><GhostButton label="Serve one" accessibilityLabel={`Serve · ${recipe.name}`} onPress={() => onServe(recipe, 1, party.unit)} style={{ flex: 1 }} /></View>
      </Panel>)}
      <Heading>{selected.length ? 'Add another signature' : 'What’s on the menu?'}</Heading>
      <View style={styles.tabs}>
        <Chip label="From my bar" active={filter === 'ready'} onPress={() => { setFilter('ready'); setLimit(8); }} />
        <Chip label="Alcohol-free" active={filter === 'zero'} onPress={() => { setFilter('zero'); setLimit(8); }} />
        <Chip label="All recipes" active={filter === 'all'} onPress={() => { setFilter('all'); setLimit(8); }} />
      </View>
      <TextInput value={query} onChangeText={(text) => { setQuery(text); setLimit(8); }} accessibilityLabel="Search drinks for the party menu" placeholder="Search a drink, ingredient or mood" placeholderTextColor={C.faint} style={styles.input} />
      {party.entries.length >= MAX_MENU ? <Dim>Your menu has six drinks. Remove one before adding another.</Dim> : candidates.slice(0, limit).map((r) => <Pressable key={r.id} accessibilityRole="button" accessibilityLabel={`Add ${r.name} to party menu`} style={styles.candidate} onPress={() => { addToParty(r.id); setNotice(`${r.name} added to your menu.`); }}>
        <View style={{ flex: 1, gap: 4 }}><Body>{r.name}</Body><Dim style={isAlcoholFree(r) ? { color: C.text } : undefined}>{isAlcoholFree(r) ? 'Alcohol-free' : r.method} · {matchRecipe(r, owned, prefs.allowSubstitutes).ok ? 'from your bar' : 'plan a shop'}</Dim></View><Body style={{ color: C.text }}>＋</Body>
      </Pressable>)}
      {!candidates.length && party.entries.length < MAX_MENU ? <Dim>No complete recipes match. Try All recipes or another search.</Dim> : null}
      {candidates.length > limit && party.entries.length < MAX_MENU ? <GhostButton label="Show more drinks" onPress={() => setLimit((n) => n + 12)} /> : null}
      {selected.length ? <PrimaryButton label="Calculate batches & shopping" disabled={badCounts} onPress={() => setMode('batch')} /> : null}
      <GhostButton label="Try Drunk Test · party gag" onPress={onFun} />
    </> : mode === 'batch' ? <>
      {!selected.length ? <PrimaryButton label="Choose the menu first" onPress={() => setMode('menu')} /> : badCounts ? <><Body style={{ color: C.text }}>Fix the serving counts before calculating.</Body><PrimaryButton label="Back to menu" onPress={() => setMode('menu')} /></> : <>
        <View style={styles.tabs}><Chip label="Milliliters" active={party.unit === 'ml'} onPress={() => setParty({ ...party, unit: 'ml' })} /><Chip label="US fluid ounces" active={party.unit === 'oz'} onPress={() => setParty({ ...party, unit: 'oz' })} /></View>
        <Dim>Totals use each recipe as written, before dilution. Substitutions are not applied to batches. A “full” bottle is not a measured quantity.</Dim>
        {selected.map(({ recipe, servings }) => {
          const lines = batchRecipe(recipe, servings, party.unit);
          return <Panel key={recipe.id} style={{ gap: 12 }}><Heading>{recipe.name}</Heading><Label color={C.text}>{servings} planned servings</Label>
            <Body>{prepAdvice(recipe)}</Body>
            <Label>Measure ahead · still ingredients</Label>{lines.filter((l) => !l.atServing).map((l) => <Body key={l.key} style={type.ingredient}>{batchLineLabel(l)}</Body>)}
            {!lines.some((l) => !l.atServing) ? <Dim>Prepare this drink fresh at serving.</Dim> : null}
            {lines.some((l) => l.atServing) ? <><Label>At serving · keep separate</Label>{lines.filter((l) => l.atServing).map((l) => <Body key={l.key} style={type.ingredient}>{batchLineLabel(l)}</Body>)}</> : null}
            {recipe.garnish ? <Dim>Garnish each glass · {recipe.garnish}</Dim> : null}
            <GhostButton label="Open serving view" accessibilityLabel={`Open serving view · ${recipe.name}`} onPress={() => onServe(recipe, servings, party.unit)} />
          </Panel>;
        })}
        <Heading>Your combined shopping quantities</Heading><Dim>Check the total against what’s left in your bottles. Optional items are separate; ice and top-ups stay per glass.</Dim>
        {totals.map((l) => <View key={l.key} style={{ gap: 4 }}><Body style={type.ingredient}>{batchLineLabel(l)}</Body><Dim style={{ color: missing.includes(l) ? C.text : C.dim }}>{l.optional ? 'Optional · check on hand' : missing.includes(l) ? 'Missing from your bar' : 'On hand · verify enough remains'}</Dim></View>)}
        <PrimaryButton label={missing.length ? 'Add missing ingredients to shopping list' : 'Open shopping list'} onPress={() => {
          missing.forEach((l) => addToShopping(l.catalogItemId, l.name)); onShopping();
        }} />
        <Dim>The shopping list saves ingredient names. Use these totals to choose bottle and package sizes; no exact stock volume is assumed.</Dim>
      </>}
    </> : <>
      <Heading>Your guest menu & QR code</Heading><Dim>A read-only snapshot of the drinks you selected. Your cabinet, counts, ratings and history stay private. Share a new link when the menu changes.</Dim>
      {!selected.length ? <PrimaryButton label="Choose drinks first" onPress={() => setMode('menu')} /> : <>
        <Panel style={{ gap: 16 }}><Label color={C.text}>{party.title.trim() || 'Tonight’s drinks'}</Label>{selected.map(({ recipe }) => <View key={recipe.id} style={{ gap: 5 }}><Heading>{recipe.name}</Heading><Body>{isAlcoholFree(recipe) ? 'Alcohol-free · ' : ''}{recipe.ingredients.filter((i) => i.role !== 'ice' && i.role !== 'garnish').map((i) => i.displayName).join(' · ')}</Body></View>)}</Panel>
        {linkError ? <Body style={{ color: C.text }}>{linkError}</Body> : <>
          {localAddress ? <Dim style={{ color: C.text }}>This preview address works on this computer. For guests’ phones, use the reachable web address running this version of the app.</Dim> : <Dim>Scan to see tonight’s drinks. Guests can read the recipes without changing your bar.</Dim>}
          {link.length <= 1800 ? <MenuQR value={link} /> : <Dim>This custom menu is too detailed for a clear QR code. Share the link instead.</Dim>}
          <PrimaryButton label="Copy guest menu link" onPress={copyLink} />
          <GhostButton label="Share guest menu link" onPress={() => { Share.share({ message: link, title: party.title }).catch(() => setNotice('Sharing is unavailable here. Copy the link instead.')); }} />
          <GhostButton label="Preview read-only guest menu" onPress={() => { Linking.openURL(link).catch(() => setNotice('Copy the link to preview it in a browser.')); }} />
          <Label>Guest link</Label><TextInput value={link} editable={false} selectTextOnFocus multiline accessibilityLabel="Guest menu link" style={[styles.input, { fontSize: 12, maxHeight: 100 }]} />
        </>}
        <GhostButton label={showAddress ? 'Hide web address' : 'Set guest web address'} onPress={() => setShowAddress((v) => !v)} />
        {showAddress ? <TextInput value={shareAddress} onChangeText={setShareAddress} autoCapitalize="none" autoCorrect={false} accessibilityLabel="Guest web address" placeholder="https://your-app-address/" placeholderTextColor={C.faint} style={styles.input} /> : null}
      </>}
    </>}
    {notice ? <Body accessibilityLiveRegion="polite" style={{ color: C.text }}>{notice}</Body> : null}
  </Sheet>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  input: { minHeight: 48, backgroundColor: C.ink, color: C.text, padding: 12, borderRadius: R.sm, borderWidth: 1, borderColor: C.line2, fontFamily: F.regular, fontSize: 16 },
  titleInput: { color: C.text, fontFamily: F.medium, fontSize: 24, minHeight: 48, borderBottomWidth: 1, borderBottomColor: C.line2, paddingVertical: 8 },
  remove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: C.ink2 },
  candidate: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 72, padding: 16, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: R.md },
});
