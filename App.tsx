import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
// Imported by weight, not from the package root — the root re-exports every
// face in the family and the bundler ships all of them even though the app
// uses four.
import { useFonts } from 'expo-font';
import { Outfit_300Light } from '@expo-google-fonts/outfit/300Light';
import { Outfit_400Regular } from '@expo-google-fonts/outfit/400Regular';
import { Outfit_500Medium } from '@expo-google-fonts/outfit/500Medium';
import { Outfit_600SemiBold } from '@expo-google-fonts/outfit/600SemiBold';

import { C } from './src/theme';
import { DataProvider, useData } from './src/store';
import { NavPill, TabKey } from './src/components/NavPill';
import { Atmosphere } from './src/components/Atmosphere';
import { AgeGate } from './src/screens/AgeGate';
import { RandomScreen } from './src/screens/RandomScreen';
import { CabinetScreen, CabinetView } from './src/screens/CabinetScreen';
import { RecipesScreen } from './src/screens/RecipesScreen';
import { BuilderScreen } from './src/screens/BuilderScreen';
import { RecipeDetail } from './src/components/RecipeDetail';
import { RecipeEditor } from './src/components/RecipeEditor';
import { ServingView } from './src/components/ServingView';
import { PartyScreen, type PartyMode } from './src/screens/PartyScreen';
import { OverlayLayer } from './src/components/Sheet';
import { GuestMenuScreen } from './src/screens/GuestMenuScreen';
import { blankRecipe, isAlcoholFree, isServingReady } from './src/logic/recipes';
import { decodeGuestMenu } from './src/logic/guestMenu';
import { initialGuestToken, leaveGuestMenu, subscribeGuestToken } from './src/guestLink';
import type { DrinkRecipe } from './src/types';
import { LocalBarsScreen } from './src/screens/LocalBarsScreen';
import { Body, Dim, GhostButton, Heading, Panel, PrimaryButton } from './src/components/ui';

function Shell() {
  const { ready, recipes, prefs, setPref, saveRecipe, storageError, storageReadFailed, retryDeviceSave } = useData();
  const [localBarsOpen, setLocalBarsOpen] = useState(false);
  const [retryError, setRetryError] = useState('');
  const [tab, setTab] = useState<TabKey>('random');
  // Which Cabinet segment to land on. Adding something to the shopping list
  // from elsewhere should show you the list, not the stock you already had.
  const [cabinetView, setCabinetView] = useState<CabinetView>('stock');
  const [partyOpen, setPartyOpen] = useState(false);
  const [partyMode, setPartyMode] = useState<PartyMode>('menu');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState<DrinkRecipe | null>(null);
  const [serving, setServing] = useState<{ recipe: DrinkRecipe; servings: number; unit: 'ml' | 'oz' } | null>(null);
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [linkReady, setLinkReady] = useState(false);
  const guestMenu = useMemo(() => guestToken === null ? null : decodeGuestMenu(guestToken), [guestToken]);
  const detail = detailId ? recipes.find((r) => r.id === detailId) : null;
  const overlay = localBarsOpen || partyOpen || !!detail || !!editing || !!serving;

  useEffect(() => {
    let active = true;
    initialGuestToken().then((token) => { if (active) { setGuestToken(token); setLinkReady(true); } }).catch(() => { if (active) setLinkReady(true); });
    const unsubscribe = subscribeGuestToken(setGuestToken);
    return () => { active = false; unsubscribe(); };
  }, []);

  const editRecipe = (recipe: DrinkRecipe) => {
    // Bundled recipes become a personal copy; existing edits already saved in
    // previous releases keep their IDs and data until the user makes a copy.
    setDetailId(null);
    setEditing(recipe.origin === 'user' ? recipe : { ...recipe, ...blankRecipe(), name: recipe.name + ' · my version', ingredients: recipe.ingredients.map((i) => ({ ...i })), method: recipe.method, steps: [...recipe.steps], garnish: recipe.garnish, glass: recipe.glass, vibeTags: [...recipe.vibeTags], sourceUrl: recipe.sourceUrl, sourceNote: recipe.sourceNote, theme: recipe.theme, accent: recipe.accent });
  };
  const startServing = (recipe: DrinkRecipe, servings = 1, unit: 'ml' | 'oz' = 'ml') => {
    if (!isServingReady(recipe) || (prefs.zeroProofMode && !isAlcoholFree(recipe))) return;
    setDetailId(null); setServing({ recipe, servings, unit });
  };

  const goTo = (next: TabKey, view?: CabinetView) => {
    if (view) setCabinetView(view);
    setTab(next);
  };

  if (!ready || !linkReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={C.teal} />
      </View>
    );
  }

  if (guestToken !== null) return <SafeAreaView style={{ flex: 1 }}><GuestMenuScreen key={guestToken} menu={guestMenu} onLeave={() => { leaveGuestMenu(); setGuestToken(null); }} /></SafeAreaView>;

  if (storageReadFailed) return <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 24 }}><Panel style={{ gap: 18 }}><Heading>We couldn’t open your saved bar</Heading><Body>Your saved files have been kept. Check that device or browser storage is available, then try again.</Body><PrimaryButton label="Try device storage again" onPress={() => { try { retryDeviceSave(); } catch (error) { setRetryError(error instanceof Error ? error.message : 'Device storage is still unavailable.'); } }} />{retryError ? <Dim accessibilityLiveRegion="polite">{retryError}</Dim> : null}</Panel></SafeAreaView>;

  if (!prefs.ageGateAcceptedAt) {
    return <AgeGate onAccept={() => setPref('ageGateAcceptedAt', Date.now())} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {storageError && !overlay ? <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 6 }}><Body style={{ color: C.amber }} accessibilityLiveRegion="polite">{storageError}</Body><GhostButton label="Open device storage & backups" onPress={() => setLocalBarsOpen(true)} /></View> : null}
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {tab === 'random' && <RandomScreen goTo={goTo} onParty={() => setPartyOpen(true)} onServe={startServing} active={!overlay} />}
        {tab === 'cabinet' && <CabinetScreen view={cabinetView} onViewChange={setCabinetView} onLocalBars={() => setLocalBarsOpen(true)} />}
        {tab === 'recipes' && <RecipesScreen onOpen={(r) => setDetailId(r.id)} onNew={() => setEditing(blankRecipe())} />}
        {tab === 'builder' && <BuilderScreen goTo={goTo} onOpen={(r) => setDetailId(r.id)} onEdit={setEditing} />}
      </SafeAreaView>
      <NavPill active={tab} onChange={setTab} />
      <OverlayLayer visible={overlay} onClose={() => {
        if (localBarsOpen) setLocalBarsOpen(false); else if (serving) setServing(null); else if (editing) setEditing(null); else if (detail) setDetailId(null); else setPartyOpen(false);
      }}>
      {localBarsOpen ? <LocalBarsScreen onClose={() => setLocalBarsOpen(false)} /> : serving ? <ServingView key={serving.recipe.id} {...serving} onClose={() => setServing(null)} /> : editing ? <RecipeEditor key={editing.id} recipe={editing} onClose={() => setEditing(null)} onSave={(r) => { saveRecipe(r); setEditing(null); setDetailId(r.id); }} /> : detail ?
        <RecipeDetail recipe={detail} onClose={() => setDetailId(null)} onEdit={editRecipe} onServe={startServing} onShopping={() => { setDetailId(null); setPartyOpen(false); goTo('cabinet', 'shopping'); }} onParty={() => { setDetailId(null); setPartyMode('menu'); setPartyOpen(true); }} /> : partyOpen ?
        <PartyScreen mode={partyMode} setMode={setPartyMode} onClose={() => setPartyOpen(false)} onRecipe={(r) => setDetailId(r.id)} onServe={startServing} onShopping={() => { setPartyOpen(false); goTo('cabinet', 'shopping'); }} /> : null}
      </OverlayLayer>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    // Subset icon face — see scripts/build-icon-font.py
    ShakerIcons: require('./assets/fonts/ShakerIcons.ttf'),
  });

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.root}>
        <Atmosphere />
        {fontsLoaded ? (
          <DataProvider>
            <Shell />
          </DataProvider>
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={C.teal} />
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.ink },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.ink },
});
