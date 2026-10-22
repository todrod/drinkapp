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
import { C, F, GLASS, R, S, SCREEN } from '../theme';
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
import { DrinkRecipe, GeneratorResult, Substitution } from '../types';
import { VIBE_TAGS } from '../data/recipes';
import { THEMES } from '../data/seed';
import { useShakeDetector } from '../hooks/useShakeDetector';
import { formatIngredient, pluralize } from '../format';
import { TabKey } from '../components/NavPill';
import { Icon } from '../icons';
import { AnimatedShaker, MIX_ANIMATION_DURATION } from '../components/AnimatedShaker';
import { CocktailArt } from '../components/CocktailArt';
import { ShakeControl } from '../components/ShakeControl';
import { DrinkIdeaFinder } from '../components/DrinkIdeaFinder';
import { RecipeSources } from '../components/RecipeSources';
import { discoverDrinks, ideaAllowsSubstitution } from '../logic/discovery';
import { isAlcoholFree } from '../logic/recipes';

export function RandomScreen({
  goTo, onParty, onServe, active = true,
}: {
  onParty: () => void;
  onServe: (r: DrinkRecipe) => void;
  active?: boolean;
  goTo: (tab: TabKey, view?: 'stock' | 'shopping') => void;
}) {
  const { profile, recipes, kit, prefs, setPref, rateRecipe, addToShopping } = useData();
  const [vibes, setVibes] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [ideaQuery, setIdeaQuery] = useState('');
  const [result, setResult] = useState<GeneratorResult | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [animationPaused, setAnimationPaused] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const spinning = useRef(false);
  const mounted = useRef(true);
  const selectionAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const finishSelection = useRef<(() => void) | null>(null);
  const heroBounds = useRef({ top: 0, bottom: Infinity });
  const { width, height } = useWindowDimensions();
  const scrollY = useRef(0);
  const wide = width >= 840;
  const motionEnabled = !reduceMotion && !animationPaused;
  const animateScroll = useRef(motionEnabled);
  animateScroll.current = motionEnabled;
  const scrollRef = useRef<ScrollView>(null);
  const resultOffset = useRef(0);

  const reveal = useRef(new Animated.Value(0)).current;

  const owned = useMemo(() => buildOwned(kit), [kit]);
  const eligible = useMemo(() => prefs.zeroProofMode ? recipes.filter(isAlcoholFree) : recipes, [recipes, prefs.zeroProofMode]);
  const readyCount = useMemo(() => countMakeable(eligible, kit, prefs.allowSubstitutes), [eligible, kit, prefs.allowSubstitutes]);
  const selectedRecipe = result?.ok ? recipes.find((recipe) => recipe.id === result.recipe.id) ?? result.recipe : null;
  const discovery = useMemo(() => discoverDrinks(eligible, ideaQuery), [eligible, ideaQuery]);
  const inventoryIdeas = useMemo(() => discovery.matches.map(({ recipe: r }) => {
    const match = matchRecipe(r, owned, prefs.allowSubstitutes, discovery.intent.excludedIngredientIds,
      (wanted, used) => ideaAllowsSubstitution(discovery.intent, wanted, used));
    const ready = (!prefs.zeroProofMode || isAlcoholFree(r)) && (!vibes.length || vibes.some((v) => r.vibeTags.includes(v))) &&
      (!themes.length || (!!r.theme && themes.includes(r.theme))) && match.ok;
    return { name: r.name, ready, missing: match.missing };
  }).sort((a, b) => Number(b.ready) - Number(a.ready)), [discovery, owned, prefs.zeroProofMode, prefs.allowSubstitutes, vibes, themes]);
  const ideaReadyCount = inventoryIdeas.filter((idea) => idea.ready).length;

  useEffect(() => {
    if (!result) return;
    // The recipe can land below the hero on short screens. Bring it into view.
    const frame = requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: Math.max(0, resultOffset.current - 24), animated: animateScroll.current }));
    return () => cancelAnimationFrame(frame);
  }, [result]);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => { if (active) setReduceMotion(enabled); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      finishSelection.current = null;
      selectionAnimation.current?.stop();
      reveal.stopAnimation();
    };
  }, [reveal]);

  useEffect(() => {
    if (motionEnabled || !spinning.current) return;
    selectionAnimation.current?.stop();
    finishSelection.current?.();
  }, [motionEnabled]);

  useEffect(() => {
    selectionAnimation.current?.stop();
    finishSelection.current = null;
    spinning.current = false;
    setIsSpinning(false);
    setResult(null);
  }, [prefs.zeroProofMode, prefs.allowSubstitutes]);

  useEffect(() => {
    if (active) return;
    selectionAnimation.current?.stop();
    finishSelection.current = null;
    spinning.current = false;
    setIsSpinning(false);
  }, [active]);

  const onSpin = () => {
    // A tap and a sensor callback can land before React renders the busy state.
    if (!active || !mounted.current || spinning.current) return;
    spinning.current = true;
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
      ideaQuery,
    });

    const show = () => {
      if (!mounted.current || !spinning.current) return;
      finishSelection.current = null;
      spinning.current = false;
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
        duration: motionEnabled ? 300 : 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    };
    finishSelection.current = show;

    if (!motionEnabled) {
      show();
      return;
    }

    // The pour completes before revealing the result. Reduced motion skips the wait.
    selectionAnimation.current = Animated.delay(MIX_ANIMATION_DURATION);
    selectionAnimation.current.start(({ finished }) => { if (finished) show(); });
  };

  const shakeSensor = useShakeDetector({ enabled: active && prefs.shakeToShake, onShake: onSpin });

  const toggleShakeSensor = async () => {
    if (shakeSensor.status === 'ready' || shakeSensor.status === 'waiting') {
      setPref('shakeToShake', false);
      return;
    }
    const ok = await shakeSensor.requestPermission();
    if (ok) setPref('shakeToShake', true);
  };

  const filterCount =
    vibes.length + themes.length + (prefs.zeroProofMode ? 1 : 0);

  const revealStyle = {
    opacity: reveal,
    transform: motionEnabled ? [
      { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
      { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
    ] : [],
  };

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'web' ? 'none' : 'on-drag'}
      scrollEventThrottle={100} onScroll={({ nativeEvent }) => {
        const top = nativeEvent.contentOffset.y;
        scrollY.current = top;
        const visible = top < heroBounds.current.bottom && top + nativeEvent.layoutMeasurement.height > heroBounds.current.top;
        setHeroVisible((previous) => previous === visible ? previous : visible);
      }}>
      <View style={styles.brandRow}>
        <View style={styles.brandLockup}>
          <View style={styles.brandIcon}><Icon name="shaker" size={22} color={C.accent} /></View>
          <Text style={[styles.brandName, width < 360 && { fontSize: 19 }]}>drink shaker<Text style={{ color: C.accent }}>.</Text></Text>
        </View>
        <Pressable onPress={() => goTo('cabinet')} accessibilityRole="button" accessibilityLabel="Open my bar" style={styles.stockPill}>
          <View style={styles.readyDot} />
          <View style={{ gap: 3, maxWidth: width < 560 ? 160 : 260 }}><Text numberOfLines={1} style={[styles.stockText, { color: C.teal }]}>{profile.name}</Text><Text style={styles.stockText}>{readyCount} recipes you can make</Text></View>
        </Pressable>
      </View>

      <Pressable onPress={onParty} accessibilityRole="button" accessibilityLabel="Plan a party menu" style={styles.hostEntry}>
        <View style={{ flex: 1, gap: 3 }}><Text style={styles.quickTitle}>Good company. Great drinks.</Text><Dim>Plan a party menu · batch · serve</Dim></View>
        <Icon name="chevron-right" size={22} color={C.accent} />
      </Pressable>
      {kit.length === 0 ? <Panel style={{ gap: 10 }}><Heading>Your recipe book is ready</Heading><Dim>Browse all {recipes.length} recipes now. Random picks use your inventory—add your ingredients or try a sample bar to start mixing.</Dim><PrimaryButton label="Add ingredients or try a sample bar" onPress={() => goTo('cabinet')} /><GhostButton label="Browse all recipes" onPress={() => goTo('recipes')} /></Panel> : null}
      <DrinkIdeaFinder query={ideaQuery} onChange={(value) => { setIdeaQuery(value); setResult(null); }}
        discovery={discovery} matchCount={discovery.matches.length} readyCount={ideaReadyCount} inventoryIdeas={inventoryIdeas}
        busy={isSpinning} onFind={onSpin} />

      <LinearGradient colors={GLASS.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        onLayout={({ nativeEvent: { layout } }) => {
          heroBounds.current = { top: layout.y, bottom: layout.y + layout.height };
          setHeroVisible(scrollY.current < layout.y + layout.height && scrollY.current + height - 100 > layout.y);
        }}
        style={[styles.hero, wide && styles.heroWide, width < 560 && { padding: 16, gap: 12 }]}>
        <View style={[styles.heroCopy, wide && { flex: 1 }, width < 560 && { flexGrow: 1, flexBasis: width - 48 - 34 - 12 - (width < 360 ? 106 : 134) }]}>
          <Text style={styles.eyebrow}>GOOD TIMES, ON THE HOUSE</Text>
          <Text accessibilityRole="header" style={[styles.heroTitle, width >= 1000 && { fontSize: 48, lineHeight: 53 }, width < 560 && { fontSize: 24, lineHeight: 28, letterSpacing: -0.7 }]}>Shake things up.{'\n'}Find your pour.</Text>
          {width >= 360 ? <Text style={styles.heroBody}>{prefs.zeroProofMode ? 'An alcohol-free surprise.' : width < 560 ? 'A surprise from your shelf.' : 'A surprise made from what’s already on your shelf.'}</Text> : null}
          {width >= 560 ? <PrimaryButton label={isSpinning ? 'Mixing your next drink…' : 'Find my next drink'} disabled={isSpinning} onPress={onSpin} style={styles.heroCta} /> : null}

        </View>
        <View style={[styles.shakerStage, wide && { flex: 1 }, width < 560 && { flexGrow: 0, flexShrink: 0, width: width < 360 ? 106 : 134 }]}>
          <Pressable onPress={onSpin} disabled={isSpinning} accessibilityRole="button" accessibilityLabel="Shake the cocktail shaker to find a drink"
            accessibilityState={{ busy: isSpinning, disabled: isSpinning }} aria-busy={isSpinning} aria-disabled={isSpinning}
            style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }, styles.shakerButton]}>
            <AnimatedShaker size={wide ? 280 : width >= 560 ? 240 : width < 360 ? 124 : 156}
              mixing={isSpinning} motionEnabled={motionEnabled} visible={heroVisible && active} />
          </Pressable>
          <View style={styles.shakerCaption}>
            {width >= 560 ? <Icon name="shuffle-variant" size={13} color={C.accent} /> : null}
            <Text style={styles.shakerCaptionText}>{isSpinning ? 'MIXING…' : 'TAP TO MIX'}</Text>
            {!reduceMotion ? <Pressable onPress={() => setAnimationPaused((paused) => !paused)} disabled={isSpinning}
              accessibilityRole="button" accessibilityLabel={animationPaused ? 'Play shaker animation' : 'Pause shaker animation'}
              style={({ pressed }) => [styles.motionToggle, { opacity: pressed || isSpinning ? 0.5 : 1 }]}>
              <Icon name={animationPaused ? 'play-outline' : 'pause'} size={14} color={C.dim} />
            </Pressable> : null}
          </View>
        </View>
        {width < 560 ? <PrimaryButton label={isSpinning ? 'Mixing your next drink…' : 'Find my next drink'} disabled={isSpinning} onPress={onSpin} style={{ width: '100%' }} /> : null}
      </LinearGradient>
      <ShakeControl status={shakeSensor.status} onToggle={toggleShakeSensor} />



      <View style={styles.moodHead}>
        <Text style={styles.sectionTitle}>Quick filters</Text>
        <Pressable onPress={() => setShowFilters(v => !v)} accessibilityRole="button" accessibilityLabel="Customize drink filters"
          accessibilityState={{ expanded: showFilters }} aria-expanded={showFilters} style={styles.filterToggle}>
          <Icon name="tune-variant" size={17} color={C.dim} />
          <Text style={styles.filterToggleText}>{showFilters ? 'Less' : 'More filters'}{filterCount ? ' · ' + filterCount : ''}</Text>
        </Pressable>
      </View>
      <View style={styles.moodRow}>
        <Chip label="Surprise me" active={vibes.length === 0} onPress={() => { setVibes([]); setThemes([]); }} />
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
              {filterCount ? (
                <Chip
                  label="Clear"
                  color={C.rose}
                  onPress={() => {
                    setVibes([]);
                    setThemes([]);
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
            <View style={{ flex: 1 }}><Text style={styles.quickTitle}>{kit.length ? 'Your bar, full of possibilities' : 'Great drinks start here'}</Text><Dim>{kit.length ? readyCount + ' recipes from ' + kit.length + ' ingredients' : 'Add the bottles and mixers you have.'}</Dim></View>
            <Icon name="chevron-right" size={20} color={C.faint} />
          </Pressable>
          <Pressable onPress={() => goTo('recipes')} accessibilityRole="button" accessibilityLabel="Browse cocktail recipes" style={styles.quickCard}>
            <View style={[styles.quickIcon, { backgroundColor: C.raise }]}><Icon name="book-open-variant" size={24} color={C.accent} /></View>
            <View style={{ flex: 1 }}><Text style={styles.quickTitle}>Something for every mood</Text><Dim>Explore {eligible.length} cocktail recipes</Dim></View>
            <Icon name="chevron-right" size={20} color={C.faint} />
          </Pressable>
        </View>
      ) : (
        <Animated.View accessibilityLiveRegion="polite" style={revealStyle}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Your next pour</Text>
          {ideaQuery.trim() && result.ok ? <Dim style={{ marginBottom: 12 }}>Matched your idea: {ideaQuery.trim()}</Dim> : null}
          {result.ok ? (
            <ResultCard
              recipe={selectedRecipe ?? result.recipe}
              have={countHave(result.recipe, owned, prefs.allowSubstitutes)}
              substitutions={result.substitutions}
              onMade={() => onServe(selectedRecipe ?? result.recipe)}
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
                setIdeaQuery('');
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
  substitutions: Substitution[];
  onMade: () => void;
  onRate: (n: number) => void;
  onAgain: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Panel padded={false} accent={accentForRecipe(recipe)} style={{ overflow: 'hidden' }}>
      <Pressable onPress={() => setExpanded((v) => !v)} accessibilityRole="button" accessibilityLabel={recipe.name + ", toggle recipe details"} accessibilityState={{ expanded }} aria-expanded={expanded}>
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

          <RecipeSources recipe={recipe} />
          {substitutions.map((sub, index) => <Dim key={index} style={{ marginTop: S.sm, color: C.amber }}>Use {sub.used} for {sub.wanted}.</Dim>)}
        </View>
      ) : null}

      <View style={styles.resultActions}>
        <PrimaryButton label="Start mixing" onPress={onMade} style={{ flex: 1 }} />
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
  if (result.reason === 'idea') {
    return <Panel accent={C.amber} style={styles.fallback}>
      <Icon name="book-open-variant" size={34} color={C.amber} style={styles.fallbackIcon} />
      <Heading style={{ textAlign: 'center' }}>{result.ideaMatches ? 'No matching drink is ready yet' : 'No drinks match that idea yet'}</Heading>
      <Dim style={styles.fallbackBody}>{result.ideaMatches ? `${result.ideaMatches} recipes match your words. Check your bar and mood filters, or browse the recipe book for their ingredients.` : 'Try fewer words, a different flavor or another theme. Your exclusions stay in place until you change them.'}</Dim>
      <PrimaryButton label="BROWSE RECIPES" onPress={() => goTo('recipes')} style={styles.fallbackBtn} />
      <GhostButton label="Clear idea and filters" onPress={onClear} style={{ marginTop: S.sm }} />
    </Panel>;
  }
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
        Add ingredients from a recipe you like, then give the shaker another try.
      </Dim>
      <PrimaryButton label="OPEN MY CABINET" onPress={() => goTo('cabinet')} style={styles.fallbackBtn} />
    </Panel>
  );
}

const styles = StyleSheet.create({
  scroll: { ...SCREEN, gap: 18 },
  brandRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.raise, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontFamily: F.semibold, fontSize: 23, letterSpacing: -0.7, color: C.text },
  stockPill: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10, minHeight: 44 },
  readyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.teal },
  stockText: { fontFamily: F.regular, fontSize: 12, color: C.dim },
  hostEntry: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 16, borderRadius: R.md, borderWidth: 1, borderColor: C.accent + '55', backgroundColor: C.panel },
  hero: { gap: 22, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', borderRadius: R.xl, borderWidth: 1, borderColor: C.line2, padding: 24, overflow: 'hidden' },
  heroWide: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 24, minHeight: 300 },
  heroCopy: { gap: 12, zIndex: 1, flexGrow: 1, flexBasis: 260, minWidth: 0 },
  eyebrow: { fontFamily: F.medium, color: C.accent, fontSize: 10, letterSpacing: 1.8, lineHeight: 15 },
  heroTitle: { fontFamily: F.semibold, color: C.text, fontSize: 30, lineHeight: 35, letterSpacing: -1.4 },
  heroBody: { fontFamily: F.regular, color: C.dim, fontSize: 15, lineHeight: 23, maxWidth: 330 },
  heroCta: { alignSelf: 'stretch', maxWidth: 300, marginTop: 4 },
  shakerStage: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  shakerButton: { borderRadius: 24 },
  shakerCaption: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 0 },
  shakerCaptionText: { color: C.dim, fontFamily: F.medium, fontSize: 10, letterSpacing: 0.6 },
  motionToggle: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
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
