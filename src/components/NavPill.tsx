import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, R, S } from '../theme';

export type TabKey = 'random' | 'cabinet' | 'recipes' | 'builder';

export const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'random', label: 'Random', icon: '🔀' },
  { key: 'cabinet', label: 'Cabinet', icon: '🗄️' },
  { key: 'recipes', label: 'Recipes', icon: '📋' },
  { key: 'builder', label: 'Builder', icon: '🍸' },
];

/**
 * Bottom navigation. Flush bar rather than a floating pill, matching the
 * reference: a hairline top border, an active teal underline, and a
 * horizontally scrollable row so large accessibility text sizes still fit.
 */
export function NavPill({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (key: TabKey) => void;
}) {
  const insets = useSafeAreaInsets();

  const press = (key: TabKey) => {
    if (key !== active) Haptics.selectionAsync().catch(() => {});
    onChange(key);
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {TABS.map((t) => {
          const on = t.key === active;
          return (
            <Pressable
              key={t.key}
              onPress={() => press(t.key)}
              accessibilityRole="tab"
              accessibilityLabel={t.label}
              accessibilityState={{ selected: on }}
              style={styles.tab}
            >
              <View style={[styles.rule, on && styles.ruleOn]} />
              <Text style={[styles.icon, on && styles.iconOn]}>{t.icon}</Text>
              <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
                {t.label.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8,13,19,0.94)',
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: S.sm,
    paddingTop: 2,
    minWidth: '100%',
    justifyContent: 'space-around',
  },
  tab: {
    minWidth: 78,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: 10,
    gap: 3,
  },
  rule: {
    position: 'absolute',
    top: 0,
    height: 2,
    width: 34,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  ruleOn: {
    backgroundColor: C.teal,
    shadowColor: C.teal,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  icon: { fontSize: 16, opacity: 0.5 },
  iconOn: { opacity: 1 },
  label: {
    color: C.faint,
    fontSize: 9.5,
    letterSpacing: 1,
    fontWeight: '700',
  },
  labelOn: { color: C.teal },
});
