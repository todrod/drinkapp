import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { C } from '../theme';

/**
 * The room the app sits in.
 *
 * Three soft colour fields drifting behind everything, plus a grain overlay.
 * The grain is the part that matters: flat vector fills on a flat ground are
 * most of what reads as "unfinished", and a few percent of noise removes it
 * without touching layout or cost.
 *
 * Radial gradients come from react-native-svg — expo-linear-gradient is linear
 * only, and a hard-edged disc reads as a shape rather than light.
 */

const { width: W, height: H } = Dimensions.get('window');

function Field({
  id,
  color,
  cx,
  cy,
  rx,
  ry,
  opacity,
}: {
  id: string;
  color: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  opacity: number;
}) {
  return (
    <>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset="55%" stopColor={color} stopOpacity={opacity * 0.35} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id})`} />
    </>
  );
}

export function Atmosphere() {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  const slow = drift.interpolate({ inputRange: [0, 1], outputRange: [-26, 26] });
  const slower = drift.interpolate({ inputRange: [0, 1], outputRange: [18, -18] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.ink }]} />

      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateY: slow }] }]}
      >
        <Svg width={W} height={H}>
          <Field id="a" color={C.teal} cx={W * 0.18} cy={H * 0.08} rx={W * 0.75} ry={H * 0.3} opacity={0.3} />
          <Field id="b" color={C.violet} cx={W * 0.95} cy={H * 0.34} rx={W * 0.6} ry={H * 0.26} opacity={0.16} />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateX: slower }] }]}
      >
        <Svg width={W} height={H}>
          <Field id="c" color={C.cyan} cx={W * 0.5} cy={H * 0.92} rx={W * 0.9} ry={H * 0.28} opacity={0.14} />
        </Svg>
      </Animated.View>

      {/* Grain. Low opacity on purpose — visible as texture, not as noise. */}
      <Image
        source={require('../../assets/grain.png')}
        resizeMode="repeat"
        style={[StyleSheet.absoluteFill, styles.grain]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grain: { opacity: 0.035 },
});
