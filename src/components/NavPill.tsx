import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, R, SHADOW } from '../theme';
import { Icon, TAB_ICON } from '../icons';

export type TabKey = 'random' | 'cabinet' | 'recipes' | 'builder';
export const TABS: { key: TabKey; label: string }[] = [
  { key: 'random', label: 'Discover' },
  { key: 'cabinet', label: 'My bar' },
  { key: 'recipes', label: 'Recipes' },
  { key: 'builder', label: 'Mix lab' },
];

export function NavPill({ active, onChange }: { active: TabKey; onChange: (key: TabKey) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={styles.shell}>
        {TABS.map((tab) => {
          const selected = tab.key === active;
          return (
            <Pressable key={tab.key} accessibilityRole="tab" accessibilityLabel={tab.label}
              accessibilityState={{ selected }} style={styles.tab}
              onPress={() => {
                if (!selected) Haptics.selectionAsync().catch(() => {});
                onChange(tab.key);
              }}>
              <View style={[styles.icon, selected && styles.iconOn]}>
                <Icon name={TAB_ICON[tab.key]} size={22} color={selected ? C.accent : C.dim} />
              </View>
              <Text style={[styles.label, selected && styles.labelOn]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 8 },
  shell: {
    width: '92%', maxWidth: 480, flexDirection: 'row', padding: 6,
    borderRadius: 26, borderWidth: 1, borderColor: C.line2,
    backgroundColor: C.panel, ...SHADOW.lift,
  },
  tab: { flex: 1, minHeight: 60, alignItems: 'center', justifyContent: 'center', gap: 3 },
  icon: { width: 54, height: 32, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  iconOn: { backgroundColor: C.raise },
  label: { color: C.dim, fontFamily: F.medium, fontSize: 11 },
  labelOn: { color: C.accent },
});
