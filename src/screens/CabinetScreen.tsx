import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { C, CATEGORY_COLOR, F, R, S } from '../theme';
import {
  Body,
  Chip,
  Dim,
  EmptyState,
  GhostButton,
  Heading,
  Label,
  Panel,
  PrimaryButton,
  QuantityBar,
  Title,
} from '../components/ui';
import { useData } from '../store';
import { CATALOG } from '../data/catalog';
import { MY_BAR } from '../data/bar';
import {
  CATEGORIES,
  CATEGORY_LABEL,
  Category,
  InventoryItem,
  Level,
} from '../types';
import { countMakeable, countUnlockedBy } from '../logic/generator';
import { CATEGORY_GLYPH, Icon } from '../icons';
import { IngredientArt } from '../components/IngredientArt';
import { artForCatalog } from '../data/art';
import { pluralize } from '../format';

export function CabinetScreen() {
  const {
    kit, recipes, prefs, setPref, addFromCatalog, addCustom, setLevel,
    removeFromKit, restoreKitItem, addStarterKit, loadMyBar,
  } = useData();

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [settings, setSettings] = useState(false);
  const [undo, setUndo] = useState<InventoryItem | null>(null);

  const makeable = useMemo(
    () => countMakeable(recipes, kit, prefs.allowSubstitutes),
    [recipes, kit, prefs.allowSubstitutes]
  );

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATEGORIES.map((cat) => ({
      cat,
      items: kit.filter((k) => k.category === cat && (!q || k.name.toLowerCase().includes(q))),
    })).filter((s) => s.items.length > 0);
  }, [kit, query]);

  const toggleSection = (cat: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });

  const remove = (item: InventoryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    removeFromKit(item.id);
    setUndo(item);
    setTimeout(() => setUndo((u) => (u?.id === item.id ? null : u)), 5000);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Title style={{ flex: 1, fontSize: 24, letterSpacing: 1 }}>MY CABINET</Title>
          <Pressable
            onPress={() => setSettings(true)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Cabinet settings"
          >
            <Icon name="cog-outline" size={20} color={C.dim} />
          </Pressable>
        </View>

        <View style={styles.countRow}>
          <View style={styles.countChip}>
            <Text style={styles.countChipText}>
              {kit.length} {pluralize(kit.length, 'INGREDIENT').toUpperCase()}
            </Text>
          </View>
          <Pressable
            onPress={() => setAdding(true)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.75 }]}
          >
            <Text style={styles.addBtnText}>+ ADD NEW</Text>
          </Pressable>
        </View>

        {kit.length > 0 ? (
          <Dim style={{ marginBottom: S.md }}>
            Pours {makeable} {pluralize(makeable, 'drink')} right now.
          </Dim>
        ) : null}

        {kit.length === 0 ? (
          <EmptyState
            icon="cupboard"
            title="The cabinet is empty"
            body={`Load your bar — all ${MY_BAR.length} bottles, mixers and bitters, with the near-empties already marked low.`}
            action={
              <>
                <PrimaryButton label={`LOAD MY BAR · ${MY_BAR.length}`} onPress={loadMyBar} />
                <GhostButton
                  label="Just the 8-bottle starter kit"
                  onPress={addStarterKit}
                  style={{ marginTop: S.sm }}
                />
                <GhostButton
                  label="Browse everything"
                  onPress={() => setAdding(true)}
                  style={{ marginTop: S.sm }}
                />
              </>
            }
          />
        ) : (
          <>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search the cabinet"
              placeholderTextColor={C.faint}
              style={styles.search}
              accessibilityLabel="Search the cabinet"
            />

            {sections.map(({ cat, items }) => {
              const open = !collapsed.has(cat);
              return (
                <View key={cat} style={{ marginTop: S.lg }}>
                  <Pressable
                    onPress={() => toggleSection(cat)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    style={styles.sectionHead}
                  >
                    <Icon name={CATEGORY_GLYPH[cat]} size={15} color={CATEGORY_COLOR[cat]} />
                    <Text style={[styles.sectionTitle, { color: CATEGORY_COLOR[cat] }]}>
                      {CATEGORY_LABEL[cat].toUpperCase()}
                    </Text>
                    <Text style={styles.sectionCount}>({items.length})</Text>
                    <View style={{ flex: 1 }} />
                    <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={C.faint} />
                  </Pressable>

                  {open ? (
                    <View style={styles.grid}>
                      {items.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          onLevel={(l) => setLevel(item.id, l)}
                          onRemove={() => remove(item)}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}

            {sections.length === 0 ? (
              <Dim style={{ textAlign: 'center', marginTop: S.xl }}>
                Nothing matches “{query.trim()}”.
              </Dim>
            ) : null}
          </>
        )}
      </ScrollView>

      {undo ? (
        <View style={styles.toast}>
          <Body style={{ flex: 1 }} numberOfLines={1}>
            Removed {undo.name}
          </Body>
          <Pressable
            onPress={() => {
              restoreKitItem(undo);
              setUndo(null);
            }}
            accessibilityRole="button"
          >
            <Text style={styles.undoText}>UNDO</Text>
          </Pressable>
        </View>
      ) : null}

      <AddSheet
        visible={adding}
        onClose={() => setAdding(false)}
        ownedIds={new Set(kit.map((k) => k.catalogItemId).filter(Boolean) as string[])}
        onAdd={(id) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          addFromCatalog(id);
        }}
        onAddCustom={addCustom}
        unlocksFor={(id) => countUnlockedBy(id, recipes, kit, prefs.allowSubstitutes)}
      />

      <Modal visible={settings} animationType="slide" transparent onRequestClose={() => setSettings(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={[styles.sheet, { height: 'auto', paddingBottom: S.xxl }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Heading>Settings</Heading>
              <Pressable onPress={() => setSettings(false)} hitSlop={12} accessibilityRole="button">
                <Text style={styles.close}>Done</Text>
              </Pressable>
            </View>
            <View style={{ gap: S.sm, marginTop: S.sm }}>
              <SettingRow
                label="Zero-proof mode"
                hint="Filter everything to non-alcoholic"
                on={prefs.zeroProofMode}
                onToggle={() => setPref('zeroProofMode', !prefs.zeroProofMode)}
              />
              <SettingRow
                label="Allow substitutions"
                hint="Let close-enough bottles satisfy a recipe"
                on={prefs.allowSubstitutes}
                onToggle={() => setPref('allowSubstitutes', !prefs.allowSubstitutes)}
              />
              <SettingRow
                label="Shake to spin"
                hint="Shaking the phone picks a new drink"
                on={prefs.shakeToShake}
                onToggle={() => setPref('shakeToShake', !prefs.shakeToShake)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SettingRow({
  label,
  hint,
  on,
  onToggle,
}: {
  label: string;
  hint: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      style={styles.settingRow}
    >
      <View style={{ flex: 1 }}>
        <Body>{label}</Body>
        <Dim>{hint}</Dim>
      </View>
      <View style={[styles.switch, on && { backgroundColor: C.teal, borderColor: 'transparent' }]}>
        <View style={[styles.knob, on && { alignSelf: 'flex-end', backgroundColor: C.ink }]} />
      </View>
    </Pressable>
  );
}

function ItemCard({
  item,
  onLevel,
  onRemove,
}: {
  item: InventoryItem;
  onLevel: (l: Level) => void;
  onRemove: () => void;
}) {
  return (
    <View style={[styles.card, item.level === 'out' && { opacity: 0.5 }]}>
      <Pressable
        onPress={onRemove}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.name}`}
        style={styles.cardX}
      >
        <Icon name="close" size={13} color={C.faint} />
      </Pressable>

      <View style={styles.cardIcon}>
        <IngredientArt {...artForCatalog(item.catalogItemId, item.category)} size={54} />
      </View>
      <Text style={styles.cardName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.cardMeta}>Remaining quantity</Text>
      <QuantityBar level={item.level} onChange={onLevel} />
    </View>
  );
}

function AddSheet({
  visible,
  onClose,
  ownedIds,
  onAdd,
  onAddCustom,
  unlocksFor,
}: {
  visible: boolean;
  onClose: () => void;
  ownedIds: Set<string>;
  onAdd: (catalogId: string) => void;
  onAddCustom: (name: string, category: Category) => void;
  unlocksFor: (catalogId: string) => number;
}) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | null>(null);
  const [customName, setCustomName] = useState('');

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    return CATALOG.filter((c) => {
      if (cat && c.category !== cat) return false;
      if (query && !c.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [q, cat]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Heading>Add to the cabinet</Heading>
            <Pressable onPress={onClose} accessibilityRole="button" hitSlop={12}>
              <Text style={styles.close}>Done</Text>
            </Pressable>
          </View>

          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search the catalog"
            placeholderTextColor={C.faint}
            style={styles.search}
            accessibilityLabel="Search the catalog"
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View style={styles.catRow}>
              <Chip label="All" active={cat === null} onPress={() => setCat(null)} small />
              {CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  label={CATEGORY_LABEL[c]}
                  active={cat === c}
                  color={CATEGORY_COLOR[c]}
                  onPress={() => setCat(cat === c ? null : c)}
                  small
                />
              ))}
            </View>
          </ScrollView>

          <FlatList
            data={results}
            keyExtractor={(i) => i.id}
            style={{ flex: 1, marginTop: S.md }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const owned = ownedIds.has(item.id);
              const unlocks = owned ? 0 : unlocksFor(item.id);
              return (
                <Pressable
                  onPress={() => !owned && onAdd(item.id)}
                  disabled={owned}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.row, pressed && !owned && { opacity: 0.6 }]}
                >
                  <View style={styles.rowIcon}>
                    <IngredientArt {...artForCatalog(item.id, item.category)} size={32} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Body>{item.name}</Body>
                    <Dim numberOfLines={1}>
                      {unlocks > 0
                        ? `Unlocks ${unlocks} ${pluralize(unlocks, 'drink')}`
                        : item.flavorNotes.length
                          ? item.flavorNotes.join(' · ')
                          : CATEGORY_LABEL[item.category]}
                    </Dim>
                  </View>
                  <Text style={[styles.add, owned && { color: C.faint }]}>
                    {owned ? 'ADDED' : '+ ADD'}
                  </Text>
                </Pressable>
              );
            }}
            ListFooterComponent={
              <View style={styles.customBox}>
                <Label>Not in the list?</Label>
                <TextInput
                  value={customName}
                  onChangeText={setCustomName}
                  placeholder="Type anything you have"
                  placeholderTextColor={C.faint}
                  style={[styles.search, { marginTop: S.sm }]}
                  accessibilityLabel="Custom item name"
                />
                <GhostButton
                  label={`Add as ${CATEGORY_LABEL[cat ?? 'beverage'].toLowerCase()}`}
                  color={C.teal}
                  onPress={() => {
                    if (!customName.trim()) return;
                    onAddCustom(customName, cat ?? 'beverage');
                    setCustomName('');
                  }}
                  style={{ marginTop: S.sm }}
                />
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: S.lg, paddingTop: S.lg, paddingBottom: 130 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: S.md, marginBottom: S.md },


  countRow: { flexDirection: 'row', gap: S.sm, alignItems: 'center' },
  countChip: {
    borderWidth: 1,
    borderColor: C.line2,
    borderRadius: R.pill,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  countChipText: { color: C.dim, fontSize: 10.5, fontWeight: '800', letterSpacing: 1 },
  addBtn: {
    backgroundColor: C.teal,
    borderRadius: R.pill,
    paddingVertical: 8,
    paddingHorizontal: 15,
    shadowColor: C.teal,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  addBtnText: { color: C.ink, fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  search: {
    backgroundColor: C.ink2,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    color: C.text,
    paddingHorizontal: S.md,
    paddingVertical: 11,
    fontSize: 15,
    marginTop: S.md,
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    paddingVertical: S.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },

  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  sectionCount: { color: C.faint, fontSize: 12, fontWeight: '700' },


  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.md },
  card: {
    width: '48.5%',
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.glass,
    padding: S.md,
    gap: 5,
  },
  cardX: { position: 'absolute', top: 6, right: 6, padding: 6, zIndex: 2 },

  cardIcon: { marginBottom: 6, height: 56, justifyContent: 'center' },
  cardName: { color: C.text, fontSize: 13.5, fontWeight: '700', minHeight: 36 },
  cardMeta: { color: C.faint, fontSize: 9.5, letterSpacing: 0.4, marginBottom: 4 },

  toast: {
    position: 'absolute',
    left: S.lg,
    right: S.lg,
    bottom: 96,
    backgroundColor: C.raise,
    borderRadius: R.md,
    padding: S.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    borderWidth: 1,
    borderColor: C.line2,
  },
  undoText: { color: C.teal, fontWeight: '800', fontSize: 12, letterSpacing: 1 },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.panel,
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    padding: S.lg,
    height: '86%',
    borderTopWidth: 1,
    borderColor: C.line2,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: C.line2,
    alignSelf: 'center', marginBottom: S.md,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: S.sm,
  },
  close: { color: C.teal, fontWeight: '800', fontSize: 14 },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  switch: {
    width: 44,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.line2,
    backgroundColor: C.ink2,
    padding: 3,
    justifyContent: 'center',
  },
  knob: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.faint },

  catRow: { flexDirection: 'row', gap: 6, marginTop: S.md, paddingRight: S.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  rowIcon: { width: 34, alignItems: 'center' },
  add: { color: C.teal, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  customBox: {
    marginTop: S.xl,
    marginBottom: S.xxl,
    padding: S.lg,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.glass,
  },
});
