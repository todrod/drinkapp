import React, { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake, isAvailableAsync } from 'expo-keep-awake';
import type { DrinkRecipe } from '../types';
import { C, F } from '../theme';
import { useData } from '../store';
import { batchLineLabel, batchRecipe, prepAdvice } from '../logic/hosting';
import { alcoholStatus } from '../logic/recipes';
import { Body, Dim, GhostButton, Label, Panel, PrimaryButton } from './ui';
import { Sheet } from './Sheet';

export function ServingView({ recipe, servings = 1, unit = 'ml', guest = false, onClose }: {
  recipe: DrinkRecipe; servings?: number; unit?: 'ml' | 'oz'; guest?: boolean; onClose: () => void;
}) {
  const { markMade, undoMade } = useData();
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const completionGuard = useRef(false);
  const [awake, setAwake] = useState(false);
  const [notice, setNotice] = useState('');
  const alive = useRef(true);
  const wakeWanted = useRef(false);
  const wakeTag = useRef('serving-' + Math.random().toString(36).slice(2)).current;
  const previousLastMadeAt = useRef(recipe.lastMadeAt);
  const lines = batchRecipe(recipe, servings, unit);
  const isLastStep = step >= recipe.steps.length - 1;
  const alcohol = alcoholStatus(recipe);

  useEffect(() => {
    alive.current = true;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && wakeWanted.current) activateKeepAwakeAsync(wakeTag).catch(() => { if (alive.current) { setAwake(false); setNotice('Screen sleep prevention is unavailable.'); } });
    });
    return () => { alive.current = false; wakeWanted.current = false; subscription.remove(); deactivateKeepAwake(wakeTag).catch(() => {}); };
  }, [wakeTag]);

  const toggleAwake = async () => {
    if (wakeWanted.current) {
      wakeWanted.current = false; setAwake(false); setNotice('Screen sleep prevention is off.'); deactivateKeepAwake(wakeTag).catch(() => {}); return;
    }
    wakeWanted.current = true;
    try {
      if (!await isAvailableAsync()) throw new Error('unsupported');
      await activateKeepAwakeAsync(wakeTag);
      if (alive.current && wakeWanted.current) { setAwake(true); setNotice('Screen sleep prevention is on while this view is open.'); }
      else deactivateKeepAwake(wakeTag).catch(() => {});
    } catch {
      wakeWanted.current = false;
      if (alive.current) { setAwake(false); setNotice('Your browser cannot keep the screen awake here.'); }
    }
  };
  return <Sheet title={recipe.name} eyebrow={`Serving view · ${servings === 1 ? 'one glass' : `${servings} planned servings`}`} onClose={onClose} closeLabel={guest ? 'Back to menu' : 'Done'}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
      <Dim>{recipe.method.toUpperCase()} · {recipe.glass?.replace('gl-', '') ?? 'your favorite glass'}</Dim>
      <Pressable accessibilityRole="switch" accessibilityLabel="Keep screen awake" aria-checked={awake} accessibilityState={{ checked: awake }} onPress={toggleAwake} style={{ minHeight: 44, padding: 10 }}><Body style={{ color: C.text }}>{awake ? 'Screen awake ✓' : 'Keep screen awake'}</Body></Pressable>
    </View>
    {notice ? <Dim accessibilityLiveRegion="polite">{notice}</Dim> : null}
    <Dim style={{ color: alcohol === 'none' ? C.text : C.dim }}>{alcohol === 'none' ? 'Alcohol-free' : alcohol === 'contains' ? 'Contains alcohol' : 'Alcohol content not confirmed'}</Dim>
    <Label>{servings > 1 ? 'Total ingredients · recipe as written' : 'Ingredients · recipe as written'}</Label>
    {lines.map((line) => <Text key={line.key} style={{ color: C.text, fontFamily: F.medium, fontSize: 21, lineHeight: 29 }}>{batchLineLabel(line)}</Text>)}
    {servings > 1 ? <Panel style={{ gap: 10 }}><Label>Prep & service</Label><Body>{prepAdvice(recipe)}</Body><Dim>The steps below describe one glass. Use one portion of the batch per glass; any measurements written inside the steps are for the original recipe.</Dim></Panel> : null}
    <Panel raised style={{ gap: 18 }}>
      <Label color={C.text}>Step {step + 1} of {recipe.steps.length}</Label>
      <Text accessibilityLiveRegion="polite" style={{ fontSize: 25, lineHeight: 35, fontFamily: F.medium, color: C.text }}>{recipe.steps[step]}</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {step > 0 ? <GhostButton label="Previous step" onPress={() => setStep((s) => s - 1)} style={{ flex: 1 }} /> : null}
        {!isLastStep ? <PrimaryButton label="Next step" onPress={() => setStep((s) => s + 1)} style={{ flex: 1 }} /> : null}
      </View>
    </Panel>
    {recipe.garnish ? <Body>Finish · {recipe.garnish}{servings > 1 ? ' · for each glass' : ''}</Body> : null}
    {guest ? <GhostButton label="Back to the menu" onPress={onClose} /> : completed ? <Panel accent={C.teal} style={{ gap: 12 }}>
      <Body accessibilityLiveRegion="polite" style={{ color: C.text }}>✓ Marked as made. Enjoy your gathering.</Body>
      <GhostButton label="Undo mark as made" onPress={() => {
        if (!completionGuard.current) return;
        completionGuard.current = false; undoMade(recipe.id, previousLastMadeAt.current); setCompleted(false);
      }} />
    </Panel> : <PrimaryButton label="Mark as made" disabled={!isLastStep} onPress={() => {
      if (completionGuard.current) return;
      completionGuard.current = true; markMade(recipe.id); setCompleted(true);
    }} />}
    {!guest && !completed && !isLastStep ? <Dim>Follow the steps, then mark this preparation as made.</Dim> : null}
  </Sheet>;
}
