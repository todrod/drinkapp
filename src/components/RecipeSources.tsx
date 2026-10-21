import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { DrinkRecipe } from '../types';
import { curationSources } from '../data/curation';
import { C, F } from '../theme';
import { Icon } from '../icons';

export function RecipeSources({ recipe }: { recipe: DrinkRecipe }) {
  const links = [
    ...(recipe.sourceUrl ? [{ label: recipe.sourceNote ?? 'Recipe source', url: recipe.sourceUrl }] : []),
    ...curationSources(recipe),
  ];
  if (!links.length && !recipe.sourceNote) return null;
  return (
    <View style={styles.wrap}>
      {recipe.sourceNote && !recipe.sourceUrl ? <Text style={styles.note}>{recipe.sourceNote}</Text> : null}
      {links.map(({ label, url }) => (
        <Pressable key={url} accessibilityRole="link" accessibilityLabel={label + ', open source'}
          onPress={() => { Linking.openURL(url).catch(() => {}); }} style={styles.link}>
          <Icon name="book-open-variant" size={14} color={C.accent} />
          <Text style={styles.text}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { gap: 4, marginTop: 12 },
  link: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 9 },
  text: { color: C.accent, fontFamily: F.regular, fontSize: 12, lineHeight: 18, flex: 1 },
  note: { color: C.faint, fontFamily: F.regular, fontSize: 12, lineHeight: 18 },
});
