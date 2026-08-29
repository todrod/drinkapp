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
import { C, CATEGORY_COLOR, F, LEVEL_COLOR, R, S } from '../theme';
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
  ScreenHeader,
} from '../components/ui';
import { useData } from '../store';
import { CATALOG } from '../data/catalog';
import { MY_BAR } from '../data/bar';
import {
  CATEGORIES,
  CATEGORY_ICON,
  CATEGORY_LABEL,
  Category,
  InventoryItem,
} from '../types';
import { countMakeable } from '../logic/generator';
import { pluralize } from '../format';

export function KitScreen() {
  const {
    kit, recipes, prefs, addFromCatalog, addCustom, cycleLevel, removeFromKit,
    restoreKitItem, addStarterKit, loadMyBar,
  } = useData();

  const [filter, setFilter] = useState<Category | null>(null);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [undo, setUndo] = useState<InventoryItem | null>(null);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const k of kit) map[k.category] = (map[k.category] ?? 0) + 1;
    return map;
  }, [kit]);

  const makeable = useMemo(
    () => countMakeable(recipes, kit, prefs.allowSubstitutes),
    [recipes, kit, prefs.allowSubstitutes]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return kit.filter((k) => {
      if (filter && k.category !== filter) return false;
      if (q && !k.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [kit, filter, query]);

  const remove = (item: InventoryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    removeFromKit(item.id);
    setUndo(item);
    setTimeout(() => setUndo((u) => (u?.id === item.id ? null : u)), 5000);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="My Kit"
          subtitle={
            kit.length
              ? `${kit.length} ${pluralize(kit.length, 'item')} · pours ${makeable} ${pluralize(makeable, 'drink')}`
              : 'Your drink pantry'
          }
        />

        <View style={styles.tiles}>
          {CATEGORIES.map((cat) => {
            const on = filter === cat;
            const n = counts[cat] ?? 0;
            return (
              <Pressable
                key={cat}
                onPress={() => setFilter(on ? null : cat)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={({ pressed }) => [
                  styles.tile,
                  on && { borderColor: CATEGORY_COLOR[cat], backgroundColor: CATEGORY_COLOR[cat] + '1A' },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.tileIcon}>{CATEGORY_ICON[cat]}</Text>
                <Text style={[styles.tileLabel, on && { color: C.text }]} numberOfLines={1}>
                  {CATEGORY_LABEL[cat].toUpperCase()}
                </Text>
                {n > 0 ? (
                  <View style={[styles.tileBadge, { backgroundColor: CATEGORY_COLOR[cat] }]}>
                    <Text style={styles.tileBadgeText}>{n}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {kit.length === 0 ? (
          <EmptyState
            icon="🧃"
            title="Nothing on the shelf"
            body={`Load your bar — all ${MY_BAR.length} bottles, mixers and bitters, with the near-empties already marked low.`}
            action={
              <>
                <PrimaryButton label={`Load my bar · ${MY_BAR.length} items`} onPress={loadMyBar} />
                <GhostButton label="Just the 8-bottle starter kit" onPress={addStarterKit} style={{ marginTop: S.sm }} />
                <GhostButton label="Browse everything" onPress={() => setAdding(true)} style={{ marginTop: S.sm }} />
              </>
            }
          />
        ) : (
          <>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search your kit"
              placeholderTextColor={C.faint}
              style={styles.search}
              accessibilityLabel="Search your kit"
            />

            <View style={styles.grid}>
              {visible.map((item) => (
                <KitCard
                  key={item.id}
                  item={item}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    cycleLevel(item.id);
                  }}
                  onLongPress={() => remove(item)}
                />
              ))}
            </View>

            {visible.length === 0 ? (
              <Dim style={{ textAlign: 'center', marginTop: S.lg }}>
                Nothing here yet in {filter ? CATEGORY_LABEL[filter].toLowerCase() : 'that search'}.
              </Dim>
            ) : null}

            <PrimaryButton label="Add more" onPress={() => setAdding(true)} style={{ marginTop: S.lg }} />
            <Dim style={styles.tip}>
              Tap an item to change its level. Hold to remove.
            </Dim>
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
        onAddCustom={(name, cat) => addCustom(name, cat)}
      />
    </View>
  );
}

function KitCard({
  item,
  onPress,
  onLongPress,
}: {
  item: InventoryItem;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const color = LEVEL_COLOR[item.level];
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.level}`}
      accessibilityHint="Tap to change level, hold to remove"
      style={({ pressed }) => [
        styles.card,
        item.level === 'out' && { opacity: 0.45 },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={styles.cardIcon}>{item.icon}</Text>
      <Text style={styles.cardName} numberOfLines={2}>
        {item.name}
      </Text>
      <View style={styles.levelRow}>
        <View style={[styles.levelDot, { backgroundColor: color }]} />
        <Text style={[styles.levelText, { color }]}>{item.level.toUpperCase()}</Text>
      </View>
    </Pressable>
  );
}

function AddSheet({
  visible,
  onClose,
  ownedIds,
  onAdd,
  onAddCustom,
}: {
  visible: boolean;
  onClose: () => void;
  ownedIds: Set<string>;
  onAdd: (catalogId: string) => void;
  onAddCustom: (name: string, category: Category) => void;
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
            <Heading>Add to your kit</Heading>
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
              return (
                <Pressable
                  onPress={() => !owned && onAdd(item.id)}
                  disabled={owned}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.row, pressed && !owned && { opacity: 0.6 }]}
                >
                  <Text style={styles.rowIcon}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Body>{item.name}</Body>
                    <Dim numberOfLines={1}>
                      {item.flavorNotes.length ? item.flavorNotes.join(' · ') : CATEGORY_LABEL[item.category]}
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
                  color={C.lime}
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
  scroll: { padding: S.lg, paddingTop: S.xl, paddingBottom: 140 },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.sm,
    marginBottom: S.lg,
  },
  tile: {
    width: '31.5%',
    aspectRatio: 1.35,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.glass,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tileIcon: { fontSize: 21 },
  tileLabel: { color: C.dim, fontSize: 9.5, letterSpacing: 0.9, fontWeight: '700' },
  tileBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tileBadgeText: { color: C.ink, fontSize: 10, fontWeight: '800' },
  search: {
    backgroundColor: C.ink2,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    color: C.text,
    paddingHorizontal: S.md,
    paddingVertical: 11,
    fontSize: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.sm,
    marginTop: S.lg,
  },
  card: {
    width: '31.5%',
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.glass,
    padding: S.md,
    gap: 6,
    minHeight: 110,
  },
  cardIcon: { fontSize: 24 },
  cardName: { color: C.text, fontSize: 13, fontWeight: '600', flex: 1 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  levelDot: { width: 6, height: 6, borderRadius: 3 },
  levelText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  tip: { textAlign: 'center', marginTop: S.md, color: C.faint },
  toast: {
    position: 'absolute',
    left: S.lg,
    right: S.lg,
    bottom: 100,
    backgroundColor: C.raise,
    borderRadius: R.sm,
    padding: S.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    borderWidth: 1,
    borderColor: C.line2,
  },
  undoText: { color: C.lime, fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.panel,
    borderTopLeftRadius: R.lg,
    borderTopRightRadius: R.lg,
    padding: S.lg,
    height: '86%',
    borderTopWidth: 1,
    borderColor: C.line2,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.line2,
    alignSelf: 'center',
    marginBottom: S.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: S.md,
  },
  close: { color: C.lime, fontWeight: '700', fontSize: 14 },
  catRow: { flexDirection: 'row', gap: 6, marginTop: S.md, paddingRight: S.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  rowIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  add: { color: C.lime, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
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
