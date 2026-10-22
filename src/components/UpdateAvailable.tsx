import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { AppUpdate } from '../updates/types';
import { C } from '../theme';
import { LineIcon } from './LineIcon';
import { Body, Dim, GhostButton, Heading, Panel, PrimaryButton } from './ui';

export function UpdateAvailable({ update }: { update: AppUpdate }) {
  const { snapshot, apply, dismiss } = update;
  return <View style={styles.wrap} accessibilityLiveRegion="polite">
    {snapshot.dismissed && !snapshot.applying && !snapshot.error
      ? <GhostButton label="Update available · Update now" onPress={apply} />
      : <Panel raised style={{ gap: 10 }}>
        <View style={styles.heading}><LineIcon name="download" size={24} color={C.text} /><Heading>Update available</Heading></View>
        <Body>A fresh version of Shaker is ready.</Body>
        <Dim>Update here to get the latest. Your saved bar and party menus stay on this device.</Dim>
        {snapshot.error ? <Body accessibilityRole="alert">{snapshot.error}</Body> : null}
        <View style={styles.actions}>
          <PrimaryButton label={snapshot.applying ? 'Updating…' : snapshot.error ? 'Try update again' : 'Update now'} onPress={apply} disabled={snapshot.applying} style={{ flex: 1.4 }} />
          {!snapshot.applying ? <GhostButton label="Later" onPress={dismiss} style={{ flex: 1 }} /> : null}
        </View>
      </Panel>}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { width: '92%', maxWidth: 680, alignSelf: 'center', paddingTop: 8 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actions: { flexDirection: 'row', gap: 10 },
});
