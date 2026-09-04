import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { accentOf, C, F, R, S } from '../theme';
import {
  Body,
  Chip,
  Dim,
  GhostButton,
  HaveCount,
  Heading,
  Label,
  Panel,
  PrimaryButton,
  Stars,
} from '../components/ui';
import { useData } from '../store';
import { buildOwned, generate, matchRecipe } from '../logic/generator';
import { DrinkRecipe, GeneratorResult } from '../types';
import { VIBE_TAGS } from '../data/recipes';
import { THEMES } from '../data/seed';
import { useShakeDetector } from '../hooks/useShakeDetector';
import { formatIngredient, pluralize } from '../format';
import { TabKey } from '../components/NavPill';
import { glyphForRecipe, Icon } from '../icons';

export function RandomScreen({ goTo }: { goTo: (tab: TabKey) => void }) {
  const { recipes, kit, prefs, setPref, markMade, rateRecipe } = useData();
  const [vibes, setVibes] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [result, setResult] = useState<GeneratorResult | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;

  const owned = useMemo(() => buildOwned(kit), [kit]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  // Slow breathing glow on the orb while it waits.
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  const onSpin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const next = generate({
      recipes,
      kit,
      allowSubstitutes: prefs.allowSubstitutes,
      zeroProofMode: prefs.zeroProofMode,
      vibes,
      themes,
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
        duration: reduceMotion ? 120 : 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };

    if (reduceMotion) {
      show();
      return;
    }

    spin.setValue(0);
    Animated.timing(spin, {
      toValue: 1,
      duration: 850,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(show);
  };

  const shakeSensor = useShakeDetector({ enabled: prefs.shakeToShake, onShake: onSpin });

  const toggleShakeSensor = async () => {
    if (!prefs.shakeToShake && shakeSensor.needsPermission) {
      const ok = await shakeSensor.requestPermission();
      if (!ok) return;
    }
    setPref('shakeToShake', !prefs.shakeToShake);
  };

  const filterCount =
    vibes.length + themes.length + (prefs.zeroProofMode ? 1 : 0);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1080deg'] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.06] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });
  const revealStyle = {
    opacity: reveal,
    transform: [
      { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
      { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
    ],
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.masthead}>
        <Text style={styles.wordmark}>MIXOLOGIST</Text>
        <Text style={styles.tagline}>RANDOM DRINK SELECTOR</Text>
      </View>

      {/* ── The orb ─────────────────────────────────────────────────────── */}
      <View style={styles.orbWrap}>
        {/* Concentric rings rather than one disc — React Native cannot blur a
            view, so the falloff has to be built out of layers. */}
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              styles.orbGlow,
              {
                width: ORB + 30 + i * 26,
                height: ORB + 30 + i * 26,
                borderRadius: (ORB + 30 + i * 26) / 2,
                opacity: Animated.multiply(glowOpacity, 0.3 - i * 0.09),
                transform: [{ scale: glowScale }],
              },
            ]}
          />
        ))}
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Pressable
            onPress={onSpin}
            accessibilityRole="button"
            accessibilityLabel="Spin for a random drink"
            style={({ pressed }) => [styles.orb, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={['rgba(126,240,228,0.42)', 'rgba(24,120,116,0.30)', 'rgba(6,20,26,0.92)']}
              start={{ x: 0.25, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.orbFill}
            >
              <View style={styles.orbSheen} />
              <Text style={styles.orbMark}>?</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>

      <PrimaryButton label="SPIN TO SELECT" onPress={onSpin} style={styles.cta} />

      <Pressable
        onPress={() => setShowFilters((v) => !v)}
        accessibilityRole="button"
        style={styles.filterToggle}
      >
        <Text style={styles.filterToggleText}>
          {showFilters ? 'HIDE FILTERS' : 'FILTERS'}
          {filterCount ? `  ·  ${filterCount}` : ''}
        </Text>
      </Pressable>

      {showFilters ? (
        <View style={{ gap: S.sm }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rail}>
            <View style={styles.railRow}>
              <Chip
                label="Zero proof"
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
              {shakeSensor.available ? (
                <Chip
                  label={prefs.shakeToShake ? '📳 Shake on' : '📳 Shake off'}
                  active={prefs.shakeToShake}
                  color={C.violet}
                  onPress={toggleShakeSensor}
                />
              ) : null}
              {filterCount ? (
                <Chip
                  label="Clear"
                  color={C.rose}
                  onPress={() => {
                    setVibes([]);
                    setThemes([]);
                    setPref('zeroProofMode', false);
                  }}
                />
              ) : null}
            </View>
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rail}>
            <View style={styles.railRow}>
              {THEMES.map((t) => (
                <Chip
                  key={t.id}
                  label={t.label}
                  active={themes.includes(t.id)}
                  color={t.accent}
                  onPress={() =>
                    setThemes((p) => (p.includes(t.id) ? p.filter((x) => x !== t.id) : [...p, t.id]))
                  }
                />
              ))}
            </View>
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rail}>
            <View style={styles.railRow}>
              {VIBE_TAGS.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  active={vibes.includes(t)}
                  onPress={() =>
                    setVibes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))
                  }
                />
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}

      {/* ── Result ──────────────────────────────────────────────────────── */}
      {result === null ? (
        <Panel style={styles.idle}>
          <Dim style={{ textAlign: 'center' }}>
            {kit.length === 0
              ? 'Your cabinet is empty — nothing to pour from yet.'
              : `${kit.length} ${pluralize(kit.length, 'ingredient')} in the cabinet.${
                  prefs.shakeToShake && shakeSensor.available ? ' Spin, or shake your phone.' : ''
                }`}
          </Dim>
          {kit.length === 0 ? (
            <GhostButton
              label="Set up My Cabinet"
              color={C.teal}
              onPress={() => goTo('cabinet')}
              style={{ marginTop: S.md, alignSelf: 'stretch' }}
            />
          ) : null}
        </Panel>
      ) : (
        <Animated.View style={revealStyle}>
          {result.ok ? (
            <ResultCard
              recipe={result.recipe}
              have={countHave(result.recipe, owned, prefs.allowSubstitutes)}
              substitutions={result.substitutions.length}
              onMade={() => {
                markMade(result.recipe.id);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              }}
              onRate={(n) => rateRecipe(result.recipe.id, n)}
              onAgain={onSpin}
            />
          ) : (
            <FallbackPanel
              result={result}
              onClear={() => {
                setVibes([]);
                setThemes([]);
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

function countHave(
  recipe: DrinkRecipe,
  owned: ReturnType<typeof buildOwned>,
  allowSubstitutes: boolean
) {
  const m = matchRecipe(recipe, owned, allowSubstitutes);
  const total = recipe.ingredients.filter((i) => !i.isOptional).length;
  return { have: total - m.missing.length - m.softMissing.length, total };
}

function ResultCard({
  recipe,
  have,
  substitutions,
  onMade,
  onRate,
  onAgain,
}: {
  recipe: DrinkRecipe;
  have: { have: number; total: number };
  substitutions: number;
  onMade: () => void;
  onRate: (n: number) => void;
  onAgain: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Panel accent={accentOf(recipe.accent)} style={{ padding: 0, overflow: 'hidden' }}>
      <Pressable onPress={() => setExpanded((v) => !v)} accessibilityRole="button">
        <View style={styles.resultTop}>
          <LinearGradient
            colors={[accentOf(recipe.accent) + 'CC', accentOf(recipe.accent) + '22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.thumb}
          >
            <Icon name={glyphForRecipe(recipe)} size={36} color="rgba(255,255,255,0.95)" />
          </LinearGradient>

          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.resultName} numberOfLines={2}>
              {recipe.name}
            </Text>
            <Stars value={recipe.rating} onRate={onRate} />
            <HaveCount have={have.have} total={have.total} />
            <Dim style={{ fontSize: 11 }}>
              {expanded ? 'Tap to collapse' : 'Tap to expand details'}
            </Dim>
          </View>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.resultBody}>
          <Label>Ingredients</Label>
          <View style={{ marginTop: S.sm, gap: 5 }}>
            {recipe.ingredients.map((ing, i) => (
              <View key={i} style={styles.ingRow}>
                <View style={[styles.dot, { backgroundColor: accentOf(recipe.accent) }]} />
                <Body style={{ flex: 1 }}>{formatIngredient(ing)}</Body>
              </View>
            ))}
          </View>

          <Label style={{ marginTop: S.lg }}>Method</Label>
          <View style={{ marginTop: S.sm, gap: 7 }}>
            {recipe.steps.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <Text style={styles.stepNum}>{String(i + 1).padStart(2, '0')}</Text>
                <Body style={{ flex: 1 }}>{s}</Body>
              </View>
            ))}
          </View>

          {recipe.garnish ? (
            <>
              <Label style={{ marginTop: S.lg }}>Garnish</Label>
              <Body style={{ marginTop: 4 }}>{recipe.garnish}</Body>
            </>
          ) : null}

          {recipe.sourceNote ? (
            <View style={styles.sourceRow}>
              <Icon name="book-open-variant" size={13} color={C.faint} />
              <Dim>{recipe.sourceNote}</Dim>
            </View>
          ) : null}
          {substitutions ? (
            <Dim style={{ marginTop: S.sm, color: C.amber }}>
              {substitutions} {pluralize(substitutions, 'substitution')} — close, not exact.
            </Dim>
          ) : null}
        </View>
      ) : null}

      <View style={styles.resultActions}>
        <PrimaryButton label="MAKE IT" onPress={onMade} style={{ flex: 1 }} />
        <GhostButton label="Spin again" onPress={onAgain} color={C.teal} style={{ flex: 1 }} />
      </View>
    </Panel>
  );
}

function FallbackPanel({
  result,
  onClear,
  goTo,
}: {
  result: Extract<GeneratorResult, { ok: false }>;
  onClear: () => void;
  goTo: (t: TabKey) => void;
}) {
  if (result.reason === 'filters') {
    return (
      <Panel accent={C.amber} style={styles.fallback}>
        <Icon name="tune-variant" size={34} color={C.amber} style={styles.fallbackIcon} />
        <Heading style={{ textAlign: 'center' }}>Filters are too tight</Heading>
        <Dim style={styles.fallbackBody}>
          Nothing matches those settings — but{' '}
          <Text style={{ color: C.teal, fontWeight: '800' }}>
            {result.matchesWithoutFilters} {pluralize(result.matchesWithoutFilters, 'drink')}
          </Text>{' '}
          match without them.
        </Dim>
        <PrimaryButton label="CLEAR FILTERS" onPress={onClear} style={styles.fallbackBtn} />
      </Panel>
    );
  }

  if (result.reason === 'nearly') {
    const top = result.suggestions[0];
    return (
      <Panel accent={C.amber} style={styles.fallback}>
        <Icon name="cart-outline" size={34} color={C.amber} style={styles.fallbackIcon} />
        <Heading style={{ textAlign: 'center' }}>You're one bottle away</Heading>
        <Dim style={styles.fallbackBody}>
          Add <Text style={{ color: C.teal, fontWeight: '800' }}>{top.name}</Text> and {top.unlocks}{' '}
          {pluralize(top.unlocks, 'drink')} unlock{top.unlocks === 1 ? 's' : ''}.
        </Dim>
        {result.suggestions.length > 1 ? (
          <View style={styles.suggestRow}>
            {result.suggestions.slice(1).map((s) => (
              <Chip key={s.name} label={`${s.name} · +${s.unlocks}`} small />
            ))}
          </View>
        ) : null}
        <PrimaryButton label="OPEN MY CABINET" onPress={() => goTo('cabinet')} style={styles.fallbackBtn} />
      </Panel>
    );
  }

  return (
    <Panel accent={C.amber} style={styles.fallback}>
      <Icon name="bottle-tonic-outline" size={34} color={C.amber} style={styles.fallbackIcon} />
      <Heading style={{ textAlign: 'center' }}>Nothing makes a full drink yet</Heading>
      <Dim style={styles.fallbackBody}>
        You need at least a base spirit and something to mix it with.
      </Dim>
      <PrimaryButton label="OPEN MY CABINET" onPress={() => goTo('cabinet')} style={styles.fallbackBtn} />
    </Panel>
  );
}

const ORB = 216;

const styles = StyleSheet.create({
  scroll: { padding: S.lg, paddingTop: S.lg, paddingBottom: 130, gap: S.lg },
  masthead: { alignItems: 'center', gap: 4 },
  wordmark: {
    fontFamily: F.light,
    fontSize: 30,
    letterSpacing: 7,
    color: C.text,
    textShadowColor: 'rgba(47,212,198,0.55)',
    textShadowRadius: 22,
  },
  tagline: { color: C.dim, fontFamily: F.regular, fontSize: 10, letterSpacing: 3.4 },

  orbWrap: { alignItems: 'center', justifyContent: 'center', height: ORB + 24 },
  orbGlow: { position: 'absolute', backgroundColor: C.teal },
  orb: {
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    borderWidth: 1,
    borderColor: 'rgba(160,248,238,0.7)',
    overflow: 'hidden',
  },
  orbFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orbSheen: {
    position: 'absolute',
    top: ORB * 0.09,
    left: ORB * 0.16,
    width: ORB * 0.44,
    height: ORB * 0.26,
    borderRadius: ORB * 0.22,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  orbMark: {
    fontFamily: F.semibold,
    fontSize: 76,
    color: '#EAFFFB',
    textShadowColor: 'rgba(53,214,196,0.8)',
    textShadowRadius: 22,
  },

  cta: { marginTop: -S.sm },
  filterToggle: { alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 12 },
  filterToggleText: { color: C.faint, fontSize: 10, letterSpacing: 1.6, fontWeight: '800' },
  rail: { flexGrow: 0, marginHorizontal: -S.lg },
  railRow: { flexDirection: 'row', gap: S.sm, paddingHorizontal: S.lg },

  idle: { alignItems: 'center', paddingVertical: S.xl },

  resultTop: { flexDirection: 'row', gap: S.md, padding: S.md },
  thumb: {
    width: 78,
    height: 78,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultName: { color: C.text, fontFamily: F.semibold, fontSize: 19, lineHeight: 23 },
  resultBody: {
    paddingHorizontal: S.md,
    paddingBottom: S.md,
    borderTopWidth: 1,
    borderTopColor: C.line,
    paddingTop: S.md,
  },
  ingRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  dot: { width: 5, height: 5, borderRadius: 3 },
  stepRow: { flexDirection: 'row', gap: S.md },
  stepNum: { color: C.faint, fontSize: 11, fontWeight: '800', paddingTop: 4, width: 20 },
  resultActions: {
    flexDirection: 'row',
    gap: S.sm,
    padding: S.md,
    paddingTop: 0,
  },

  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: S.lg },
  fallback: { alignItems: 'center', paddingVertical: S.xl },
  fallbackIcon: { marginBottom: S.md },
  fallbackBody: { textAlign: 'center', marginTop: S.sm, maxWidth: 320, lineHeight: 20 },
  fallbackBtn: { marginTop: S.lg, alignSelf: 'stretch' },
  suggestRow: { flexDirection: 'row', gap: 6, marginTop: S.md, flexWrap: 'wrap', justifyContent: 'center' },
});
