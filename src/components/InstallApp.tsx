import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C, F, R } from '../theme';
import type { AppInstall, InstallPlatform } from '../install/types';
import { Body, Chip, Dim, GhostButton, Heading, Label, Panel, PrimaryButton } from './ui';
import { Sheet } from './Sheet';

const STEPS: Record<InstallPlatform, string[]> = {
  ios: [
    'Open this website in Safari on your iPhone or iPad.',
    'Tap Share (the square with an upward arrow). Depending on your layout, open the Page Menu or More first.',
    'Choose Add to Home Screen. You may need to scroll down the share sheet.',
    'Turn on Open as Web App if shown, then tap Add. Open Shaker from your Home Screen.',
  ],
  android: [
    'Open this website in Chrome on your phone.',
    'Open the browser menu (⋮), then look for Install app or Add to Home screen.',
    'Choose Install when offered, then open Shaker from your home screen or app list.',
  ],
  desktop: [
    'Open this website in Chrome or Microsoft Edge.',
    'Look for the install icon in the address bar, or open the browser menu and look for Install app or Apps.',
    'Confirm in the browser’s install dialog. If installation is unavailable, keep using the website or bookmark it.',
  ],
};

export function InstallInvite({ onInstall, onDismiss }: { onInstall: () => void; onDismiss: () => void }) {
  return <View style={styles.invite} accessibilityLiveRegion="polite">
    <Panel raised style={{ gap: 10 }}>
      <Heading>Keep Shaker one tap away?</Heading>
      <Dim>Add it to your home screen. Free, no account.</Dim>
      <View style={styles.actions}>
        <PrimaryButton label="Install app" onPress={onInstall} style={{ flex: 1 }} />
        <GhostButton label="Not now" onPress={onDismiss} style={{ flex: 1 }} />
      </View>
    </Panel>
  </View>;
}

export function InstallAppScreen({ install, onClose, onBackup }: { install: AppInstall; onClose: () => void; onBackup: () => void }) {
  const { snapshot, requestInstall } = install;
  const [platform, setPlatform] = useState<InstallPlatform>(snapshot.platform);
  const [notice, setNotice] = useState('');
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const request = async () => {
    const outcome = await requestInstall();
    if (!mounted.current) return;
    setNotice(outcome === 'accepted' ? 'Install request accepted. Finish any browser instructions, then open Shaker from your home screen or app list.'
      : outcome === 'dismissed' ? 'No problem. You can install later from the Install app button.'
      : outcome === 'error' ? 'The browser couldn’t open its install dialog. Use the steps below instead.'
      : outcome === 'installed' ? 'Shaker is installed. Open it from your home screen or app list.'
      : outcome === 'busy' ? 'Finish the install dialog already open in your browser.'
      : 'Use your browser’s menu and the steps below to install.');
  };
  return <Sheet title="Install Drink Shaker" eyebrow="Your bar, one tap away" onClose={onClose}>
    <Panel raised style={{ gap: 10 }}>
      <Heading>{snapshot.installed ? 'Shaker is installed' : 'An app icon for your home screen'}</Heading>
      <Body>Free, no account. Opens as an app, with recipes available offline after setup.</Body>
      <Dim>This installs the web app directly from this site.</Dim>
    </Panel>
    {snapshot.canPrompt || snapshot.prompting ? <PrimaryButton label={snapshot.prompting ? 'Check your browser’s install dialog…' : 'Install on this device'} disabled={snapshot.prompting} onPress={request} /> : null}
    {notice ? <Body accessibilityLiveRegion="polite">{notice}</Body> : null}
    {!snapshot.installed ? <>
      <Label>Install instructions for</Label>
      <View style={styles.platforms}>{([['ios', 'iPhone / iPad'], ['android', 'Android'], ['desktop', 'Computer']] as const).map(([key, label]) => <Chip key={key} label={label} active={platform === key} onPress={() => setPlatform(key)} />)}</View>
      {STEPS[platform].map((step, i) => <View key={step} style={styles.step}><Text style={styles.number}>{i + 1}</Text><Body style={{ flex: 1 }}>{step}</Body></View>)}
      <Dim>Inside another app’s browser? Open the page in Safari or Chrome first. Your browser decides which install options are available.</Dim>
      <Panel style={{ gap: 10 }}>
        <Heading>Bringing your current bar?</Heading>
        <Dim>Saved data can be separate in an installed app. Export a backup first, then restore it if the app opens with an empty bar.</Dim>
        <GhostButton label="Back up my bar" onPress={onBackup} />
      </Panel>
    </> : <GhostButton label="Done" onPress={onClose} />}
  </Sheet>;
}

const styles = StyleSheet.create({
  invite: { width: '92%', maxWidth: 680, alignSelf: 'center', paddingTop: 8 },
  actions: { flexDirection: 'row', gap: 10 },
  platforms: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  number: { color: C.text, fontFamily: F.medium, fontSize: 17, lineHeight: 26, width: 26, textAlign: 'center', borderRadius: R.sm, backgroundColor: C.raise },
});
