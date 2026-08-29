import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, R, S } from '../theme';

export type TabKey = 'shaker' | 'kit' | 'recipes' | 'trending' | 'explore';

export const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'shaker', label: 'Shaker', icon: '🍸' },
  { key: 'kit', label: 'My Kit', icon: '🧃' },
  { key: 'recipes', label: 'Recipes', icon: '📖' },
  { key: 'trending', label: 'Trending', icon: '📈' },
  { key: 'explore', label: 'Explore', icon: '🔍' },
];

/**
 * Floating pill nav — Phase 04. Horizontally scrollable, which is what keeps
 * it usable at large accessibility text sizes where a fixed five-column grid
 * would clip.
 */
export function NavPill({
  active,
  onChange,
  badge,
}: {
  active: TabKey;
  onChange: (key: TabKey) => void;
  badge?: Partial<Record<TabKey, boolean>>;
}) {
  const insets = useSafeAreaInsets();

  const press = (key: TabKey) => {
    if (key !== active) {
      Haptics.selectionAsync().catch(() => {});
    }
    onChange(key);
  };

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) + 6 }]} pointerEvents="box-none">
      <View style={styles.pill}>
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
                style={({ pressed }) => [
                  styles.tab,
                  on && styles.tabOn,
                  pressed && !on && { backgroundColor: 'rgba(255,255,255,0.06)' },
                ]}
              >
                <Text style={[styles.icon, on && { opacity: 1 }]}>{t.icon}</Text>
                <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
                  {t.label.toUpperCase()}
                </Text>
                {badge?.[t.key] && !on ? <View style={styles.badge} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    maxWidth: 620,
    backgroundColor: 'rgba(16,19,32,0.94)',
    borderWidth: 1,
    borderColor: C.line2,
    borderRadius: R.pill,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
    marginHorizontal: S.md,
  },
  row: {
    flexDirection: 'row',
    padding: 6,
    gap: 2,
  },
  tab: {
    minWidth: 68,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: R.pill,
    gap: 1,
  },
  tabOn: {
    backgroundColor: C.lime,
    shadowColor: C.lime,
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  icon: {
    fontSize: 15,
    opacity: 0.65,
  },
  label: {
    color: C.faint,
    fontSize: 9.5,
    letterSpacing: 0.9,
    fontWeight: '700',
  },
  labelOn: {
    color: C.ink,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 12,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.violet,
  },
});
