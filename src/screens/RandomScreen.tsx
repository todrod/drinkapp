import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F, R, S, SCREEN } from '../theme';
import { accentForRecipe } from '../data/liquids';
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
import { buildOwned, countMakeable, generate, matchRecipe } from '../logic/generator';
import { DrinkRecipe, GeneratorResult } from '../types';
import { VIBE_TAGS } from '../data/recipes';
import { THEMES } from '../data/seed';
import { useShakeDetector } from '../hooks/useShakeDetector';
import { formatIngredient, pluralize } from '../format';
import { TabKey } from '../components/NavPill';
import { Icon } from '../icons';
import { CrystalBall } from '../components/CrystalBall';
import { CocktailArt } from '../components/CocktailArt';

export function RandomScreen({
  goTo,
}: {
  goTo: (tab: TabKey, view?: 'stock' | 'shopping') => void;
}) {
  const { recipes, kit, prefs, setPref, markMade, rateRecipe, addToShopping } = useData();
  const [vibes, setVibes] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [result, setResult] = useState<GeneratorResult | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const { width } = useWindowDimensions();
  const wide = width >= 640;
  const scrollRef = useRef<ScrollView>(null);
  const resultOffset = useRef(0);

  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;

  const owned = useMemo(() => buildOwned(kit), [kit]);
  const readyCount = useMemo(() => countMakeable(recipes, kit, prefs.allowSubstitutes), [recipes, kit, prefs.allowSubstitutes]);
  const selectedRecipe = result?.ok ? recipes.find((recipe) => recipe.id === result.recipe.id) ?? result.recipe : null;

  useEffect(() => {
    if (!result) return;
    // The recipe can land below the hero on short screens. Bring it into view.
    const frame = requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: Math.max(0, resultOffset.current - 24), animated: !reduceMotion }));
    return () => cancelAnimationFrame(frame);
  }, [result, reduceMotion]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  // A quiet float at rest; reduced motion leaves the crystal still.
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  const onSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
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
      setIsSpinning(false);
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
        useNativeDriver: Platform.OS !== 'web',
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
      useNativeDriver: Platform.OS !== 'web',
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

  const rotate = spin.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: ['0deg', '-9deg', '9deg', '-6deg', '6deg', '0deg'] });
  const float = pulse.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });
  const revealStyle = {
    opacity: reveal,
    transform: [
      { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
      { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
    ],
  };

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.brandRow}>
        <View style={styles.brandLockup}>
          <View style={styles.brandIcon}><Icon name="shaker" size={22} color={C.accent} /></View>
          <Text style={[styles.brandName, width < 360 && { fontSize: 19 }]}>drink shaker<Text style={{ color: C.accent }}>.</Text></Text>
        </View>
        <Pressable onPress={() => goTo('cabinet')} accessibilityRole="button" accessibilityLabel="Open my bar" style={styles.stockPill}>
          <View style={styles.readyDot} />
          <Text style={styles.stockText}>{readyCount} drinks ready</Text>
        </Pressable>
      </View>

      <LinearGradient colors={['#302637', '#231F2D', '#1E1B25']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.hero, wide && styles.heroWide]}>
        <View style={[styles.heroCopy, wide && { flex: 1 }]}>
          <Text style={styles.eyebrow}>A LITTLE SPONTANEITY, PERFECTLY MIXED</Text>
          <Text accessibilityRole="header" style={[styles.heroTitle, width >= 1000 && { fontSize: 48, lineHeight: 53 }]}>A little magic.{'\n'}A great drink.</Text>
          <Text style={styles.heroBody}>Find your next favorite cocktail, made with what's already on your shelf.</Text>
          <PrimaryButton label={isSpinning ? 'Consulting the spirits…' : 'Find my next drink'} disabled={isSpinning} onPress={onSpin} style={styles.heroCta} />
          <Text style={styles.heroHint}>{prefs.shakeToShake && shakeSensor.available ? 'Tap the crystal ball, or give your phone a shake.' : 'Let the spirits decide. Tap the crystal ball to begin.'}</Text>
        </View>
        <View style={[styles.crystalStage, wide && { flex: 1 }]}>
          <Animated.View style={{ transform: [{ translateY: reduceMotion ? 0 : float }, { rotate }] }}>
            <Pressable onPress={onSpin} disabled={isSpinning} accessibilityRole="button" accessibilityLabel="Find a drink with the crystal ball"
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }, styles.crystalButton]}>
              <CrystalBall size={width >= 1000 ? 316 : wide ? 232 : 248} />
            </Pressable>
          </Animated.View>
          <View style={styles.crystalCaption}><Icon name="shuffle-variant" size={13} color={C.accent} /><Text style={styles.crystalCaptionText}>GOOD TASTE. A LITTLE FATE.</Text></View>
        </View>
      </LinearGradient>

      <View style={styles.moodHead}>
        <Text style={styles.sectionTitle}>What's the mood?</Text>
        <Pressable onPress={() => setShowFilters(v => !v)} accessibilityRole="button" accessibilityLabel="Customize drink filters"
          accessibilityState={{ expanded: showFilters }} style={styles.filterToggle}>
          <Icon name="tune-variant" size={17} color={C.dim} />
          <Text style={styles.filterToggleText}>{showFilters ? 'Less' : 'More filters'}{filterCount ? ' · ' + filterCount : ''}</Text>
        </Pressable>
      </View>
      <View style={styles.moodRow}>
        <Chip label="Surprise me" active={vibes.length === 0 && !prefs.zeroProofMode} onPress={() => { setVibes([]); setPref('zeroProofMode', false); }} />
        {[['refreshing', 'Refreshing'], ['spirit-forward', 'Spirit-forward'], ['tropical', 'Tropical']].map(([key, label]) => (
          <Chip key={key} label={label} active={vibes.includes(key)} onPress={() => setVibes(v => v.includes(key) ? v.filter(t => t !== key) : [...v, key])} />
        ))}
        <Chip label="Zero proof" color={C.teal} active={prefs.zeroProofMode} onPress={() => setPref('zeroProofMode', !prefs.zeroProofMode)} />
      </View>

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
                  label={prefs.shakeToShake ? 'Shake on' : 'Shake off'}
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
      <View onLayout={(event) => { resultOffset.current = event.nativeEvent.layout.y; }}>
      {result === null ? (
        <View style={styles.quickLinks}>
          <Pressable onPress={() => goTo('cabinet')} accessibilityRole="button" accessibilityLabel="Explore my bar" style={styles.quickCard}>
            <View style={styles.quickIcon}><Icon name="cupboard" size={24} color={C.teal} /></View>
            <View style={{ flex: 1 }}><Text style={styles.quickTitle}>{kit.length ? 'Your bar, full of possibilities' : 'Great drinks start here'}</Text><Dim>{kit.length ? readyCount + ' drinks from ' + kit.length + ' ingredients' : 'Add the bottles and mixers you have.'}</Dim></View>
            <Icon name="chevron-right" size={20} color={C.faint} />
          </Pressable>
          <Pressable onPress={() => goTo('recipes')} accessibilityRole="button" accessibilityLabel="Browse cocktail recipes" style={styles.quickCard}>
            <View style={[styles.quickIcon, { backgroundColor: '#3B2B32' }]}><Icon name="book-open-variant" size={24} color={C.accent} /></View>
            <View style={{ flex: 1 }}><Text style={styles.quickTitle}>Something for every mood</Text><Dim>Explore {recipes.length} cocktail recipes</Dim></View>
            <Icon name="chevron-right" size={20} color={C.faint} />
          </Pressable>
        </View>
      ) : (
        <Animated.View accessibilityLiveRegion="polite" style={revealStyle}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Your next pour</Text>
          {result.ok ? (
            <ResultCard
              recipe={selectedRecipe ?? result.recipe}
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
              onWant={(id, name) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                addToShopping(id, name);
                goTo('cabinet', 'shopping');
              }}
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
      </View>
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
  const [expanded, setExpanded] = useState(true);

  return (
    <Panel padded={false} accent={accentForRecipe(recipe)} style={{ overflow: 'hidden' }}>
      <Pressable onPress={() => setExpanded((v) => !v)} accessibilityRole="button" accessibilityLabel={recipe.name + ", toggle recipe details"} accessibilityState={{ expanded }}>
        <View style={styles.resultTop}>
          <LinearGradient
            colors={[accentForRecipe(recipe) + '22', accentForRecipe(recipe) + '08']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.thumb}
          >
            <CocktailArt color={accentForRecipe(recipe)} glass={recipe.glass} size={100} />
          </LinearGradient>

          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.resultName} numberOfLines={2}>
              {recipe.name}
            </Text>
            <HaveCount have={have.have} total={have.total} />
            <Dim style={{ fontSize: 11 }}>
              {expanded ? 'Tap to collapse' : 'Tap to expand details'}
            </Dim>
          </View>
        </View>
      </Pressable>

      <View style={{ paddingHorizontal: S.md, paddingBottom: S.sm }}>
        <Stars value={recipe.rating} size={18} onRate={onRate} />
      </View>

      {expanded ? (
        <View style={styles.resultBody}>
          <Label>Ingredients</Label>
          <View style={{ marginTop: S.sm, gap: 5 }}>
            {recipe.ingredients.map((ing, i) => (
              <View key={i} style={styles.ingRow}>
                <View style={[styles.dot, { backgroundColor: accentForRecipe(recipe) }]} />
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
  onWant,
  goTo,
}: {
  result: Extract<GeneratorResult, { ok: false }>;
  onClear: () => void;
  onWant: (catalogItemId: string | null, name: string) => void;
  goTo: (t: TabKey, view?: 'stock' | 'shopping') => void;
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
              <Chip
                key={s.name}
                label={`+ ${s.name} · ${s.unlocks}`}
                small
                onPress={() => onWant(s.catalogItemId, s.name)}
              />
            ))}
          </View>
        ) : null}
        <PrimaryButton
          label={`ADD ${top.name.toUpperCase()} TO LIST`}
          onPress={() => onWant(top.catalogItemId, top.name)}
          style={styles.fallbackBtn}
        />
        <GhostButton
          label="Open my cabinet"
          onPress={() => goTo('cabinet')}
          style={{ marginTop: S.sm, alignSelf: 'stretch' }}
        />
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

const styles = StyleSheet.create({
  scroll: { ...SCREEN, gap: 20 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#33262A', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontFamily: F.semibold, fontSize: 23, letterSpacing: -0.7, color: C.text },
  stockPill: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10, minHeight: 44 },
  readyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.teal },
  stockText: { fontFamily: F.regular, fontSize: 12, color: C.dim },
  hero: { borderRadius: R.xl, borderWidth: 1, borderColor: C.line2, padding: 24, overflow: 'hidden' },
  heroWide: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 20, minHeight: 360 },
  heroCopy: { gap: 16, zIndex: 1 },
  eyebrow: { fontFamily: F.medium, color: C.accent, fontSize: 10, letterSpacing: 1.8, lineHeight: 15 },
  heroTitle: { fontFamily: F.semibold, color: C.text, fontSize: 36, lineHeight: 40, letterSpacing: -1.4 },
  heroBody: { fontFamily: F.regular, color: C.dim, fontSize: 15, lineHeight: 23, maxWidth: 330 },
  heroCta: { alignSelf: 'stretch', maxWidth: 300, marginTop: 4 },
  heroHint: { color: C.faint, fontFamily: F.regular, fontSize: 11, lineHeight: 17, maxWidth: 290 },
  crystalStage: { alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  crystalButton: { borderRadius: 160 },
  crystalCaption: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: -12, paddingBottom: 6 },
  crystalCaptionText: { color: C.dim, fontFamily: F.medium, fontSize: 9, letterSpacing: 1.7 },
  moodHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 6 },
  sectionTitle: { fontFamily: F.medium, fontSize: 20, letterSpacing: -0.3, color: C.text },
  filterToggle: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  filterToggleText: { color: C.dim, fontFamily: F.regular, fontSize: 12 },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -12 },
  rail: { flexGrow: 0, marginHorizontal: -S.lg },
  railRow: { flexDirection: 'row', gap: S.sm, paddingHorizontal: S.lg },
  quickLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  quickCard: { flexGrow: 1, flexBasis: 300, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderRadius: R.md, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line },
  quickIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#27352F' },
  quickTitle: { fontFamily: F.medium, color: C.text, fontSize: 14, marginBottom: 3 },

  resultTop: { flexDirection: 'row', gap: S.md, padding: S.md },
  thumb: {
    width: 100,
    height: 100,
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
  fallback: { alignItems: 'center', paddingVertical: S.xl, maxWidth: 640, alignSelf: 'center' },
  fallbackIcon: { marginBottom: S.md },
  fallbackBody: { textAlign: 'center', marginTop: S.sm, maxWidth: 320, lineHeight: 20 },
  fallbackBtn: { marginTop: S.lg, alignSelf: 'stretch' },
  suggestRow: { flexDirection: 'row', gap: 6, marginTop: S.md, flexWrap: 'wrap', justifyContent: 'center' },
});
