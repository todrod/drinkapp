import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F, LEVEL_COLOR, LEVEL_FILL, R, S, type } from '../theme';
import { Level, LEVELS } from '../types';

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

export function Panel({
  children,
  style,
  accent,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: string;
}) {
  return (
    <View style={[styles.panel, accent ? { borderColor: accent + '55' } : null, style]}>
      {children}
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
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        styles.chip,
        small && { paddingVertical: 4, paddingHorizontal: 9 },
        active && { backgroundColor: color, borderColor: 'transparent' },
        pressed && onPress && { opacity: 0.7 },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          small && { fontSize: 11 },
          active && { color: C.ink, fontWeight: '800' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
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
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.primary,
        disabled && { opacity: 0.35 },
        pressed && { transform: [{ scale: 0.985 }] },
        style,
      ]}
    >
      <LinearGradient
        colors={[C.tealSoft, C.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primaryFill}
      >
        <Text style={styles.primaryText}>{label}</Text>
      </LinearGradient>
    </Pressable>
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
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.ghost, pressed && { opacity: 0.6 }, style]}
    >
      <Text style={[styles.ghostText, { color }]}>{label}</Text>
    </Pressable>
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
        {subtitle ? <Dim style={{ marginTop: 2 }}>{subtitle}</Dim> : null}
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
  icon: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <Panel style={{ alignItems: 'center', paddingVertical: S.xl }}>
      <Text style={{ fontSize: 40, marginBottom: S.md }}>{icon}</Text>
      <Heading style={{ textAlign: 'center' }}>{title}</Heading>
      <Dim style={{ textAlign: 'center', marginTop: S.sm, maxWidth: 300 }}>{body}</Dim>
      {action ? <View style={{ marginTop: S.lg, width: '100%' }}>{action}</View> : null}
    </Panel>
  );
}

/** Five stars, tappable when onRate is given. */
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
          <Text
            style={{
              fontSize: size,
              color: filled ? C.amber : C.faint,
              opacity: filled ? 1 : 0.5,
            }}
          >
            ★
          </Text>
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

/**
 * "INGREDIENTS YOU HAVE: 4/6" — the number the reference puts on every card.
 * Green when complete, amber when one short, muted otherwise.
 */
export function HaveCount({ have, total }: { have: number; total: number }) {
  const complete = have >= total;
  const close = !complete && total - have === 1;
  const color = complete ? C.teal : close ? C.amber : C.faint;
  return (
    <Text style={[styles.have, { color }]} numberOfLines={1} adjustsFontSizeToFit>
      INGREDIENTS YOU HAVE: {have}/{total}
    </Text>
  );
}

/**
 * Remaining-quantity bar. The underlying model is a four-stop enum rather than
 * a continuous value — "out" has to stay a distinct state because the
 * generator keys off it — so the track has four tap zones instead of a drag.
 */
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
        <View style={[styles.trackFill, { width: `${fill * 100}%`, backgroundColor: color }]} />
        <View style={[styles.knob, { left: `${fill * 100}%`, borderColor: color }]} />
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
  title: { color: C.text, fontFamily: F.display, ...type.h1 },
  heading: { color: C.text, fontFamily: F.display, ...type.h3 },
  body: { color: C.text, ...type.body },
  dim: { color: C.dim, ...type.small },
  label: { ...type.label, fontWeight: '800' },

  panel: {
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.lg,
    padding: S.lg,
  },
  chip: {
    borderWidth: 1,
    borderColor: C.line2,
    borderRadius: R.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipText: { color: C.dim, fontSize: 12.5, fontWeight: '700' },

  primary: {
    borderRadius: R.pill,
    shadowColor: C.teal,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  primaryFill: { borderRadius: R.pill, paddingVertical: 15, alignItems: 'center' },
  primaryText: { color: C.ink, fontFamily: F.display, fontSize: 15, letterSpacing: 1.2 },

  ghost: {
    borderWidth: 1,
    borderColor: C.line2,
    borderRadius: R.pill,
    paddingVertical: 13,
    alignItems: 'center',
  },
  ghostText: { fontSize: 14, fontWeight: '700' },

  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: S.lg, gap: S.md },

  stars: { flexDirection: 'row', gap: 2 },
  have: { fontSize: 8.5, fontWeight: '800', letterSpacing: 0.3 },

  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
  },
  trackFill: { height: 4, borderRadius: 2 },
  knob: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: C.ink2,
    borderWidth: 2,
    marginLeft: -6,
  },
  trackZones: { position: 'absolute', top: -8, left: 0, right: 0, flexDirection: 'row', height: 20 },
  zone: { flex: 1 },
});
