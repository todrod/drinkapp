import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, R, S, SHADOW, type } from '../theme';
import { Icon, TAB_ICON } from '../icons';

export type TabKey = 'random' | 'cabinet' | 'recipes' | 'builder';

export const TABS: { key: TabKey; label: string }[] = [
  { key: 'random', label: 'Random' },
  { key: 'cabinet', label: 'Cabinet' },
  { key: 'recipes', label: 'Recipes' },
  { key: 'builder', label: 'Builder' },
];

/**
 * Floating glass tab bar.
 *
 * The active tab is marked by a pill that slides between positions rather than
 * four independent highlights switching on and off — the movement is what
 * makes the bar feel like one object.
 */
export function NavPill({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (key: TabKey) => void;
}) {
  const insets = useSafeAreaInsets();
  const index = Math.max(0, TABS.findIndex((t) => t.key === active));
  const slide = useRef(new Animated.Value(index)).current;
  const [barWidth, setBarWidth] = React.useState(0);

  useEffect(() => {
    Animated.spring(slide, {
      toValue: index,
      useNativeDriver: true,
      speed: 16,
      bounciness: 8,
    }).start();
  }, [index, slide]);

  const slot = barWidth / TABS.length;
  const translateX = slide.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => i * slot),
  });

  const press = (key: TabKey) => {
    if (key !== active) Haptics.selectionAsync().catch(() => {});
    onChange(key);
  };

  return (
    <View
      style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) }]}
      pointerEvents="box-none"
    >
      <View style={[styles.shell, SHADOW.lift]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['rgba(190,250,246,0.10)', 'rgba(190,250,246,0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.shellEdge} pointerEvents="none" />

        <View style={styles.row} onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}>
          {barWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.indicator,
                { width: slot - 8, transform: [{ translateX }] },
              ]}
            >
              <LinearGradient
                colors={['rgba(47,212,198,0.28)', 'rgba(47,212,198,0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.indicatorTop} />
            </Animated.View>
          ) : null}

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
                <Icon name={TAB_ICON[t.key]} size={19} color={on ? C.teal : C.faint} />
                <Text style={[styles.label, on ? styles.labelOn : null]} numberOfLines={1}>
                  {t.label.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  shell: {
    width: '92%',
    maxWidth: 520,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.line2,
    overflow: 'hidden',
    backgroundColor: 'rgba(6,12,17,0.55)',
  },
  shellEdge: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: C.edge,
  },
  row: { flexDirection: 'row', padding: 4 },
  indicator: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: R.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(47,212,198,0.35)',
  },
  indicatorTop: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: 1,
    backgroundColor: 'rgba(123,239,226,0.6)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    gap: 4,
  },
  label: { color: C.faint, ...type.label, fontSize: 9, letterSpacing: 1.2 },
  labelOn: { color: C.teal },
});
