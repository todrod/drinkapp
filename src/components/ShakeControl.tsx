import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ShakeStatus } from '../hooks/useShakeDetector';
import { Icon } from '../icons';
import { C, F, R } from '../theme';

export function ShakeControl({ status, onToggle }: { status: ShakeStatus; onToggle: () => void }) {
  if (status === 'checking' || status === 'unsupported') {
    return <Text style={styles.hint}>Tap the crystal ball to choose a drink.</Text>;
  }
  const active = status === 'ready' || status === 'waiting';
  const label = status === 'requesting' ? 'Enabling shake…' : active ? 'Shake on' :
    status === 'denied' || status === 'unavailable' ? 'Try shake again' : 'Enable shake';
  const help = status === 'ready' ? 'Give your phone three quick shakes to choose a drink.' :
    status === 'waiting' ? 'Waiting for your phone’s motion sensor…' :
    status === 'denied' ? 'Allow motion in your device or browser settings, then try again.' :
    status === 'unavailable' ? 'No motion data arrived. You can still tap the crystal ball.' :
    status === 'insecure' ? 'Open the HTTPS version of the app to enable phone motion.' :
    'Allow motion, then shake your phone to choose a drink.';

  return (
    <View style={styles.wrap}>
      {status !== 'insecure' ? (
        <Pressable onPress={onToggle} disabled={status === 'requesting'} accessibilityRole="button"
          accessibilityLabel={active ? 'Shake is on. Turn off phone shake' : label}
          accessibilityState={{ disabled: status === 'requesting' }} style={styles.button}>
          <Icon name="phone-shake" size={18} color={active ? C.teal : C.accent} />
          <Text style={[styles.label, { color: active ? C.teal : C.accent }]}>{label}</Text>
        </Pressable>
      ) : null}
      <Text accessibilityLiveRegion="polite" style={styles.hint}>{help}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-start', gap: 7, maxWidth: 300 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, borderRadius: R.pill,
    paddingHorizontal: 14, borderWidth: 1, borderColor: C.line2, backgroundColor: C.glass },
  label: { fontFamily: F.medium, fontSize: 12 },
  hint: { color: C.faint, fontFamily: F.regular, fontSize: 11, lineHeight: 17, maxWidth: 300 },
});
