import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { C, F, R } from '../theme';
import { PARTY_GAG_DURATION_MS, partyGagSecondsLeft, pickPartyGagResult, type PartyGagResult } from '../logic/partyGag';
import { Body, Dim, GhostButton, Heading, Label, Panel, PrimaryButton } from '../components/ui';
import { Sheet } from '../components/Sheet';

type Phase = 'idle' | 'countdown' | 'result';
const TOTAL_SECONDS = PARTY_GAG_DURATION_MS / 1_000;

export function PartyGagScreen({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [result, setResult] = useState<PartyGagResult | null>(null);
  const [notice, setNotice] = useState('');
  const deadline = useRef<number | null>(null);
  const running = useRef(false);

  const cancel = useCallback(() => {
    running.current = false;
    deadline.current = null;
    setPhase('idle');
    setSecondsLeft(TOTAL_SECONDS);
    setNotice('Countdown canceled. No result was generated.');
  }, []);

  useEffect(() => {
    if (phase !== 'countdown') return;
    const tick = () => {
      if (!running.current || deadline.current === null) return;
      const left = partyGagSecondsLeft(deadline.current, Date.now());
      setSecondsLeft(left);
      if (left === 0) {
        running.current = false;
        deadline.current = null;
        setResult(pickPartyGagResult());
        setPhase('result');
      }
    };
    const timer = setInterval(tick, 100);
    const subscription = AppState.addEventListener('change', (state) => {
      // A backgrounded countdown must not reveal an unattended, stale result.
      if (state !== 'active') cancel();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
      running.current = false;
      deadline.current = null;
    };
  }, [phase, cancel]);

  const start = () => {
    if (running.current) return;
    running.current = true;
    deadline.current = Date.now() + PARTY_GAG_DURATION_MS;
    setResult(null);
    setNotice('');
    setSecondsLeft(TOTAL_SECONDS);
    setPhase('countdown');
  };

  return <Sheet title="Drunk Test" eyebrow="Fun mode · pretend test" onClose={onClose}>
    <View style={styles.badge}><Label color={C.text}>Party gag · just for laughs</Label></View>
    <Body style={styles.center}>A pretend blow test with a completely made-up party score.</Body>
    <Panel raised style={{ gap: 20, alignItems: 'center' }}>
      {phase === 'result' && result ? <View accessibilityLiveRegion="polite" style={styles.result}>
        <Label color={C.text}>Random nonsense score</Label>
        <View style={styles.dial}>
          <Text style={styles.score}>{result.score}</Text>
          <Dim>/ 100 · party energy</Dim>
        </View>
        <Text accessibilityRole="header" style={styles.verdict}>{result.title}</Text>
        <Body style={styles.center}>{result.detail}</Body>
      </View> : <>
        <Svg width={160} height={120} viewBox="0 0 160 120" accessible={false}>
          <Rect x={78} y={10} width={62} height={100} rx={16} fill={C.ink2} stroke={C.accent} strokeWidth={3} />
          <Path d="M99 20h20M103 100h12" stroke={C.dim} strokeWidth={3} strokeLinecap="round" />
          <Path d="M16 48h32c20 0 20-24 5-24-8 0-11 4-11 9M10 64h66M24 80h23c19 0 19 22 4 22-8 0-11-4-11-8" fill="none" stroke={C.text} strokeWidth={4} strokeLinecap="round" />
        </Svg>
        {phase === 'countdown' ? <>
          <Text accessibilityLiveRegion="polite" style={styles.countdown}>{secondsLeft} {secondsLeft === 1 ? 'second' : 'seconds'}</Text>
          <Heading style={styles.center}>Blow gently… or just watch.</Heading>
          <View style={styles.progress} accessible accessibilityRole="progressbar" accessibilityLabel="Pretend countdown" accessibilityValue={{ min: 0, max: TOTAL_SECONDS, now: TOTAL_SECONDS - secondsLeft, text: `${secondsLeft} seconds remaining` }}>
            <View style={[styles.progressFill, { width: `${(1 - secondsLeft / TOTAL_SECONDS) * 100}%` }]} />
          </View>
          <Dim style={styles.center}>The countdown is pretend. Nothing is being measured.</Dim>
        </> : <>
          <Heading style={styles.center}>Ready for some nonsense?</Heading>
          <Body style={styles.center}>Blow gently toward the phone for {TOTAL_SECONDS} seconds—or just watch the countdown.</Body>
        </>}
      </>}
    </Panel>
    {notice ? <Dim accessibilityLiveRegion="polite">{notice}</Dim> : null}
    {phase === 'countdown' ? <GhostButton label="Cancel countdown" onPress={cancel} /> : <PrimaryButton label={phase === 'result' ? 'Play again' : 'Start the pretend test'} onPress={start} />}
    <Panel style={{ gap: 8 }}>
      <Label color={C.text}>Zero science. All silliness.</Label>
      <Dim>No microphone, recording or breath sensor is used. The result is random and says nothing about BAC or sobriety. Never use it to decide whether to drive.</Dim>
    </Panel>
  </Sheet>;
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: C.accent, borderRadius: R.pill, backgroundColor: C.raise },
  center: { textAlign: 'center' },
  result: { width: '100%', alignItems: 'center', gap: 18 },
  dial: { width: 200, minHeight: 200, borderRadius: 100, borderWidth: 2, borderColor: C.accent, backgroundColor: C.ink2, alignItems: 'center', justifyContent: 'center', gap: 4 },
  score: { fontFamily: F.semibold, fontSize: 68, lineHeight: 78, color: C.text },
  countdown: { fontFamily: F.semibold, fontSize: 36, lineHeight: 44, color: C.text, textAlign: 'center' },
  verdict: { fontFamily: F.semibold, fontSize: 24, lineHeight: 32, color: C.text, textAlign: 'center' },
  progress: { width: '100%', height: 8, overflow: 'hidden', borderRadius: R.pill, backgroundColor: C.ink3 },
  progressFill: { height: '100%', borderRadius: R.pill, backgroundColor: C.accent },
});
