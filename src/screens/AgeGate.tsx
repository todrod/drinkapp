import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { C, F, R, S, type } from '../theme';
import { Icon } from '../icons';
import { Body, Dim, Label, Panel, PrimaryButton, Title } from '../components/ui';

/**
 * Blocking age gate, first launch only. The accepted date is stored locally
 * and never leaves the device.
 */
export function AgeGate({ onAccept }: { onAccept: () => void }) {
  const [year, setYear] = useState('');
  const [blocked, setBlocked] = useState(false);

  const thisYear = new Date().getFullYear();
  const parsed = parseInt(year, 10);
  const valid = year.length === 4 && parsed > 1900 && parsed <= thisYear;
  const age = valid ? thisYear - parsed : 0;

  if (blocked) {
    return (
      <View style={styles.wrap}>
        <View style={styles.center}>
          <Icon name="glass-cocktail" size={54} color={C.teal} style={styles.mark} />
          <Title style={{ textAlign: 'center' }}>Come back another time</Title>
          <Dim style={styles.blockedBody}>
            The Drink Shaker is for people of legal drinking age. There's nothing
            here for you yet.
          </Dim>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.center}>
        <Icon name="glass-cocktail" size={54} color={C.teal} style={styles.mark} />
        <Title style={{ textAlign: 'center' }}>The Drink Shaker</Title>
        <Dim style={{ textAlign: 'center', marginTop: S.sm, maxWidth: 300 }}>
          Recipes, your bar inventory, and a generator that only pours what you
          already own.
        </Dim>

        <Panel style={styles.panel}>
          <Label>What year were you born?</Label>
          <TextInput
            value={year}
            onChangeText={(t) => setYear(t.replace(/[^0-9]/g, '').slice(0, 4))}
            placeholder="YYYY"
            placeholderTextColor={C.faint}
            keyboardType="number-pad"
            style={styles.input}
            accessibilityLabel="Year of birth"
            maxLength={4}
          />
          <PrimaryButton
            label="Continue"
            disabled={!valid}
            onPress={() => {
              if (age >= 21) onAccept();
              else setBlocked(true);
            }}
          />
          <Dim style={styles.fine}>
            Stored on this device only. Never uploaded.
          </Dim>
        </Panel>

        <Dim style={styles.fine}>Please drink responsibly.</Dim>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    // Transparent so the app's ambient gradient shows through.
    flex: 1,
    justifyContent: 'center',
    padding: S.xl,
  },
  center: {
    alignItems: 'center',
  },
  mark: { marginBottom: S.md },
  panel: {
    marginTop: S.xl,
    width: '100%',
    maxWidth: 360,
    gap: S.md,
  },
  input: {
    backgroundColor: C.ink2,
    borderWidth: 1,
    borderColor: C.line2,
    borderRadius: R.sm,
    color: C.text,
    fontFamily: F.display,
    fontSize: 26,
    letterSpacing: 6,
    textAlign: 'center',
    paddingVertical: 12,
  },
  fine: {
    textAlign: 'center',
    color: C.faint,
    fontSize: 12,
    marginTop: S.md,
  },
  blockedBody: {
    textAlign: 'center',
    marginTop: S.md,
    maxWidth: 300,
  },
});
