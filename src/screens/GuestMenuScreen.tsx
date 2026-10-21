import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { GuestMenu } from '../logic/guestMenu';
import type { DrinkRecipe } from '../types';
import { alcoholStatus } from '../logic/recipes';
import { C, F, SCREEN } from '../theme';
import { Body, Dim, GhostButton, Label, Panel, PrimaryButton, Wordmark } from '../components/ui';
import { CocktailArt } from '../components/CocktailArt';
import { accentForRecipe } from '../data/liquids';
import { ServingView } from '../components/ServingView';

export function GuestMenuScreen({ menu, onLeave }: { menu: GuestMenu | null; onLeave: () => void }) {
  const [serving, setServing] = useState<DrinkRecipe | null>(null);
  return <View style={{ flex: 1 }}><ScrollView contentContainerStyle={{ ...SCREEN, gap: 24 }}>
    <Label color={C.accent}>Drink shaker · Guest menu</Label>
    <Wordmark>{menu?.title || 'This menu could not be opened'}</Wordmark>
    <Dim>{menu ? 'Tonight’s selection. Choose something that sounds like you.' : 'The link may be incomplete or from a newer version. Ask your host for a fresh menu link.'}</Dim>
    {menu?.recipes.map((recipe) => <Panel key={recipe.id} style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}><CocktailArt color={accentForRecipe(recipe)} glass={recipe.glass} size={84} /><View style={{ flex: 1, gap: 6 }}>
        <Text style={{ fontFamily: F.medium, fontSize: 24, color: C.text }}>{recipe.name}</Text>
        <Dim style={alcoholStatus(recipe) === 'none' ? { color: C.teal } : undefined}>{alcoholStatus(recipe) === 'none' ? 'Alcohol-free' : alcoholStatus(recipe) === 'contains' ? 'Contains alcohol' : 'Ask your host about alcohol content'}</Dim>
      </View></View>
      <Body>{recipe.ingredients.filter((i) => i.role !== 'ice').map((i) => i.displayName).join(' · ')}</Body>
      <GhostButton label={`View recipe · ${recipe.name}`} onPress={() => setServing(recipe)} />
    </Panel>)}
    <Dim>This is a menu snapshot. It doesn’t show or change the host’s stock. Ask your host about ingredients and availability.</Dim>
    <PrimaryButton label="Open my own drink shaker" onPress={onLeave} />
  </ScrollView>{serving ? <ServingView key={serving.id} recipe={serving} guest onClose={() => setServing(null)} /> : null}</View>;
}
