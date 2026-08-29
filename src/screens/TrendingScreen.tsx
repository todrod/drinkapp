import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { C, F, R, S } from '../theme';
import { Body, Dim, Label, Panel, ScreenHeader } from '../components/ui';
import { TrendingDrink } from '../api/trending';

/**
 * Deferred feature — the live trending feed. The screen is here so the tab
 * exists and the shape of the data is settled; the network layer in
 * ../api/trending.ts is stubbed and clearly marked.
 *
 * The rule this screen is built around: an item with no sources is never
 * rendered, so the UI has no code path that can show an uncited claim.
 */
export function TrendingScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Trending" subtitle="What bars are actually pouring" />

      <View style={styles.banner}>
        <View style={styles.dot} />
        <Body style={{ flex: 1, color: C.violet }}>Not connected yet</Body>
      </View>

      <Panel style={{ gap: S.md }}>
        <Body style={{ color: C.dim, lineHeight: 22 }}>
          This tab pulls a live, cited list of what's trending in bars right now.
          It's the one feature that needs the internet, so it's built last — the
          rest of the app works with the router off.
        </Body>
        <Body style={{ color: C.dim, lineHeight: 22 }}>
          When it's switched on, each card carries the drink, a one-line reason
          it's trending, and the publications that said so. Anything without a
          source gets dropped before it reaches the screen.
        </Body>
      </Panel>

      <Label style={{ marginTop: S.xl }}>Preview of the card format</Label>
      <Panel style={styles.preview}>
        <Text style={styles.rank}>TRENDING · #1</Text>
        <Text style={styles.name}>Watermelon Mint Cooler</Text>
        <Dim style={{ marginTop: 4 }}>
          Named in 3 of 5 bar-trend roundups this month.
        </Dim>
        <View style={styles.liveTag}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE · RETRIEVED 2H AGO</Text>
        </View>
        <View style={styles.sources}>
          <Text style={styles.sourceLabel}>SOURCES</Text>
          <Dim style={{ marginTop: 4 }}>Publisher — headline · date</Dim>
          <Dim>Publisher — headline · date</Dim>
        </View>
        <Text style={styles.stub}>Sample layout — not live data</Text>
      </Panel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: S.lg, paddingTop: S.xl, paddingBottom: 140, gap: S.md },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    borderWidth: 1,
    borderColor: C.violet + '55',
    backgroundColor: C.violet + '14',
    borderRadius: R.pill,
    paddingVertical: 9,
    paddingHorizontal: S.md,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.violet },
  preview: { opacity: 0.6 },
  rank: { color: C.violet, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  name: { color: C.text, fontFamily: F.display, fontSize: 21, marginTop: 4 },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: C.cyan + '66',
    borderRadius: R.pill,
    paddingVertical: 4,
    paddingHorizontal: 9,
    marginTop: S.md,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.cyan },
  liveText: { color: C.cyan, fontSize: 9, fontWeight: '800', letterSpacing: 0.9 },
  sources: {
    marginTop: S.md,
    paddingTop: S.sm,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  sourceLabel: { color: C.faint, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  stub: {
    color: C.faint,
    fontSize: 11,
    marginTop: S.md,
    fontStyle: 'italic',
  },
});
