import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  AccessibilityInfo,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { C, F, R, S, type } from '../theme';
import {
  Body,
  Chip,
  Dim,
  GhostButton,
  Heading,
  Label,
  Panel,
  PrimaryButton,
  ScreenHeader,
  Title,
} from '../components/ui';
import { useData } from '../store';
import { generate } from '../logic/generator';
import { GeneratorResult, DrinkRecipe } from '../types';
import { VIBE_TAGS } from '../data/recipes';
import { formatIngredient, pluralize } from '../format';
import { TabKey } from '../components/NavPill';

export function ShakerScreen({ goTo }: { goTo: (tab: TabKey) => void }) {
  const { recipes, kit, prefs, setPref, markMade, saveRecipe } = useData();
  const [vibes, setVibes] = useState<string[]>([]);
  const [result, setResult] = useState<GeneratorResult | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [reduceMotion, setReduceMotion] = useState(false);

  const shake = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  // Idle pulse on the CTA. Stops once a result is on screen.
  useEffect(() => {
    if (reduceMotion || result) {
      glow.stopAnimation();
      glow.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glow, reduceMotion, result]);

  const onShake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const next = generate({
      recipes,
      kit,
      allowSubstitutes: prefs.allowSubstitutes,
      zeroProofMode: prefs.zeroProofMode,
      vibes,
      recentIds: recent,
    });

    const show = () => {
      setResult(next);
      if (next.ok) {
        setRecent((prev) => [next.recipe.id, ...prev].slice(0, 3));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
      reveal.setValue(0);
      Animated.timing(reveal, {
        toValue: 1,
        duration: reduceMotion ? 120 : 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };

    if (reduceMotion) {
      show();
      return;
    }

    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 70, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 70, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 70, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 70, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 70, useNativeDriver: true }),
    ]).start(show);
  };

  const toggleVibe = (tag: string) =>
    setVibes((prev) => (prev.includes(tag) ? prev.filter((v) => v !== tag) : [...prev, tag]));

  const rotate = shake.interpolate({ inputRange: [-1, 1], outputRange: ['-7deg', '7deg'] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.95] });
  const revealStyle = {
    opacity: reveal,
    transform: [
      { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
      { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
    ],
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Shaker" subtitle="Only pours what's in your kit" />

      {/* One scrolling rail rather than a wrapping block — the filters must
          never push the shake button below the fold. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.railScroll}
        contentContainerStyle={styles.filters}
      >
        <Chip
          label={prefs.zeroProofMode ? '🚫 Zero proof' : 'Zero proof'}
          active={prefs.zeroProofMode}
          color={C.cyan}
          onPress={() => setPref('zeroProofMode', !prefs.zeroProofMode)}
        />
        <Chip
          label="Allow subs"
          active={prefs.allowSubstitutes}
          color={C.amber}
          onPress={() => setPref('allowSubstitutes', !prefs.allowSubstitutes)}
        />
        {vibes.length ? (
          <Chip label={`clear ${vibes.length}`} color={C.magenta} onPress={() => setVibes([])} />
        ) : null}
        {VIBE_TAGS.map((t) => (
          <Chip key={t} label={t} active={vibes.includes(t)} onPress={() => toggleVibe(t)} />
        ))}
      </ScrollView>

      <Animated.View style={{ transform: [{ rotate }] }}>
        <Animated.View style={{ opacity: result ? 1 : glowOpacity }}>
          <PrimaryButton label="SHAKE IT UP" onPress={onShake} style={styles.cta} />
        </Animated.View>
      </Animated.View>

      {result === null ? (
        <Panel style={styles.hint}>
          <Text style={styles.hintIcon}>🍹</Text>
          <Dim style={{ textAlign: 'center' }}>
            {kit.length === 0
              ? "Your kit is empty — the generator has nothing to work with yet."
              : `${kit.length} ${pluralize(kit.length, 'item')} in your kit. Give it a shake.`}
          </Dim>
          {kit.length === 0 ? (
            <GhostButton
              label="Set up My Kit"
              color={C.lime}
              onPress={() => goTo('kit')}
              style={{ marginTop: S.md, alignSelf: 'stretch' }}
            />
          ) : null}
        </Panel>
      ) : (
        <Animated.View style={revealStyle}>
          {result.ok ? (
            <ResultCard
              result={result}
              onMade={() => {
                markMade(result.recipe.id);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              }}
              onSave={() => {
                const copy: DrinkRecipe = {
                  ...result.recipe,
                  id: 'user-' + Math.random().toString(36).slice(2, 9),
                  origin: 'user',
                  createdAt: Date.now(),
                  timesMade: 0,
                  lastMadeAt: null,
                };
                saveRecipe(copy);
                goTo('recipes');
              }}
              onAgain={onShake}
            />
          ) : (
            <FallbackPanel
              result={result}
              vibes={vibes}
              onClearFilters={() => {
                setVibes([]);
                setPref('zeroProofMode', false);
                setResult(null);
              }}
              goTo={goTo}
            />
          )}
        </Animated.View>
      )}
    </ScrollView>
  );
}

function ResultCard({
  result,
  onMade,
  onSave,
  onAgain,
}: {
  result: Extract<GeneratorResult, { ok: true }>;
  onMade: () => void;
  onSave: () => void;
  onAgain: () => void;
}) {
  const r = result.recipe;
  const subMap = useMemo(
    () => Object.fromEntries(result.substitutions.map((s) => [s.wanted, s.used])),
    [result.substitutions]
  );

  return (
    <Panel accent={r.accent} style={styles.result}>
      <View style={[styles.accentBar, { backgroundColor: r.accent }]} />
      <Label color={r.accent}>{r.method} · {r.isZeroProof ? 'zero proof' : 'contains alcohol'}</Label>
      <Title style={{ marginTop: 4 }}>{r.name}</Title>

      <View style={styles.tagRow}>
        {r.vibeTags.slice(0, 3).map((t) => (
          <Chip key={t} label={t} small />
        ))}
      </View>

      <Label style={{ marginTop: S.lg }}>Ingredients</Label>
      <View style={{ marginTop: S.sm, gap: 6 }}>
        {r.ingredients.map((ing, i) => {
          const swapped = subMap[ing.displayName];
          return (
            <View key={i} style={styles.ingRow}>
              <View style={[styles.dot, { backgroundColor: swapped ? C.amber : r.accent }]} />
              <Body style={{ flex: 1 }}>
                {formatIngredient(ing)}
                {ing.isOptional ? <Text style={styles.optional}>  optional</Text> : null}
              </Body>
              {swapped ? <Text style={styles.subTag}>using {swapped}</Text> : null}
            </View>
          );
        })}
      </View>

      {result.substitutions.length ? (
        <View style={styles.subNote}>
          <Dim style={{ color: C.amber }}>
            {result.substitutions.length} {pluralize(result.substitutions.length, 'substitution')} —
            close, not exact.
          </Dim>
        </View>
      ) : null}

      <Label style={{ marginTop: S.lg }}>Method</Label>
      <View style={{ marginTop: S.sm, gap: 8 }}>
        {r.steps.map((s, i) => (
          <View key={i} style={styles.stepRow}>
            <Text style={styles.stepNum}>{String(i + 1).padStart(2, '0')}</Text>
            <Body style={{ flex: 1 }}>{s}</Body>
          </View>
        ))}
      </View>

      {r.garnish ? (
        <>
          <Label style={{ marginTop: S.lg }}>Garnish</Label>
          <Body style={{ marginTop: 4 }}>{r.garnish}</Body>
        </>
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton label="Shake again" onPress={onAgain} style={{ flex: 1 }} />
        <GhostButton label="I made this" onPress={onMade} style={{ flex: 1 }} color={C.lime} />
      </View>
      <GhostButton label="Save to my book" onPress={onSave} style={{ marginTop: S.sm }} />
    </Panel>
  );
}

/**
 * The three defined miss states. Each one names the number and offers the
 * single action that fixes it — never a bare "no results".
 */
function FallbackPanel({
  result,
  vibes,
  onClearFilters,
  goTo,
}: {
  result: Extract<GeneratorResult, { ok: false }>;
  vibes: string[];
  onClearFilters: () => void;
  goTo: (t: TabKey) => void;
}) {
  if (result.reason === 'filters') {
    return (
      <Panel accent={C.amber} style={styles.fallback}>
        <Text style={styles.fallbackIcon}>🎚️</Text>
        <Heading style={{ textAlign: 'center' }}>Your filters are too tight</Heading>
        <Dim style={styles.fallbackBody}>
          Nothing matches {vibes.length ? `“${vibes.join('”, “')}”` : 'those settings'} — but{' '}
          <Text style={{ color: C.lime, fontWeight: '700' }}>
            {result.matchesWithoutFilters} {pluralize(result.matchesWithoutFilters, 'drink')}
          </Text>{' '}
          in your kit match without them.
        </Dim>
        <PrimaryButton label="Clear filters" onPress={onClearFilters} style={styles.fallbackBtn} />
      </Panel>
    );
  }

  if (result.reason === 'nearly') {
    const top = result.suggestions[0];
    return (
      <Panel accent={C.amber} style={styles.fallback}>
        <Text style={styles.fallbackIcon}>🛒</Text>
        <Heading style={{ textAlign: 'center' }}>You're one bottle away</Heading>
        <Dim style={styles.fallbackBody}>
          Add{' '}
          <Text style={{ color: C.lime, fontWeight: '700' }}>{top.name}</Text> and{' '}
          {top.unlocks} {pluralize(top.unlocks, 'drink')} unlock{top.unlocks === 1 ? 's' : ''}.
        </Dim>
        {result.suggestions.length > 1 ? (
          <View style={styles.suggestRow}>
            {result.suggestions.slice(1).map((s) => (
              <Chip key={s.name} label={`${s.name} · +${s.unlocks}`} small />
            ))}
          </View>
        ) : null}
        <PrimaryButton label="Add to My Kit" onPress={() => goTo('kit')} style={styles.fallbackBtn} />
        <GhostButton label="Browse Explore" onPress={() => goTo('explore')} style={{ marginTop: S.sm, alignSelf: 'stretch' }} />
      </Panel>
    );
  }

  return (
    <Panel accent={C.amber} style={styles.fallback}>
      <Text style={styles.fallbackIcon}>🫙</Text>
      <Heading style={{ textAlign: 'center' }}>Nothing makes a full drink yet</Heading>
      <Dim style={styles.fallbackBody}>
        You need at least a base spirit and something to mix it with. Explore shows
        what pairs with what.
      </Dim>
      <PrimaryButton label="Add to My Kit" onPress={() => goTo('kit')} style={styles.fallbackBtn} />
      <GhostButton label="Open Explore" onPress={() => goTo('explore')} style={{ marginTop: S.sm, alignSelf: 'stretch' }} />
    </Panel>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: S.lg,
    paddingTop: S.xl,
    paddingBottom: 130,
    gap: S.lg,
  },
  railScroll: {
    flexGrow: 0,
    marginHorizontal: -S.lg,
  },
  filters: {
    flexDirection: 'row',
    gap: S.sm,
    paddingHorizontal: S.lg,
  },
  cta: {
    marginVertical: S.sm,
  },
  hint: {
    alignItems: 'center',
    paddingVertical: S.xl,
  },
  hintIcon: {
    fontSize: 34,
    marginBottom: S.sm,
  },
  result: {
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    opacity: 0.9,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: S.md,
    flexWrap: 'wrap',
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  optional: {
    color: C.faint,
    fontSize: 12,
  },
  subTag: {
    color: C.amber,
    fontSize: 11,
    fontWeight: '600',
  },
  subNote: {
    marginTop: S.md,
    paddingTop: S.sm,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  stepRow: {
    flexDirection: 'row',
    gap: S.md,
  },
  stepNum: {
    color: C.faint,
    fontSize: 11,
    fontWeight: '700',
    paddingTop: 4,
    width: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: S.sm,
    marginTop: S.xl,
  },
  fallback: {
    alignItems: 'center',
    paddingVertical: S.xl,
  },
  fallbackIcon: {
    fontSize: 38,
    marginBottom: S.md,
  },
  fallbackBody: {
    textAlign: 'center',
    marginTop: S.sm,
    maxWidth: 320,
    lineHeight: 20,
  },
  fallbackBtn: {
    marginTop: S.lg,
    alignSelf: 'stretch',
  },
  suggestRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: S.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
