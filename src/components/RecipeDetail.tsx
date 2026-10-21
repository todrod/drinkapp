import React from 'react';
import { View } from 'react-native';
import type { DrinkRecipe } from '../types';
import { C } from '../theme';
import { useData } from '../store';
import { alcoholStatus, isServingReady, recipeIssues } from '../logic/recipes';
import { buildOwned, matchRecipe } from '../logic/generator';
import { formatIngredient } from '../format';
import { MAX_MENU } from '../logic/hosting';
import { Body, Dim, GhostButton, Label, PrimaryButton, Stars } from './ui';
import { Sheet } from './Sheet';
import { RecipeSources } from './RecipeSources';

export function RecipeDetail({ recipe, onClose, onServe, onEdit, onParty, onShopping }: { recipe: DrinkRecipe; onClose: () => void; onServe: (r: DrinkRecipe) => void; onEdit: (r: DrinkRecipe) => void; onParty: () => void; onShopping: () => void }) {
  const { kit, prefs, party, addToParty, toggleFavorite, rateRecipe, removeRecipe, addToShopping } = useData();
  const match = matchRecipe(recipe, buildOwned(kit), prefs.allowSubstitutes);
  const ready = isServingReady(recipe);
  const onMenu = party.entries.some((e) => e.recipeId === recipe.id);
  const status = alcoholStatus(recipe);
  const restricted = prefs.zeroProofMode && status !== 'none';
  return <Sheet title={recipe.name} eyebrow={`${recipe.method} · ${recipe.glass?.replace('gl-', '') ?? 'your favorite glass'}`} onClose={onClose}>
    <Dim style={{ color: status === 'none' ? C.teal : C.dim }}>{status === 'none' ? 'Alcohol-free' : status === 'contains' ? 'Contains alcohol' : 'Alcohol content not confirmed'}{!ready ? ' · Draft' : ''}</Dim>
    <Stars value={recipe.rating} size={20} onRate={(n) => rateRecipe(recipe.id, n)} />
    <RecipeSources recipe={recipe} />
    {!ready ? <Dim style={{ color: C.amber }}>{recipeIssues(recipe).join(' ')}</Dim> : null}
    {restricted ? <Dim style={{ color: C.amber }}>Saved in your notebook. Zero-proof mode excludes this recipe from serving and party menus.</Dim> : null}
    {match.substitutions.map((s, n) => <Body key={n} style={{ color: C.amber }}>On hand: {s.used} for {s.wanted}. Serving measures show the original recipe.</Body>)}
    <Label>Ingredients · one serving</Label>
    {recipe.ingredients.map((ing, n) => <View key={n} style={{ gap: 3 }}><Body>{formatIngredient(ing)}{ing.isOptional ? ' (optional)' : ''}</Body>{match.missing.includes(ing.displayName) ? <Dim style={{ color: C.amber }}>Missing from your bar</Dim> : null}</View>)}
    {match.missing.length ? <GhostButton label="Add missing ingredients to shopping list" onPress={() => {
      recipe.ingredients.filter((i) => match.missing.includes(i.displayName)).forEach((i) => addToShopping(i.catalogItemId, i.displayName));
      onShopping();
    }} /> : null}
    <Label>Method</Label>{recipe.steps.map((s, n) => <Body key={n}>{n + 1}. {s}</Body>)}
    {recipe.garnish ? <Body>Garnish · {recipe.garnish}</Body> : null}
    <PrimaryButton label={!ready ? 'Complete this recipe' : restricted ? 'Back to my notebook' : 'Start mixing'} onPress={() => !ready ? onEdit(recipe) : restricted ? onClose() : onServe(recipe)} />
    {ready && !restricted ? <GhostButton label={onMenu ? 'View party menu' : party.entries.length >= MAX_MENU ? 'Party menu full · manage menu' : 'Add to party menu'} onPress={() => { if (!onMenu) addToParty(recipe.id); onParty(); }} /> : null}
    <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
      <GhostButton label={recipe.isFavorite ? 'Favorited' : 'Favorite'} onPress={() => toggleFavorite(recipe.id)} style={{ flex: 1 }} />
      <GhostButton label={recipe.origin === 'user' ? 'Edit recipe' : 'Make my own copy'} onPress={() => onEdit(recipe)} style={{ flex: 1 }} />
    </View>
    {recipe.origin === 'user' ? <GhostButton label="Delete recipe" color={C.rose} onPress={() => { removeRecipe(recipe.id); onClose(); }} /> : null}
  </Sheet>;
}
