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
import { ShakerScreen } from './src/screens/ShakerScreen';
import { KitScreen } from './src/screens/KitScreen';
import { BookScreen } from './src/screens/BookScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { TrendingScreen } from './src/screens/TrendingScreen';

function Shell() {
  const { ready, prefs, setPref } = useData();
  const [tab, setTab] = useState<TabKey>('shaker');

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={C.lime} />
      </View>
    );
  }

  if (!prefs.ageGateAcceptedAt) {
    return <AgeGate onAccept={() => setPref('ageGateAcceptedAt', Date.now())} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {tab === 'shaker' && <ShakerScreen goTo={setTab} />}
        {tab === 'kit' && <KitScreen />}
        {tab === 'recipes' && <BookScreen />}
        {tab === 'trending' && <TrendingScreen />}
        {tab === 'explore' && <ExploreScreen />}
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
        {/* Ambient glow — the party surface, painted once behind everything. */}
        <LinearGradient
          colors={['#16210E', C.ink, '#1A1226']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {fontsLoaded ? (
          <DataProvider>
            <Shell />
          </DataProvider>
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={C.lime} />
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.ink,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.ink,
  },
});
