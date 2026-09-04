import React, { useState } from 'react';
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
import { CabinetScreen } from './src/screens/CabinetScreen';
import { RecipesScreen } from './src/screens/RecipesScreen';
import { BuilderScreen } from './src/screens/BuilderScreen';

function Shell() {
  const { ready, prefs, setPref } = useData();
  const [tab, setTab] = useState<TabKey>('random');

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={C.teal} />
      </View>
    );
  }

  if (!prefs.ageGateAcceptedAt) {
    return <AgeGate onAccept={() => setPref('ageGateAcceptedAt', Date.now())} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {tab === 'random' && <RandomScreen goTo={setTab} />}
        {tab === 'cabinet' && <CabinetScreen />}
        {tab === 'recipes' && <RecipesScreen />}
        {tab === 'builder' && <BuilderScreen goTo={setTab} />}
      </SafeAreaView>
      <NavPill active={tab} onChange={setTab} />
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
