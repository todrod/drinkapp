import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
// Imported by weight, not from the package root — the root re-exports all 18
// Nunito faces and the bundler ships every one of them (~2.4 MB) even though
// the app uses two.
import { useFonts } from 'expo-font';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';

import { C } from './src/theme';
import { DataProvider, useData } from './src/store';
import { NavPill, TabKey } from './src/components/NavPill';
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
  const [fontsLoaded] = useFonts({ Nunito_700Bold, Nunito_800ExtraBold });

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.root}>
        {/* Smoky bar-room ground, painted once behind everything. */}
        <LinearGradient
          colors={['#0C1A20', C.ink, '#0A1017']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['rgba(53,214,196,0.14)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
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
