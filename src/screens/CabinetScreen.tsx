import { isAlcoholFree } from '../logic/recipes';
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
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { C, CATEGORY_COLOR, F, GLASS, R, S, SCREEN, SHADOW } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
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
  Wordmark,
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
import { ShoppingList } from '../components/ShoppingList';
import { IngredientArt } from '../components/IngredientArt';
import { artForCatalog } from '../data/art';
import { pluralize } from '../format';
import { UpdateSettings } from '../components/UpdateSettings';
import { InventoryImportScreen } from './InventoryImportScreen';
import { InventoryManageScreen } from './InventoryManageScreen';

export type CabinetView = 'stock' | 'shopping';

export function CabinetScreen({
  view,
  onViewChange,
  onLocalBars,
}: {
  view: CabinetView;
  onViewChange: (v: CabinetView) => void;
  onLocalBars: () => void;
}) {
  const {
    profile, kit, recipes, prefs, setPref, addFromCatalog, addCustom, setLevel,
    removeInventoryItems, restoreInventoryItems, addStarterKit, loadMyBar, shopping, addToShopping, storageError,
  } = useData();

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [settings, setSettings] = useState(false);
  const [undo, setUndo] = useState<InventoryItem[]>([]);
  const [inventoryTool, setInventoryTool] = useState<{ mode: 'import' | 'manage'; id?: string } | null>(null);
  const [inventoryNotice, setInventoryNotice] = useState('');
  const { width } = useWindowDimensions();
  const columns = width >= 1000 ? 4 : width >= 700 ? 3 : 2;
  const cardWidth = (Math.min(width, 1120) - 48 - 12 * (columns - 1)) / columns;

  const makeable = useMemo(
    () => countMakeable(recipes, kit, prefs.allowSubstitutes, prefs.zeroProofMode),
    [recipes, kit, prefs.allowSubstitutes, prefs.zeroProofMode]
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
    try { setUndo(removeInventoryItems([item.id])); setInventoryNotice(''); }
    catch (problem) { setInventoryNotice(problem instanceof Error ? problem.message : 'Couldn’t remove this item.'); }
  };
  const undoRemoval = () => {
    restoreInventoryItems(undo); setUndo([]); setInventoryNotice('Inventory restored.');
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.eyebrow}>THE GOOD STUFF</Text>
            <Wordmark>{profile.name}</Wordmark>
            <Dim>Your bottles. Endless possibilities.</Dim>
          </View>
          <Pressable
            onPress={() => setSettings(true)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Cabinet settings"
            style={styles.settingsButton}
          >
            <Icon name="cog-outline" size={20} color={C.dim} />
          </Pressable>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="My local bars and backups" onPress={onLocalBars} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 16, borderWidth: 1, borderColor: C.teal + '66', borderRadius: R.md, backgroundColor: C.panel, marginTop: 16 }}>
          <View style={{ flex: 1, gap: 4 }}><Body style={{ color: C.text }}>Saved on this device</Body><Dim>My local bars · switch · backup & restore</Dim></View><Body style={{ color: C.text }}>→</Body>
        </Pressable>

        <View style={styles.segment}>
          {([
            ['stock', `In stock · ${kit.length}`],
            ['shopping', `Shopping list · ${shopping.length}`],
          ] as const).map(([key, label]) => {
            const on = view === key;
            return (
              <Pressable
                key={key}
                onPress={() => onViewChange(key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }} aria-selected={on}
                style={[styles.segmentTab, on ? styles.segmentTabOn : null]}
              >
                <Text style={[styles.segmentText, on ? styles.segmentTextOn : null]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {view === 'shopping' ? <ShoppingList /> : null}

        {view === 'stock' ? (
          <>
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
            <Icon name="plus" size={16} color={C.onAccent} />
            <Text style={styles.addBtnText}>Add ingredient</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <GhostButton label="Import list" onPress={() => setInventoryTool({ mode: 'import' })} style={{ flex: 1, minWidth: 115 }} />
          <GhostButton label="Edit inventory" onPress={() => setInventoryTool({ mode: 'manage' })} style={{ flex: 1, minWidth: 135 }} />
        </View>
        {inventoryNotice ? <Body accessibilityLiveRegion="polite" style={{ marginBottom: 14 }}>{inventoryNotice}</Body> : null}

        {kit.length > 0 ? (
          <Dim style={{ marginBottom: S.md }}>
            {makeable} {pluralize(makeable, 'recipe')} you can make{prefs.zeroProofMode ? ' · alcohol-free' : ''}.
          </Dim>
        ) : null}

        {kit.length === 0 ? (
          <EmptyState
            icon="cupboard"
            title="The cabinet is empty"
            body="Add the bottles and mixers you own. You can also explore a sample bar to try the app."
            action={
              <>
                <PrimaryButton label="Add what you have" onPress={() => setAdding(true)} />
                <GhostButton label={`Try the owner’s sample bar · ${MY_BAR.length}`} onPress={loadMyBar} style={{ marginTop: S.sm }} />
                <GhostButton
                  label="Try an 8-ingredient sample bar"
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
                    accessibilityState={{ expanded: open }} aria-expanded={open}
                    style={styles.sectionHead}
                  >
                    <Icon name={CATEGORY_GLYPH[cat]} size={15} color={CATEGORY_COLOR[cat]} />
                    <Text style={[styles.sectionTitle, { color: C.text }]}>
                      {CATEGORY_LABEL[cat]}
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
                          width={cardWidth}
                          onLevel={(l) => setLevel(item.id, l)}
                          onRemove={() => remove(item)}
                          onEdit={() => setInventoryTool({ mode: 'manage', id: item.id })}
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
        </>
        ) : null}
      </ScrollView>

      {undo.length && !inventoryTool ? (
        <View style={styles.toast}>
          <Body style={{ flex: 1 }} numberOfLines={1}>
            Removed {undo.length} {undo.length === 1 ? 'item' : 'items'}
          </Body>
          <Pressable
            onPress={() => {
              try { undoRemoval(); } catch (problem) { setInventoryNotice(problem instanceof Error ? problem.message : 'Couldn’t restore inventory.'); }
            }}
            accessibilityRole="button"
            accessibilityLabel="Undo inventory removal"
          >
            <Text style={styles.undoText}>UNDO</Text>
          </Pressable>
        </View>
      ) : null}

      {inventoryTool?.mode === 'import' ? <InventoryImportScreen onClose={() => setInventoryTool(null)} onImported={(message) => { setInventoryNotice(message); setInventoryTool(null); }} /> : inventoryTool?.mode === 'manage' ? <InventoryManageScreen initialId={inventoryTool.id} onClose={() => setInventoryTool(null)} onRemoved={(items) => { setUndo(items); setInventoryNotice(`Removed ${items.length} ${items.length === 1 ? 'item' : 'items'}.`); }} undoCount={undo.length} onUndo={undoRemoval} /> : null}

      <AddSheet
        visible={adding}
        onClose={() => setAdding(false)}
        ownedIds={new Set(kit.map((k) => k.catalogItemId).filter(Boolean) as string[])}
        onAdd={(id) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          addFromCatalog(id);
        }}
        onAddCustom={addCustom}
        onWant={(id, name) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          addToShopping(id, name);
        }}
        unlocksFor={(id) => countUnlockedBy(id, prefs.zeroProofMode ? recipes.filter((r) => isAlcoholFree(r)) : recipes, kit, prefs.allowSubstitutes)}
      />

      <Modal visible={settings} animationType="slide" transparent onRequestClose={() => setSettings(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={[styles.sheet, { height: 'auto', maxHeight: '92%', paddingBottom: 0 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Heading>Settings</Heading>
              <Pressable onPress={() => setSettings(false)} hitSlop={12} accessibilityRole="button">
                <Text style={styles.close}>Done</Text>
              </Pressable>
            </View>
            <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} contentContainerStyle={{ gap: S.sm, paddingTop: S.sm, paddingBottom: S.xxl }}>
              <SettingRow
                label="Zero-proof mode"
                hint="Show confirmed alcohol-free recipes and Mix lab ingredients"
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
                label="Find a drink with the shaker"
                hint="Enable motion on Discover to choose a drink by shaking your phone"
                on={prefs.shakeToShake}
                onToggle={() => setPref('shakeToShake', !prefs.shakeToShake)}
              />
              <UpdateSettings storageError={storageError} />
            </ScrollView>
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
      accessibilityState={{ checked: on }} aria-checked={on}
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
  width,
  onLevel,
  onRemove,
  onEdit,
}: {
  item: InventoryItem;
  width: number;
  onLevel: (l: Level) => void;
  onRemove: () => void;
  onEdit: () => void;
}) {
  return (
    <LinearGradient
      colors={GLASS.card}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.card, { width }, item.level === 'out' ? { opacity: 0.45 } : null]}
    >
      <View style={styles.cardEdge} pointerEvents="none" />
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
        <IngredientArt {...artForCatalog(item.catalogItemId, item.category)} seed={item.name} size={72} />
      </View>
      <Text style={styles.cardName}>
        {item.name}
      </Text>
      {item.brand ? <Text style={styles.cardMeta}>{item.brand}</Text> : null}
      <Text style={[styles.cardMeta, item.level === 'low' && { color: C.text }]}>{({ full: 'Well stocked', half: 'Half remaining', low: 'Running low', out: 'Time to restock' })[item.level]}</Text>
      <QuantityBar name={item.name} level={item.level} onChange={onLevel} />
      <GhostButton label="Edit item" accessibilityLabel={`Edit ${item.name}`} onPress={onEdit} style={{ marginTop: 8 }} />
    </LinearGradient>
  );
}

function AddSheet({
  visible,
  onClose,
  ownedIds,
  onAdd,
  onAddCustom,
  onWant,
  unlocksFor,
}: {
  visible: boolean;
  onClose: () => void;
  ownedIds: Set<string>;
  onAdd: (catalogId: string) => void;
  onAddCustom: (name: string, category: Category) => void;
  onWant: (catalogId: string, name: string) => void;
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
                    <IngredientArt {...artForCatalog(item.id, item.category)} seed={item.name} size={32} />
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
                  {!owned ? (
                    <Pressable
                      onPress={() => onWant(item.id, item.name)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${item.name} to the shopping list`}
                      style={styles.want}
                    >
                      <Icon name="cart-outline" size={15} color={C.dim} />
                    </Pressable>
                  ) : null}
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
                  color={C.text}
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
  scroll: { ...SCREEN },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: S.md, marginBottom: 24 },
  eyebrow: { color: C.text, fontFamily: F.medium, fontSize: 10, letterSpacing: 2 },
  settingsButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },


  countRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, alignItems: 'center' },
  countChip: {
    borderWidth: 1,
    borderColor: C.line2,
    borderRadius: R.pill,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  countChipText: { color: C.dim, fontSize: 10.5, fontWeight: '800', letterSpacing: 1 },
  addBtn: {
    backgroundColor: C.accentDeep,
    borderRadius: R.pill,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  addBtnText: { color: C.onAccent, fontSize: 15, lineHeight: 22, fontFamily: F.semibold },

  segment: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.glass,
    marginBottom: S.lg,
  },
  segmentTab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: R.pill },
  segmentTabOn: { backgroundColor: C.raise },
  segmentText: { color: C.dim, fontSize: 15, lineHeight: 22, fontFamily: F.medium },
  segmentTextOn: { color: C.text },
  want: { padding: 4, marginRight: 2 },
  search: {
    backgroundColor: C.ink2,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    color: C.text,
    paddingHorizontal: S.md,
    paddingVertical: 11,
    fontSize: 16,
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

  sectionTitle: { fontSize: 17, fontFamily: F.medium },
  sectionCount: { color: C.faint, fontSize: 12, fontWeight: '700' },


  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: S.md },
  card: {
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    padding: S.md,
    gap: 5,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  cardEdge: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: C.edge,
  },
  cardX: { position: 'absolute', top: 2, right: 2, padding: 14, zIndex: 2 },

  cardIcon: { marginBottom: 10, height: 84, alignItems: 'center', justifyContent: 'center', borderRadius: R.sm, backgroundColor: C.glass },
  cardName: { color: C.text, fontFamily: F.medium, fontSize: 17, lineHeight: 24, minHeight: 48 },
  cardMeta: { color: C.dim, fontFamily: F.regular, fontSize: 13, lineHeight: 20, marginBottom: 12 },

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
  undoText: { color: C.text, fontWeight: '800', fontSize: 12, letterSpacing: 1 },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
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
  close: { color: C.text, fontWeight: '800', fontSize: 14 },

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
  add: { color: C.text, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
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
