import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { C, F, R, S } from '../theme';
import {
  Body,
  Chip,
  Dim,
  GhostButton,
  Label,
  Panel,
  PrimaryButton,
  ScreenHeader,
  Title,
} from '../components/ui';
import { useData } from '../store';
import { CATALOG } from '../data/catalog';
import { CatalogItem, SpiritType } from '../types';
import { buildOwned, countUnlockedBy, matchRecipe } from '../logic/generator';
import { pluralize } from '../format';

const SPIRIT_TYPES: SpiritType[] = [
  'vodka', 'gin', 'rum', 'tequila', 'mezcal', 'whiskey', 'brandy', 'aperitif',
];

export function ExploreScreen() {
  const { kit, recipes, prefs, addFromCatalog } = useData();
  const [spirit, setSpirit] = useState<SpiritType | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [zeroOnly, setZeroOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<CatalogItem | null>(null);

  const ownedIds = useMemo(
    () => new Set(kit.map((k) => k.catalogItemId).filter(Boolean) as string[]),
    [kit]
  );

  const allNotes = useMemo(() => {
    const set = new Set<string>();
    for (const c of CATALOG) c.flavorNotes.forEach((n) => set.add(n));
    return Array.from(set).sort();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((c) => {
      if (spirit && c.spiritType !== spirit) return false;
      if (note && !c.flavorNotes.includes(note)) return false;
      if (zeroOnly && !c.isZeroProof) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.blurb.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [spirit, note, zeroOnly, query]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Explore"
          subtitle={`${CATALOG.length} bottles, mixers and tools`}
        />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search the catalog"
          placeholderTextColor={C.faint}
          style={styles.search}
          accessibilityLabel="Search the catalog"
        />

        <Label style={{ marginTop: S.lg }}>By spirit</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          <View style={styles.chipRow}>
            <Chip label="All" active={!spirit && !zeroOnly} onPress={() => { setSpirit(null); setZeroOnly(false); }} small />
            {SPIRIT_TYPES.map((s) => (
              <Chip
                key={s}
                label={s}
                active={spirit === s}
                onPress={() => { setSpirit(spirit === s ? null : s); setZeroOnly(false); }}
                small
              />
            ))}
            <Chip
              label="zero proof"
              active={zeroOnly}
              color={C.cyan}
              onPress={() => { setZeroOnly(!zeroOnly); setSpirit(null); }}
              small
            />
          </View>
        </ScrollView>

        <Label style={{ marginTop: S.lg }}>By flavor</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          <View style={styles.chipRow}>
            {allNotes.map((n) => (
              <Chip
                key={n}
                label={n}
                active={note === n}
                color={C.violet}
                onPress={() => setNote(note === n ? null : n)}
                small
              />
            ))}
          </View>
        </ScrollView>

        <View style={{ marginTop: S.lg, gap: S.sm }}>
          {results.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setDetail(item)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.rowIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Body>{item.name}</Body>
                <Dim numberOfLines={1}>
                  {item.typicalAbv > 0 ? `${item.typicalAbv}% · ` : ''}
                  {item.flavorNotes.length ? item.flavorNotes.join(' · ') : item.kind}
                </Dim>
              </View>
              {ownedIds.has(item.id) ? (
                <View style={styles.ownedTag}>
                  <Text style={styles.ownedText}>IN KIT</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
          {results.length === 0 ? (
            <Dim style={{ textAlign: 'center', marginTop: S.lg }}>
              Nothing matches those filters.
            </Dim>
          ) : null}
        </View>
      </ScrollView>

      <DetailSheet
        item={detail}
        owned={ownedIds.has(detail?.id ?? '')}
        unlocks={
          detail
            ? countUnlockedBy(detail.id, recipes, kit, prefs.allowSubstitutes)
            : 0
        }
        pourable={
          detail
            ? recipes.filter((r) => {
                const usesIt = r.ingredients.some((i) => i.catalogItemId === detail.id);
                if (!usesIt) return false;
                return matchRecipe(r, buildOwned(kit), prefs.allowSubstitutes).ok;
              })
            : []
        }
        usedIn={
          detail
            ? recipes.filter((r) => r.ingredients.some((i) => i.catalogItemId === detail.id))
            : []
        }
        onAdd={() => {
          if (!detail) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          addFromCatalog(detail.id);
        }}
        onClose={() => setDetail(null)}
      />
    </View>
  );
}

function DetailSheet({
  item,
  owned,
  unlocks,
  pourable,
  usedIn,
  onAdd,
  onClose,
}: {
  item: CatalogItem | null;
  owned: boolean;
  unlocks: number;
  pourable: { id: string; name: string }[];
  usedIn: { id: string; name: string }[];
  onAdd: () => void;
  onClose: () => void;
}) {
  if (!item) return null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Label color={C.cyan}>
                  {item.spiritType ?? item.kind}
                  {item.styleSubtype ? ` · ${item.styleSubtype}` : ''}
                </Label>
                <Title style={{ marginTop: 4 }}>
                  {item.icon}  {item.name}
                </Title>
              </View>
              <Pressable onPress={onClose} accessibilityRole="button" hitSlop={12}>
                <Text style={styles.close}>Close</Text>
              </Pressable>
            </View>

            <Body style={{ color: C.dim, marginTop: S.sm, lineHeight: 22 }}>{item.blurb}</Body>

            <View style={styles.statRow}>
              <Stat label="Typical ABV" value={item.typicalAbv > 0 ? `${item.typicalAbv}%` : 'None'} />
              <Stat label="Used in" value={`${usedIn.length} ${pluralize(usedIn.length, 'drink')}`} />
              <Stat
                label={owned ? 'You can pour' : 'Would unlock'}
                value={owned ? `${pourable.length}` : `+${unlocks}`}
                accent={owned ? C.lime : C.amber}
              />
            </View>

            {item.flavorNotes.length ? (
              <>
                <Label style={{ marginTop: S.lg }}>Tastes like</Label>
                <View style={styles.chipRow}>
                  {item.flavorNotes.map((n) => (
                    <Chip key={n} label={n} small />
                  ))}
                </View>
              </>
            ) : null}

            {item.substituteIds.length ? (
              <>
                <Label style={{ marginTop: S.lg }}>Swap with</Label>
                <View style={styles.chipRow}>
                  {item.substituteIds.map((id) => {
                    const sub = CATALOG.find((c) => c.id === id);
                    return sub ? <Chip key={id} label={sub.name} small /> : null;
                  })}
                </View>
              </>
            ) : null}

            {usedIn.length ? (
              <>
                <Label style={{ marginTop: S.lg }}>Appears in</Label>
                <View style={{ marginTop: S.sm, gap: 4 }}>
                  {usedIn.slice(0, 8).map((r) => (
                    <Dim key={r.id}>· {r.name}</Dim>
                  ))}
                </View>
              </>
            ) : null}

            <View style={{ marginTop: S.xl, marginBottom: S.xxl }}>
              {owned ? (
                <GhostButton label="Already in your kit" color={C.faint} onPress={onClose} />
              ) : (
                <PrimaryButton
                  label={unlocks > 0 ? `Add — unlocks ${unlocks} ${pluralize(unlocks, 'drink')}` : 'Add to My Kit'}
                  onPress={() => {
                    onAdd();
                    onClose();
                  }}
                />
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Stat({ label, value, accent = C.text }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: S.lg, paddingTop: S.xl, paddingBottom: 140 },
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: S.sm, paddingRight: S.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingVertical: 11,
    paddingHorizontal: S.md,
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.glass,
  },
  rowIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  ownedTag: {
    borderWidth: 1,
    borderColor: C.lime + '66',
    borderRadius: R.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ownedText: { color: C.lime, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.panel,
    borderTopLeftRadius: R.lg,
    borderTopRightRadius: R.lg,
    padding: S.lg,
    maxHeight: '86%',
    borderTopWidth: 1,
    borderColor: C.line2,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: C.line2,
    alignSelf: 'center', marginBottom: S.md,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: S.md,
  },
  close: { color: C.lime, fontWeight: '700', fontSize: 14, paddingTop: 4 },
  statRow: { flexDirection: 'row', gap: S.sm, marginTop: S.lg },
  stat: {
    flex: 1,
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.glass,
    padding: S.md,
    gap: 3,
  },
  statValue: { fontFamily: F.display, fontSize: 20 },
  statLabel: { color: C.faint, fontSize: 8.5, letterSpacing: 0.9, fontWeight: '700' },
});
