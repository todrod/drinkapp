import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F, R, S, type } from '../theme';

export function Title({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[styles.title, style]}>
      {children}
    </Text>
  );
}

export function Heading({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[styles.heading, style]}>
      {children}
    </Text>
  );
}

export function Body({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[styles.body, style]}>
      {children}
    </Text>
  );
}

export function Dim({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[styles.dim, style]}>
      {children}
    </Text>
  );
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

/** The glass panel from the spec: translucent fill, hairline border. */
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
    <View
      style={[
        styles.panel,
        accent ? { borderColor: accent + '55' } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Chip({
  label,
  active,
  color = C.lime,
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
          active && { color: C.ink, fontWeight: '700' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Primary action. Lime is the only colour that means "press me". */
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
        disabled && { opacity: 0.4 },
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      <LinearGradient
        colors={['#D8FF6B', C.lime]}
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

const styles = StyleSheet.create({
  title: {
    color: C.text,
    fontFamily: F.display,
    ...type.h1,
  },
  heading: {
    color: C.text,
    fontFamily: F.display,
    ...type.h3,
  },
  body: {
    color: C.text,
    ...type.body,
  },
  dim: {
    color: C.dim,
    ...type.small,
  },
  label: {
    ...type.label,
    fontWeight: '700',
  },
  panel: {
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    padding: S.lg,
  },
  chip: {
    borderWidth: 1,
    borderColor: C.line2,
    borderRadius: R.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipText: {
    color: C.dim,
    fontSize: 12.5,
    fontWeight: '600',
  },
  primary: {
    borderRadius: R.pill,
    shadowColor: C.lime,
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  primaryFill: {
    borderRadius: R.pill,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryText: {
    color: C.ink,
    fontFamily: F.display,
    fontSize: 17,
    letterSpacing: 0.4,
  },
  ghost: {
    borderWidth: 1,
    borderColor: C.line2,
    borderRadius: R.pill,
    paddingVertical: 13,
    alignItems: 'center',
  },
  ghostText: {
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: S.lg,
    gap: S.md,
  },
});
