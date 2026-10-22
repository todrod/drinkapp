import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { C, S } from '../theme';
import { Body, Dim, GhostButton, Heading, PrimaryButton } from './ui';

export function UpdateSettings({ storageError }: { storageError: string | null }) {
  const { snapshot, check, apply } = useAppUpdate();
  if (!snapshot.supported) return null;
  const message = snapshot.checking ? 'Checking for updates…'
    : snapshot.available ? 'Update available. The latest version is ready.'
    : snapshot.checkResult === 'current' ? 'You’re up to date.'
    : snapshot.checkResult === 'offline' ? 'You’re offline. Connect to the internet, then try again.'
    : snapshot.checkResult === 'error' ? 'Couldn’t check for updates. Check your connection and try again.'
    : 'Check for the latest version of Shaker.';
  return <View style={styles.section}>
    <Heading>App updates</Heading>
    <Body accessibilityLiveRegion="polite">{message}</Body>
    {snapshot.available ? <>
      <Dim>Your saved bar and party menus stay on this device.</Dim>
      {snapshot.error ? <Body accessibilityRole="alert">{snapshot.error}</Body> : null}
      {storageError ? <Dim>Resolve the device storage warning before updating.</Dim> : null}
      <PrimaryButton label={snapshot.applying ? 'Updating…' : snapshot.error ? 'Try update again' : 'Update now'} onPress={apply} disabled={snapshot.applying || !!storageError} />
    </> : null}
    <GhostButton label={snapshot.checking ? 'Checking for updates…' : 'Check for updates'} onPress={() => { void check(); }} disabled={snapshot.checking || snapshot.applying} />
    {snapshot.available && snapshot.checkResult === 'offline' ? <Dim>You’re offline, but this update has already downloaded and can be applied.</Dim> : null}
    {snapshot.available && snapshot.checkResult === 'error' ? <Dim>Couldn’t check for a newer update. You can still apply the version already downloaded.</Dim> : null}
  </View>;
}

const styles = StyleSheet.create({
  section: { borderTopWidth: 1, borderTopColor: C.line, marginTop: S.md, paddingTop: S.lg, gap: S.sm },
});
