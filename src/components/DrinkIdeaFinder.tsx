import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { DiscoveryResult } from '../logic/discovery';
import type { RandomSource } from '../types';
import { C, F, R } from '../theme';
import { Chip, Panel, PrimaryButton } from './ui';

const EXAMPLES = ['Tropical, no gin', 'Cozy coffee', 'Halloween', 'Fruity mocktail'];
export function DrinkIdeaFinder({ query, onChange, discovery, readyCount, matchCount, inventoryIdeas, source, selectableCount, busy, onFind }: {
  query: string; onChange: (query: string) => void; discovery: DiscoveryResult;
  inventoryIdeas: { name: string; ready: boolean; eligible: boolean; missing: string[] }[];
  source: RandomSource; selectableCount: number;
  readyCount: number; matchCount: number; busy: boolean; onFind: () => void;
}) {
  const active = !!query.trim();
  const { intent, matches, closest } = discovery;
  const labels = [...intent.include.map((g) => g.label), ...intent.exclude.map((g) => `without ${g.label}`)];
  return (
    <Panel style={styles.panel}>
      <Text accessibilityRole="header" style={styles.title}>What are you feeling?</Text>
      <Text style={styles.body}>A flavor, a mood, a theme. A few words are enough.</Text>
      <View style={styles.inputRow}>
        <TextInput value={query} onChangeText={onChange} maxLength={240} editable={!busy}
          accessibilityLabel="Describe your drink idea" placeholder="e.g. refreshing rum with lime"
          placeholderTextColor={C.faint} style={styles.input} returnKeyType="search" onSubmitEditing={onFind} />
        {active ? <Pressable onPress={() => onChange('')} disabled={busy} accessibilityRole="button"
          accessibilityLabel="Clear drink idea" style={styles.clear}><Text style={styles.clearText}>Clear</Text></Pressable> : null}
      </View>
      {active ? (
        <View style={styles.feedback} accessibilityLiveRegion="polite">
          <Text style={styles.recognized}>{labels.length ? `Looking for ${labels.join(' · ')}` : 'Try a flavor, ingredient, occasion or theme.'}</Text>
          <Text style={styles.count}>{matchCount} {matchCount === 1 ? 'match' : 'matches'} · {source === 'all' ? `${selectableCount} fit your filters · inventory optional` : `${readyCount} can make now with your filters`}</Text>
          {intent.unknown.length ? <Text style={styles.body}>Not recognized: {intent.unknown.join(', ')}. Try another word.</Text> : null}
          {intent.suggestions.map((word) => <Pressable key={word} disabled={busy} accessibilityRole="button"
            accessibilityLabel={`Try ${word} instead`} onPress={() => {
              const unknown = intent.unknown.find((term) => query.toLowerCase().includes(term));
              onChange(unknown ? query.replace(new RegExp(unknown, 'i'), word) : word);
            }} style={styles.suggestion}><Text style={styles.suggestionText}>Did you mean “{word}”?</Text></Pressable>)}
          {matches.length ? <View style={{ gap: 5 }}>{inventoryIdeas.slice(0, 3).map((m) =>
            <Text key={m.name} style={styles.body}>{m.name} · {!m.eligible ? 'outside your quick filters' : m.ready ? 'ready to make' : m.missing.length ? `not in your bar: ${m.missing.join(', ')}` : 'outside your quick filters'}</Text>
          )}</View> :
            closest.length ? <View style={{ gap: 5 }}>
              <Text style={styles.body}>Closest ideas, with a preference still missing:</Text>
              {closest.map((m) => <Text key={m.recipe.id} style={styles.body}>{m.recipe.name} · doesn’t match {m.missing.join(', ')}</Text>)}
            </View> : <Text style={styles.body}>Try “citrus”, “brunch”, “spooky” or the name of an ingredient.</Text>}
          <PrimaryButton label={busy ? 'Finding your drink…' : !matchCount ? 'No matches yet' : source === 'all' ? selectableCount ? 'Find a matching drink' : 'No matches with these filters' : readyCount ? 'Find a matching drink' : 'See what’s missing'} disabled={busy || matchCount === 0 || (source === 'all' && selectableCount === 0)} onPress={onFind} />
          {matchCount > 0 && readyCount === 0 && source === 'inventory' ? <Text style={styles.body}>No matching drink is ready with your bar and filters. See which ingredients you need, or switch to All recipes.</Text> : null}
        </View>
      ) : <View style={styles.examples}>{EXAMPLES.map((example) => <Chip key={example} label={example} small onPress={() => { if (!busy) onChange(example); }} />)}</View>}
    </Panel>
  );
}
const styles = StyleSheet.create({
  panel: { gap: 12 },
  title: { fontFamily: F.medium, fontSize: 22, color: C.text, letterSpacing: -0.4 },
  body: { fontFamily: F.regular, color: C.dim, fontSize: 14, lineHeight: 21 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, minWidth: 0, minHeight: 50, paddingHorizontal: 14, paddingVertical: 12, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.line2, backgroundColor: C.ink2, color: C.text, fontSize: 14, fontFamily: F.regular },
  clear: { minHeight: 44, minWidth: 44, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
  clearText: { fontFamily: F.medium, color: C.accent, fontSize: 12 },
  examples: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  feedback: { gap: 10 },
  recognized: { color: C.accent, fontFamily: F.medium, fontSize: 12, lineHeight: 19 },
  count: { color: C.teal, fontFamily: F.medium, fontSize: 13 },
  suggestion: { minHeight: 44, justifyContent: 'center' },
  suggestionText: { color: C.accent, fontSize: 13, fontFamily: F.medium },
});
