import React, { memo, useEffect, useId, useRef, useState } from 'react';
import { Animated, AppState, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

export const MIX_ANIMATION_DURATION = 1800;
const nativeDriver = Platform.OS !== 'web';

interface Props {
  size: number;
  mixing: boolean;
  motionEnabled: boolean;
  visible: boolean;
}

/** Decorative only. Tap, motion permission and recipe selection belong to the parent. */
export const AnimatedShaker = memo(function AnimatedShaker({ size, mixing, motionEnabled, visible }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [foreground, setForeground] = useState(AppState.currentState === 'active' || AppState.currentState === null);
  const idle = useRef(new Animated.Value(0)).current;
  const phase = useRef(new Animated.Value(0)).current;
  const playing = motionEnabled && visible && foreground;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    idle.setValue(0);
    if (!playing || mixing) return;
    const loop = Animated.loop(Animated.timing(idle, { toValue: 1, duration: 5600, easing: Easing.linear, useNativeDriver: nativeDriver, isInteraction: false }));
    loop.start();
    return () => loop.stop();
  }, [idle, playing, mixing]);

  useEffect(() => {
    phase.setValue(0);
    if (!playing || !mixing) return;
    const animation = Animated.timing(phase, { toValue: 1, duration: MIX_ANIMATION_DURATION, easing: Easing.linear, useNativeDriver: nativeDriver, isInteraction: false });
    animation.start();
    return () => animation.stop();
  }, [phase, playing, mixing]);

  const poses = [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.61, 0.86, 1];
  const rotate = phase.interpolate({ inputRange: poses, outputRange: ['-12deg', '-27deg', '13deg', '-25deg', '14deg', '-12deg', '-12deg', '68deg', '68deg', '-12deg'] });
  const dx = phase.interpolate({ inputRange: poses, outputRange: [0, -7, 7, -7, 7, 0, 0, 18, 18, 0] });
  const dy = phase.interpolate({ inputRange: poses, outputRange: [0, -5, 0, -5, 0, 0, 0, -16, -16, 0] });
  const capOpacity = phase.interpolate({ inputRange: [0, 0.4, 0.54, 0.86, 1], outputRange: [1, 1, 0, 0, 1] });
  const capLift = phase.interpolate({ inputRange: [0, 0.4, 0.54, 0.86, 1], outputRange: [0, 0, -22, -22, 0] });
  const pouring = phase.interpolate({ inputRange: [0, 0.6, 0.64, 0.84, 0.89, 1], outputRange: [0, 0, 1, 1, 0, 0] });
  const drink = phase.interpolate({ inputRange: [0, 0.08, 0.62, 0.85, 1], outputRange: [1, 0, 0, 1, 1] });
  const garnish = phase.interpolate({ inputRange: [0, 0.08, 0.85, 0.96, 1], outputRange: [1, 0, 0, 1, 1] });
  const metal = `${id}-metal`;
  const steel = `${id}-steel`;

  return <View style={{ width: size, height: size }} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden={true}>
    {/* A fixed artboard keeps every moving piece aligned at every phone size. */}
    <View style={{ position: 'absolute', width: 320, height: 320, left: (size - 320) / 2, top: (size - 320) / 2, transform: [{ scale: size / 320 }] }}>
      <Svg width={320} height={320} viewBox="0 0 320 320">
        <Defs>
          <RadialGradient id={`${id}-halo`} cx="45%" cy="45%" r="56%"><Stop offset="0" stopColor="#CB7956" stopOpacity={0.2} /><Stop offset="0.6" stopColor="#B34A4D" stopOpacity={0.09} /><Stop offset="1" stopColor="#B34A4D" stopOpacity={0} /></RadialGradient>
          <LinearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#F9E9D7" stopOpacity={0.25} /><Stop offset="0.55" stopColor="#F9E9D7" stopOpacity={0.04} /><Stop offset="1" stopColor="#B7DECF" stopOpacity={0.22} /></LinearGradient>
        </Defs>
        <Circle cx={156} cy={155} r={146} fill={`url(#${id}-halo)`} />
        <Circle cx={155} cy={158} r={124} stroke="#F2B88D" strokeOpacity={0.09} fill="none" />
        <Path d="M45 197A119 119 0 0 1 242 68" stroke="#F4D0B0" strokeOpacity={0.18} strokeWidth={1} fill="none" />
        <Ellipse cx={161} cy={295} rx={127} ry={12} fill="#10060B" fillOpacity={0.3} />
        <Ellipse cx={100} cy={285} rx={55} ry={5} fill="#0F080B" fillOpacity={0.3} />
        <Path d="M187 225C190 254 210 272 236 272S282 254 285 225Z" fill={`url(#${id}-glass)`} />
      </Svg>

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: idle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.45, 1, 0.45] }) }]}>
        <Svg width={320} height={320} viewBox="0 0 320 320"><Path d="M266 77v13m-6-6h12M43 231v10m-5-5h10" stroke="#EFD5B5" strokeOpacity={0.55} strokeWidth={1.5} strokeLinecap="round" /><Circle cx={237} cy={50} r={2.4} fill="#A5D6C5" /><Circle cx={33} cy={150} r={1.5} fill="#F2B88D" /><Circle cx={281} cy={174} r={2} fill="#F2B88D" /></Svg>
      </Animated.View>

      <Animated.View style={{ position: 'absolute', left: 37, top: 34, width: 124, height: 228, transform: [{ translateY: idle.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -4, 0] }) }] }}>
        <Animated.View style={{ width: 124, height: 228, transform: [{ translateX: dx }, { translateY: dy }, { rotate }] }}>
          <Svg width={124} height={228} viewBox="0 0 124 228">
            <Defs>
              <LinearGradient id={metal} x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#4B2424" /><Stop offset="0.16" stopColor="#A8664F" /><Stop offset="0.32" stopColor="#F7D9BD" /><Stop offset="0.44" stopColor="#D7A081" /><Stop offset="0.61" stopColor="#9D5D49" /><Stop offset="0.8" stopColor="#DBAE8E" /><Stop offset="0.91" stopColor="#9A5947" /><Stop offset="1" stopColor="#3C1D23" /></LinearGradient>
              <LinearGradient id={steel} x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#55545A" /><Stop offset="0.23" stopColor="#D5DBD8" /><Stop offset="0.4" stopColor="#FFF8E8" /><Stop offset="0.61" stopColor="#838D90" /><Stop offset="0.82" stopColor="#CFD4CD" /><Stop offset="1" stopColor="#55535B" /></LinearGradient>
              <LinearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#FFF8E8" stopOpacity={0.55} /><Stop offset="1" stopColor="#FFF8E8" stopOpacity={0} /></LinearGradient>
            </Defs>
            <Path d="M24 82 34 61Q38 51 46 51h32q9 0 13 10l10 21-8 9H32Z" fill={`url(#${steel})`} stroke="#E5D7C9" strokeOpacity={0.5} strokeWidth={0.8} />
            <Ellipse cx={62} cy={53} rx={18} ry={4} fill="#303039" stroke="#E5D7C9" strokeOpacity={0.7} />
            <Path d="M22 87q0-7 9-7h62q9 0 9 8L92 201q-1 15-14 17H46q-13-1-14-15Z" fill={`url(#${metal})`} stroke="#F2CFAD" strokeOpacity={0.55} strokeWidth={0.8} />
            <Ellipse cx={62} cy={83} rx={39} ry={4} fill={`url(#${steel})`} />
            <Path d="M36 95 44 199q1 10 8 11L44 97Z" fill={`url(#${id}-shine)`} />
            <Path d="m89 95-8 108" stroke="#FFF1D9" strokeWidth={1.4} strokeOpacity={0.42} strokeLinecap="round" />
            <Path d="M35 205q27 9 54 0M40 214q22 5 45 0" stroke="#3B2023" strokeOpacity={0.55} strokeWidth={1.5} fill="none" />
            <Path d="m62 126 4 9-4 9-4-9Z" fill="#6E3B32" fillOpacity={0.4} stroke="#FFE1C0" strokeOpacity={0.5} strokeWidth={0.7} />
            {[ [44, 107, 2], [74, 117, 1.4], [49, 158, 2.2], [82, 163, 1.4], [57, 186, 1.6], [39, 140, 1.1] ].map(([cx, cy, r], n) => <Circle key={n} cx={cx} cy={cy} r={r} fill="#F9E9D7" fillOpacity={0.3} stroke="#793F35" strokeOpacity={0.3} strokeWidth={0.6} />)}
          </Svg>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: capOpacity, transform: [{ translateY: capLift }] }]}>
            <Svg width={124} height={228} viewBox="0 0 124 228">
              <Defs><LinearGradient id={`${id}-cap`} x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#66676A" /><Stop offset="0.28" stopColor="#F8F1DD" /><Stop offset="0.45" stopColor="#C2C8C3" /><Stop offset="0.7" stopColor="#7D878C" /><Stop offset="0.87" stopColor="#CFD1C6" /><Stop offset="1" stopColor="#494950" /></LinearGradient></Defs>
              <Path d="M38 49 40 22Q41 9 62 9t22 13l2 27q-24 9-48 0Z" fill={`url(#${id}-cap)`} stroke="#EEE4D2" strokeOpacity={0.45} strokeWidth={0.8} />
              <Ellipse cx={62} cy={49} rx={24} ry={4} fill={`url(#${id}-cap)`} stroke="#727576" strokeWidth={1} />
              <Path d="M46 23q0-6 8-8M46 28v11" stroke="#FFFAEA" strokeOpacity={0.6} strokeWidth={2} strokeLinecap="round" fill="none" />
            </Svg>
          </Animated.View>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: pouring }]}>
        <Svg width={320} height={320} viewBox="0 0 320 320"><Path d="M174 115q29 14 41 64l13 54" stroke="#EFA86A" strokeWidth={5} strokeLinecap="round" fill="none" /><Path d="M174 115q29 14 41 64l13 54" stroke="#FFE1AC" strokeWidth={1.5} strokeOpacity={0.8} fill="none" /><Ellipse cx={228} cy={236} rx={9} ry={2.5} stroke="#F8CD8F" strokeWidth={1.5} fill="none" /></Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: drink }]}>
        <Svg width={320} height={320} viewBox="0 0 320 320">
          <Defs><LinearGradient id={`${id}-drink`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FFC784" stopOpacity={0.9} /><Stop offset="1" stopColor="#C46B40" stopOpacity={0.85} /></LinearGradient><ClipPath id={`${id}-bowl`}><Path d="M187 225C190 254 210 272 236 272S282 254 285 225Z" /></ClipPath></Defs>
          <G clipPath={`url(#${id}-bowl)`}><Rect x={187} y={239} width={99} height={36} fill={`url(#${id}-drink)`} /><Ellipse cx={236} cy={239} rx={43} ry={5} fill="#FFE0A5" fillOpacity={0.7} /><Path d="m213 239 14-5 9 15-15 5Z" fill="#F2EEE0" fillOpacity={0.5} stroke="#FFF8E8" strokeOpacity={0.7} strokeWidth={1} /><Path d="m238 239 13-2 5 14-13 3Z" fill="#F2EEE0" fillOpacity={0.3} /></G>
        </Svg>
      </Animated.View>
      <Svg style={StyleSheet.absoluteFill} width={320} height={320} viewBox="0 0 320 320">
        <Path d="M187 225C190 254 210 272 236 272S282 254 285 225M236 272v27" stroke="#F1E7D7" strokeOpacity={0.7} strokeWidth={1.5} fill="none" />
        <Ellipse cx={236} cy={225} rx={49} ry={7} stroke="#F4EBD7" strokeOpacity={0.8} strokeWidth={1.4} fill="none" />
        <Ellipse cx={236} cy={301} rx={28} ry={4} fill="#D3E5DC" fillOpacity={0.12} stroke="#E5E7D7" strokeOpacity={0.55} strokeWidth={1.2} />
        <Path d="M196 233q5 19 19 26M239 278v17" stroke="#FFFAEA" strokeOpacity={0.7} strokeWidth={2} strokeLinecap="round" fill="none" />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: garnish }]}>
        <Svg width={320} height={320} viewBox="0 0 320 320"><Circle cx={277} cy={230} r={14} fill="#E6AA60" stroke="#FFE0A0" strokeWidth={2} /><Circle cx={277} cy={230} r={10} fill="#F9D18A" /><Path d="M277 220v20m-10-10h20m-17-7 14 14m-14 0 14-14" stroke="#FFF0C8" strokeWidth={1.2} /><Path d="M266 220q-1-13 9-17 5 11-5 19Z" fill="#91B8A0" /><Path d="m271 219 2-11" stroke="#C8DEC0" strokeWidth={0.8} /></Svg>
      </Animated.View>
    </View>
  </View>;
});
