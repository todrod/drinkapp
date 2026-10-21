import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { C, CATEGORY_COLOR, GLASS, R, S, SHADOW, type } from '../theme';
import {
  Body,
  Dim,
  EmptyState,
  GhostButton,
  Label,
  Panel,
  Press,
  PrimaryButton,
} from '../components/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../icons';
import { IngredientArt } from './IngredientArt';
import { artForCatalog } from '../data/art';
import { CATALOG_BY_ID } from '../data/catalog';
import { useData } from '../store';
import { projectList, rankPurchases, unlockedBy } from '../logic/shopping';
import { pluralize } from '../format';
import { ShoppingItem } from '../types';

/**
 * The shopping list.
 *
 * The generator already knows which bottle unlocks the most drinks; this is
 * where that stops being a hint and becomes something you can act on. The
 * headline figure is the *projection* — what the whole list gets you — because
 * two bottles frequently unlock the same drink and summing them would lie.
 */
export function ShoppingList() {
  const {
    kit, recipes, prefs, shopping,
    addToShopping, toggleShoppingDone, removeFromShopping, buyShoppingItem,
    clearBoughtShopping,
  } = useData();

  const [custom, setCustom] = useState('');

  const listedIds = useMemo(
    () => new Set(shopping.map((s) => s.catalogItemId).filter(Boolean) as string[]),
    [shopping]
  );

  const projection = useMemo(
    () => projectList(recipes, kit, Array.from(listedIds), prefs.allowSubstitutes),
    [recipes, kit, listedIds, prefs.allowSubstitutes]
  );

  const suggestions = useMemo(
    () => rankPurchases(recipes, kit, prefs.allowSubstitutes, { exclude: listedIds, limit: 6 }),
    [recipes, kit, prefs.allowSubstitutes, listedIds]
  );

  const gain = projection.projected - projection.current;
  const bought = shopping.filter((s) => s.done).length;

  return (
    <View style={{ gap: S.lg }}>
      {/* ── Projection ──────────────────────────────────────────────────── */}
      {shopping.length > 0 ? (
        <Panel raised style={styles.proj}>
          <View style={styles.projRow}>
            <View>
              <Text style={styles.projNow}>{projection.current}</Text>
              <Label>pourable now</Label>
            </View>
            <Icon name="arrow-right" size={18} color={C.faint} />
            <View>
              <Text style={styles.projNext}>{projection.projected}</Text>
              <Label color={C.teal}>after this list</Label>
            </View>
            <View style={{ flex: 1 }} />
            <View style={styles.gainPill}>
              <Text style={styles.gainText}>+{gain}</Text>
            </View>
          </View>
          <View style={styles.bar}>
            <View
              style={[styles.barNow, { flex: Math.max(projection.current, 0.001) }]}
            />
            <LinearGradient
              colors={[C.tealSoft, C.teal]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.barGain, { flex: Math.max(gain, 0.001) }]}
            />
            <View
              style={[
                styles.barRest,
                { flex: Math.max(projection.total - projection.projected, 0.001) },
              ]}
            />
          </View>
          <Dim style={{ marginTop: S.sm }}>
            {gain > 0
              ? `Buying all ${shopping.length} ${pluralize(shopping.length, 'item')} takes you to ${projection.projected} of ${projection.total}.`
              : `Nothing on this list unlocks a new drink yet — but you may still want it.`}
          </Dim>
        </Panel>
      ) : null}

      {/* ── The list ────────────────────────────────────────────────────── */}
      {shopping.length === 0 ? (
        <EmptyState
          icon="cart-outline"
          title="Nothing on the list"
          body="Add a bottle from the suggestions below, or anywhere you see a missing ingredient."
        />
      ) : (
        <View style={{ gap: S.sm }}>
          {shopping.map((item) => (
            <Row
              key={item.id}
              item={item}
              unlocks={
                item.catalogItemId
                  ? unlockedBy(item.catalogItemId, recipes, kit, prefs.allowSubstitutes)
                  : []
              }
              onToggle={() => {
                Haptics.selectionAsync().catch(() => {});
                toggleShoppingDone(item.id);
              }}
              onBuy={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                buyShoppingItem(item.id);
              }}
              onRemove={() => removeFromShopping(item.id)}
            />
          ))}

          {bought > 0 ? (
            <GhostButton
              label={`Move ${bought} ticked ${pluralize(bought, 'item')} to the cabinet`}
              color={C.teal}
              onPress={() => {
                shopping.filter((s) => s.done).forEach((s) => buyShoppingItem(s.id));
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              }}
              style={{ marginTop: S.sm }}
            />
          ) : null}
        </View>
      )}

      {/* ── Suggestions ─────────────────────────────────────────────────── */}
      {suggestions.length > 0 ? (
        <View>
          <Label>Worth buying next</Label>
          <Dim style={{ marginTop: 3, marginBottom: S.md }}>
            Ranked by how many drinks each one unlocks on its own.
          </Dim>
          <View style={{ gap: S.sm }}>
            {suggestions.map((sug) => (
              <Press
                key={sug.catalogItemId}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  addToShopping(sug.catalogItemId, sug.name);
                }}
                scaleTo={0.98}
                accessibilityRole="button"
                accessibilityLabel={`Add ${sug.name} to the shopping list`}
                style={styles.sug}
              >
                <View style={styles.sugInner}>
                  <IngredientArt
                    {...artForCatalog(sug.catalogItemId, CATALOG_BY_ID[sug.catalogItemId].category)}
                    seed={sug.name}
                    size={30}
                  />
                  <View style={{ flex: 1 }}>
                    <Body>{sug.name}</Body>
                    <Text style={styles.unlocks}>
                      unlocks {sug.unlocks} {pluralize(sug.unlocks, 'drink')}
                    </Text>
                  </View>
                  <Icon name="plus" size={18} color={C.teal} />
                </View>
              </Press>
            ))}
          </View>
        </View>
      ) : null}

      {/* ── Free text ───────────────────────────────────────────────────── */}
      <View>
        <Label>Something else</Label>
        <View style={styles.customRow}>
          <TextInput
            value={custom}
            onChangeText={setCustom}
            placeholder="Anything you need"
            placeholderTextColor={C.faint}
            style={styles.input}
            accessibilityLabel="Add anything to the shopping list"
            onSubmitEditing={() => {
              addToShopping(null, custom);
              setCustom('');
            }}
          />
          <PrimaryButton
            label="ADD"
            onPress={() => {
              addToShopping(null, custom);
              setCustom('');
            }}
            disabled={!custom.trim()}
            style={{ paddingHorizontal: S.lg }}
          />
        </View>
      </View>
    </View>
  );
}

function Row({
  item,
  unlocks,
  onToggle,
  onBuy,
  onRemove,
}: {
  item: ShoppingItem;
  unlocks: string[];
  onToggle: () => void;
  onBuy: () => void;
  onRemove: () => void;
}) {
  const cat = item.catalogItemId ? CATALOG_BY_ID[item.catalogItemId] : null;

  return (
    <LinearGradient
      colors={GLASS.card}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.row, item.done ? { opacity: 0.55 } : null]}
    >
      <View style={styles.rowEdge} pointerEvents="none" />

      <Pressable
        onPress={onToggle}
        hitSlop={10}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.done }}
        accessibilityLabel={`${item.name}, ${item.done ? 'bought' : 'not bought'}`}
        style={[styles.check, item.done ? styles.checkOn : null]}
      >
        {item.done ? <Icon name="check" size={13} color={C.ink} /> : null}
      </Pressable>

      {cat ? (
        <IngredientArt {...artForCatalog(item.catalogItemId, cat.category)} seed={item.name} size={28} />
      ) : (
        <Icon name="cart-outline" size={20} color={C.faint} />
      )}

      <View style={{ flex: 1 }}>
        <Body style={item.done ? styles.struck : undefined}>{item.name}</Body>
        {unlocks.length > 0 ? (
          <Text style={styles.unlocks} numberOfLines={1}>
            unlocks {unlocks.slice(0, 2).join(', ')}
            {unlocks.length > 2 ? ` +${unlocks.length - 2} more` : ''}
          </Text>
        ) : cat ? (
          <Dim>{cat.flavorNotes.slice(0, 3).join(' · ') || 'no new drinks on its own'}</Dim>
        ) : null}
      </View>

      <Pressable
        onPress={onBuy}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Move ${item.name} into the cabinet`}
        style={styles.gotIt}
      >
        <Text style={styles.gotItText}>GOT IT</Text>
      </Pressable>

      <Pressable
        onPress={onRemove}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.name} from the list`}
      >
        <Icon name="close" size={14} color={C.faint} />
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  proj: { gap: S.sm },
  projRow: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  projNow: { color: C.text, fontFamily: type.h1.fontFamily, fontSize: 26, lineHeight: 29 },
  projNext: { color: C.teal, fontFamily: type.h1.fontFamily, fontSize: 26, lineHeight: 29 },
  gainPill: {
    borderWidth: 1,
    borderColor: C.teal,
    borderRadius: R.pill,
    paddingVertical: 4,
    paddingHorizontal: 11,
  },
  gainText: { color: C.teal, ...type.label, fontSize: 12 },
  bar: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: S.md },
  barNow: { backgroundColor: C.tealDeep },
  barGain: {},
  barRest: { backgroundColor: 'rgba(255,255,255,0.07)' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    padding: S.md,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  rowEdge: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: C.edge,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: C.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: C.teal, borderColor: 'transparent' },
  struck: { textDecorationLine: 'line-through', color: C.dim },
  unlocks: { color: C.teal, ...type.label, fontSize: 9.5, letterSpacing: 0.9, marginTop: 2 },
  gotIt: {
    borderWidth: 1,
    borderColor: C.line2,
    borderRadius: R.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  gotItText: { color: C.teal, ...type.label, fontSize: 9 },

  sug: { borderRadius: R.md },
  sugInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    padding: S.md,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.glass,
  },

  customRow: { flexDirection: 'row', gap: S.sm, marginTop: S.sm, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: C.ink2,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    color: C.text,
    paddingHorizontal: S.md,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: type.body.fontFamily,
  },
});
