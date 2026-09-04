import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, GLASS, LEVEL_COLOR, LEVEL_FILL, R, S, SHADOW, type } from '../theme';
import { Level, LEVELS } from '../types';
import { GlyphName, Icon } from '../icons';

// ── Type ───────────────────────────────────────────────────────────────────

export function Wordmark({ children, style, ...rest }: TextProps) {
  return <Text {...rest} style={[styles.wordmark, style]}>{children}</Text>;
}
export function Title({ children, style, ...rest }: TextProps) {
  return <Text {...rest} style={[styles.title, style]}>{children}</Text>;
}
export function Heading({ children, style, ...rest }: TextProps) {
  return <Text {...rest} style={[styles.heading, style]}>{children}</Text>;
}
export function Body({ children, style, ...rest }: TextProps) {
  return <Text {...rest} style={[styles.body, style]}>{children}</Text>;
}
export function Dim({ children, style, ...rest }: TextProps) {
  return <Text {...rest} style={[styles.dim, style]}>{children}</Text>;
}

export function Label({
  children,
  color = C.faint,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Text style={[styles.label, { color }, style as any]}>
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
}

// ── Interaction ────────────────────────────────────────────────────────────

/**
 * Pressable with spring physics. A flat opacity change on press is most of
 * what makes a touch target feel cheap; a small scale that springs back reads
 * as a physical surface.
 */
export function Press({
  children,
  onPress,
  onLongPress,
  disabled,
  scaleTo = 0.97,
  style,
  hitSlop,
  ...a11y
}: {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  hitSlop?: any;
  [key: string]: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const to = (v: number) =>
    Animated.spring(scale, {
      toValue: v,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  // The style belongs on the Pressable, not on the inner animated view:
  // sizing (width, flex) has to live on the element the parent lays out, or a
  // grid of these collapses to shrink-wrapped columns.
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      hitSlop={hitSlop}
      style={style}
      {...a11y}
    >
      <Animated.View style={[styles.pressInner, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ── Surfaces ───────────────────────────────────────────────────────────────

/**
 * Glass panel: gradient fill, a light catch along the top edge, hairline
 * border and a real shadow. The top edge is what sells it — without it a
 * translucent rectangle just looks like a lighter rectangle.
 */
export function Panel({
  children,
  style,
  accent,
  raised,
  padded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: string;
  raised?: boolean;
  padded?: boolean;
}) {
  return (
    <View style={[styles.panelWrap, raised ? SHADOW.lift : SHADOW.card, style]}>
      <LinearGradient
        colors={raised ? GLASS.raised : GLASS.card}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[
          styles.panel,
          padded ? { padding: S.lg } : null,
          accent ? { borderColor: accent + '44' } : null,
        ]}
      >
        <View style={styles.edge} pointerEvents="none" />
        {children}
      </LinearGradient>
    </View>
  );
}

export function Chip({
  label,
  active,
  color = C.teal,
  onPress,
  small,
}: {
  label: string;
  active?: boolean;
  color?: string;
  onPress?: () => void;
  small?: boolean;
}) {
  const body = (
    <View
      style={[
        styles.chip,
        small ? { paddingVertical: 5, paddingHorizontal: 11 } : null,
        active ? { backgroundColor: color, borderColor: 'transparent' } : null,
        active ? SHADOW.glow(color, 0.4) : null,
        active ? { borderRadius: R.pill } : null,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          small ? { fontSize: 11.5 } : null,
          active ? { color: C.ink, fontFamily: type.label.fontFamily } : null,
        ]}
      >
        {label}
      </Text>
    </View>
  );
  if (!onPress) return body;
  return (
    <Press
      onPress={onPress}
      scaleTo={0.94}
      style={styles.pillRadius}
      // Chips sit at ~34px tall by design; hitSlop brings the touch area up to
      // the 44px guidance without inflating the visual.
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
    >
      {body}
    </Press>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.975}
      accessibilityRole="button"
      // The glow has to sit on a rounded element: on a square parent the halo
      // stops at the rectangle, leaving the pill's corners as dark notches.
      style={[styles.pillRadius, disabled ? { opacity: 0.3 } : SHADOW.glow(C.teal, 0.5), style]}
    >
      <LinearGradient
        colors={[C.tealSoft, C.teal, '#1FB6AC']}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primaryFill}
      >
        <View style={styles.primaryEdge} pointerEvents="none" />
        <Text style={styles.primaryText}>{label}</Text>
      </LinearGradient>
    </Press>
  );
}

export function GhostButton({
  label,
  onPress,
  color = C.text,
  style,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Press onPress={onPress} scaleTo={0.975} accessibilityRole="button" style={[styles.pillRadius, style]}>
      <View style={styles.ghost}>
        <View style={styles.edge} pointerEvents="none" />
        <Text style={[styles.ghostText, { color }]}>{label}</Text>
      </View>
    </Press>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Title>{title}</Title>
        {subtitle ? <Dim style={{ marginTop: 3 }}>{subtitle}</Dim> : null}
      </View>
      {right}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: GlyphName;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <Panel style={{ alignItems: 'center', paddingVertical: S.xxl }}>
      <View style={styles.emptyHalo}>
        <Icon name={icon} size={30} color={C.teal} />
      </View>
      <Heading style={{ textAlign: 'center', marginTop: S.lg }}>{title}</Heading>
      <Dim style={{ textAlign: 'center', marginTop: S.sm, maxWidth: 300 }}>{body}</Dim>
      {action ? <View style={{ marginTop: S.xl, width: '100%' }}>{action}</View> : null}
    </Panel>
  );
}

export function Stars({
  value,
  size = 12,
  onRate,
}: {
  value: number | null;
  size?: number;
  onRate?: (n: number) => void;
}) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (value ?? 0) >= n;
        const star = (
          <Icon
            name={filled ? 'star' : 'star-outline'}
            size={size}
            color={filled ? C.gold : C.faint}
          />
        );
        if (!onRate) return <View key={n}>{star}</View>;
        return (
          <Pressable
            key={n}
            onPress={() => onRate(n)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${n} of 5`}
          >
            {star}
          </Pressable>
        );
      })}
    </View>
  );
}

/** "4/6 ON HAND" — shorter than the reference's wording so it never wraps. */
export function HaveCount({ have, total }: { have: number; total: number }) {
  const complete = have >= total;
  const close = !complete && total - have === 1;
  const color = complete ? C.teal : close ? C.amber : C.faint;
  return (
    <View style={styles.haveRow}>
      <View style={[styles.haveDot, { backgroundColor: color }]} />
      <Text style={[styles.have, { color }]} numberOfLines={1}>
        {have}/{total} ON HAND
      </Text>
    </View>
  );
}

export function QuantityBar({
  level,
  onChange,
}: {
  level: Level;
  onChange: (next: Level) => void;
}) {
  const fill = LEVEL_FILL[level] ?? 0;
  const color = LEVEL_COLOR[level];
  return (
    <View>
      <View style={styles.track}>
        <LinearGradient
          colors={[color + '99', color]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.trackFill, { width: `${fill * 100}%` }]}
        />
        <View
          style={[
            styles.knob,
            { left: `${fill * 100}%`, borderColor: color },
            SHADOW.glow(color, 0.7),
          ]}
        />
      </View>
      <View style={styles.trackZones}>
        {LEVELS.map((l) => (
          <Pressable
            key={l}
            onPress={() => onChange(l)}
            style={styles.zone}
            accessibilityRole="adjustable"
            accessibilityLabel={`Set remaining to ${l}`}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wordmark: { color: C.text, ...type.wordmark },
  title: { color: C.text, ...type.h1 },
  heading: { color: C.text, ...type.h3 },
  body: { color: C.text, ...type.body },
  dim: { color: C.dim, ...type.small },
  label: { ...type.label },

  pressInner: { flex: 1, width: '100%' },
  panelWrap: { borderRadius: R.lg },
  pillRadius: { borderRadius: R.pill },
  panel: {
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.line,
    overflow: 'hidden',
  },
  edge: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: C.edge,
  },

  chip: {
    borderWidth: 1,
    borderColor: C.line2,
    borderRadius: R.pill,
    paddingVertical: 7,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(190,250,246,0.035)',
  },
  chipText: { color: C.dim, ...type.small, fontSize: 12.5 },

  primaryFill: {
    borderRadius: R.pill,
    paddingVertical: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  primaryEdge: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  primaryText: { color: '#03251F', ...type.label, fontSize: 12.5 },

  ghost: {
    borderWidth: 1,
    borderColor: C.line2,
    borderRadius: R.pill,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(190,250,246,0.04)',
    overflow: 'hidden',
  },
  ghostText: { ...type.small, fontSize: 13.5, fontFamily: type.h3.fontFamily },

  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: S.lg, gap: S.md },

  emptyHalo: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(47,212,198,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(47,212,198,0.28)',
  },

  stars: { flexDirection: 'row', gap: 1 },

  haveRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  haveDot: { width: 5, height: 5, borderRadius: 3 },
  have: { ...type.label, fontSize: 9.5, letterSpacing: 1.1 },

  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'center',
  },
  trackFill: { height: 4, borderRadius: 2 },
  knob: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.ink2,
    borderWidth: 2,
    marginLeft: -6,
  },
  trackZones: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    height: 20,
  },
  zone: { flex: 1 },

  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  ruleLine: { flex: 1, height: 1, backgroundColor: C.line },
});
