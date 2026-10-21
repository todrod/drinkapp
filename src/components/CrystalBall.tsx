import React, { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Animated, AppState, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

const NATIVE_DRIVER = Platform.OS !== 'web';
const TRACK = Array.from({ length: 33 }, (_, i) => i / 32);
const BUBBLES = [
  { x: 48, size: 5, phase: 0.05 }, { x: 73, size: 3, phase: 0.38 },
  { x: 151, size: 5, phase: 0.66 }, { x: 176, size: 3, phase: 0.24 },
  { x: 126, size: 3, phase: 0.85 },
];

interface Props {
  size?: number;
  motionEnabled: boolean;
  visible: boolean;
  /** Tap, search and phone shake share this selection timeline. */
  selection: Animated.Value;
}

/** Layered vector glass with native-driven transforms; no per-frame React renders. */
export const CrystalBall = memo(function CrystalBall({ size = 320, motionEnabled, visible, selection }: Props) {
  const id = useId().replace(/:/g, '');
  const paint = (name: string) => `url(#${id}-${name})`;
  const u = size / 360;
  const breathe = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;
  const fizz = useRef(new Animated.Value(0)).current;
  const [foreground, setForeground] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!motionEnabled || !visible || !foreground) return;
    const timing = (value: Animated.Value, toValue: number, duration: number, easing = Easing.linear) =>
      Animated.timing(value, { toValue, duration, easing, useNativeDriver: NATIVE_DRIVER, isInteraction: false });
    const loops = [
      Animated.loop(Animated.sequence([
        timing(breathe, 1, 3000, Easing.inOut(Easing.sin)),
        timing(breathe, 0, 3000, Easing.inOut(Easing.sin)),
      ])),
      Animated.loop(timing(orbit, 1, 18000)),
      Animated.loop(timing(fizz, 1, 7200)),
    ];
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [motionEnabled, visible, foreground, breathe, orbit, fizz]);

  // A deliberately composed still also serves reduced motion and the pause control.
  useEffect(() => {
    if (motionEnabled) return;
    breathe.setValue(0.35);
    orbit.setValue(0.12);
    fizz.setValue(0.22);
  }, [motionEnabled, breathe, orbit, fizz]);

  const particles = useMemo(() => [0, 0.36, 0.7].map((offset) => {
    const phase = Animated.modulo(Animated.add(orbit, offset), 1);
    const angle = -24 * Math.PI / 180;
    return {
      x: phase.interpolate({ inputRange: TRACK, outputRange: TRACK.map((t) =>
        (148 * Math.cos(t * Math.PI * 2) * Math.cos(angle) - 48 * Math.sin(t * Math.PI * 2) * Math.sin(angle)) * u) }),
      y: phase.interpolate({ inputRange: TRACK, outputRange: TRACK.map((t) =>
        (148 * Math.cos(t * Math.PI * 2) * Math.sin(angle) + 48 * Math.sin(t * Math.PI * 2) * Math.cos(angle)) * u) }),
      scale: phase.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0.85, 1.2, 0.85, 0.5, 0.85] }),
      front: phase.interpolate({ inputRange: [0, 0.03, 0.47, 0.5, 1], outputRange: [0, 1, 1, 0, 0] }),
      back: phase.interpolate({ inputRange: [0, 0.5, 0.53, 0.97, 1], outputRange: [0.3, 0.3, 0.5, 0.5, 0.3] }),
    };
  }), [orbit, u]);

  const bubbles = useMemo(() => BUBBLES.map((bubble) => {
    const phase = Animated.modulo(Animated.add(fizz, bubble.phase), 1);
    return { ...bubble,
      y: phase.interpolate({ inputRange: [0, 1], outputRange: [42 * u, -108 * u] }),
      opacity: phase.interpolate({ inputRange: [0, 0.12, 0.7, 1], outputRange: [0, 0.55, 0.45, 0] }),
    };
  }), [fizz, u]);

  const box = (left: number, top: number, width: number, height = width) =>
    ({ position: 'absolute' as const, left: left * u, top: top * u, width: width * u, height: height * u });
  const energy = selection.interpolate({ inputRange: [0, 0.25, 0.65, 1], outputRange: [0, 1, 0.8, 0] });
  const slosh = selection.interpolate({ inputRange: [0, 0.22, 0.45, 0.7, 1], outputRange: [0, -12, 10, -5, 0] });
  const orbitTurn = selection.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const float = breathe.interpolate({ inputRange: [0, 1], outputRange: [0, -8 * u] });
  const renderParticles = (front: boolean) => particles.map((particle, i) => (
    <Animated.View key={i} style={[box(175, 150, 10), {
      opacity: front ? particle.front : particle.back,
      transform: [{ translateX: particle.x }, { translateY: particle.y }, { scale: particle.scale }],
    }]}>
      <Svg width={10 * u} height={10 * u} viewBox="0 0 10 10" aria-hidden={true}>
        {i === 1 ? <Path d="M5 0l1.2 3.8L10 5 6.2 6.2 5 10 3.8 6.2 0 5l3.8-1.2Z" fill="#FFE4B9" /> :
          <><Circle cx={5} cy={5} r={4.5} fill="#FBD1B2" opacity={0.2} /><Circle cx={5} cy={5} r={2.2} fill="#FFE9CD" /></>}
      </Svg>
    </Animated.View>
  ));

  return (
    <View style={{ width: size, height: size }} pointerEvents="none" aria-hidden={true}>
      <Svg width={size} height={size} viewBox="0 0 360 360" style={StyleSheet.absoluteFill} aria-hidden={true}>
        <Defs>
          <RadialGradient id={`${id}-halo`}>
            <Stop offset="0" stopColor="#E96D7D" stopOpacity={0.32} />
            <Stop offset="0.6" stopColor="#C9455C" stopOpacity={0.12} /><Stop offset="1" stopColor="#AE304C" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id={`${id}-brass`} x1="0" y1="0" x2="0.9" y2="1">
            <Stop offset="0" stopColor="#F4D2A5" /><Stop offset="0.32" stopColor="#A97657" />
            <Stop offset="0.65" stopColor="#513039" /><Stop offset="1" stopColor="#C29A75" />
          </LinearGradient>
          <LinearGradient id={`${id}-dais`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#855347" /><Stop offset="0.45" stopColor="#36202B" /><Stop offset="1" stopColor="#1E0C16" />
          </LinearGradient>
        </Defs>
        <Circle cx={180} cy={157} r={174} fill={paint('halo')} />
        <Ellipse cx={180} cy={321} rx={79} ry={9} fill="#12070C" opacity={0.65} />
        <Path d="M112 294v12c0 19 136 19 136 0v-12Z" fill={paint('dais')} stroke="#A67A64" strokeOpacity={0.4} />
        <Ellipse cx={180} cy={294} rx={68} ry={16} fill={paint('brass')} />
        <Ellipse cx={180} cy={293} rx={59} ry={11} fill="#321721" stroke="#E6B98E" strokeWidth={0.7} />
        <Ellipse cx={180} cy={293} rx={42} ry={6} fill="none" stroke="#DCA77D" strokeOpacity={0.4} />
        <Path d="M126 283q-10-12-7-30 M234 283q10-12 7-30" fill="none" stroke={paint('brass')} strokeWidth={4} strokeLinecap="round" />
        <Path d="M119 311q61 16 122 0" fill="none" stroke="#D7A87E" strokeOpacity={0.5} strokeWidth={0.7} />
      </Svg>

      <Animated.View style={[box(107, 278, 146, 24), { opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.25] }),
        transform: [{ scaleX: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 0.8] }) }] }]}>
        <Svg width={146 * u} height={24 * u} viewBox="0 0 146 24" aria-hidden={true}>
          <Ellipse cx={73} cy={12} rx={51} ry={8} fill="#10070C" />
        </Svg>
      </Animated.View>
      <Animated.View style={[box(0, -25, 360), { opacity: energy, transform: [{ scale: selection.interpolate({
        inputRange: [0, 0.4, 1], outputRange: [0.86, 1.08, 1.18] }) }] }]}>
        <Svg width={size} height={size} viewBox="0 0 360 360" aria-hidden={true}>
          <Defs><RadialGradient id={`${id}-charge`}>
            <Stop offset="0" stopColor="#FFD9B2" stopOpacity={0} /><Stop offset="0.5" stopColor="#EA9B81" stopOpacity={0.1} />
            <Stop offset="0.64" stopColor="#FFBC9D" stopOpacity={0.5} /><Stop offset="1" stopColor="#E66F81" stopOpacity={0} />
          </RadialGradient></Defs>
          <Circle cx={180} cy={180} r={172} fill={paint('charge')} />
        </Svg>
      </Animated.View>
      <Animated.View style={[box(0, -25, 360), { transform: [{ rotate: orbitTurn }] }]}>
        <Svg width={size} height={size} viewBox="0 0 360 360" aria-hidden={true}>
          <Ellipse cx={180} cy={180} rx={148} ry={48} transform="rotate(-24 180 180)" fill="none" stroke="#EDC39A" strokeOpacity={0.24} strokeWidth={0.8} />
          <Ellipse cx={180} cy={180} rx={139} ry={43} transform="rotate(33 180 180)" fill="none" stroke="#ECAAA6" strokeOpacity={0.12} strokeWidth={0.6} strokeDasharray="2 9" />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: -25 * u }, { rotate: orbitTurn }, { translateY: 25 * u }] }]}>
        {renderParticles(false)}
      </Animated.View>

      <Animated.View style={[box(68, 43, 224), { transform: [{ translateY: float }, { rotate: slosh.interpolate({
        inputRange: [-12, 12], outputRange: ['-3deg', '3deg'] }) }] }]}>
        {/* Clip the moving liquid once at the glass boundary on every platform. */}
        <View style={{ width: 224 * u, height: 224 * u, borderRadius: 112 * u, overflow: 'hidden' }}>
          <Svg width={224 * u} height={224 * u} viewBox="0 0 224 224" style={StyleSheet.absoluteFill} aria-hidden={true}>
            <Defs>
              <RadialGradient id={`${id}-glass`} cx="28%" cy="19%" r="90%">
                <Stop offset="0" stopColor="#D79491" /><Stop offset="0.24" stopColor="#A64F60" />
                <Stop offset="0.58" stopColor="#5E1E34" /><Stop offset="0.84" stopColor="#280D20" /><Stop offset="1" stopColor="#B35C66" />
              </RadialGradient>
              <RadialGradient id={`${id}-heart`}>
                <Stop offset="0" stopColor="#EDB695" stopOpacity={0.32} /><Stop offset="1" stopColor="#EDB695" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={112} cy={112} r={112} fill={paint('glass')} />
            <Circle cx={112} cy={121} r={84} fill={paint('heart')} />
            <Path d="M19 144q52 48 155 18" fill="none" stroke="#DC8490" strokeOpacity={0.1} strokeWidth={25} />
          </Svg>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [
            { translateX: breathe.interpolate({ inputRange: [0, 1], outputRange: [-10 * u, 12 * u] }) },
            { rotate: Animated.add(slosh, breathe.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] })).interpolate({ inputRange: [-20, 20], outputRange: ['-20deg', '20deg'] }) },
          ] }]}>
            <Svg width={288 * u} height={288 * u} viewBox="-32 -32 288 288" style={box(-32, -32, 288)} aria-hidden={true}>
              <Defs><LinearGradient id={`${id}-liquid`} x1="0" y1="0" x2="0.8" y2="1">
                <Stop offset="0" stopColor="#EAA891" stopOpacity={0.75} /><Stop offset="0.4" stopColor="#BC5269" stopOpacity={0.52} />
                <Stop offset="1" stopColor="#4A1631" stopOpacity={0.1} />
              </LinearGradient></Defs>
              <Path d="M-32 137C16 104 50 107 106 138S207 174 256 112V256H-32Z" fill={paint('liquid')} />
              <Path d="M-32 137C16 104 50 107 106 138S207 174 256 112" fill="none" stroke="#F2C4AD" strokeOpacity={0.5} strokeWidth={0.8} />
            </Svg>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: 0.6, transform: [
            { translateY: breathe.interpolate({ inputRange: [0, 1], outputRange: [-6 * u, 7 * u] }) },
            { rotate: breathe.interpolate({ inputRange: [0, 1], outputRange: ['8deg', '-8deg'] }) },
          ] }]}>
            <Svg width={288 * u} height={288 * u} viewBox="-32 -32 288 288" style={box(-32, -32, 288)} aria-hidden={true}>
              <Path d="M-32 184C42 110 80 181 144 159S207 116 256 160V256H-32Z" fill="#D78A92" fillOpacity={0.25} />
              <Path d="M-32 184C42 110 80 181 144 159S207 116 256 160" fill="none" stroke="#EEAAA4" strokeOpacity={0.45} strokeWidth={0.7} />
            </Svg>
          </Animated.View>
          {bubbles.map((bubble, i) => (
            <Animated.View key={i} style={[box(bubble.x, 158, bubble.size), { opacity: bubble.opacity, transform: [{ translateY: bubble.y }] }]}>
              <Svg width={bubble.size * u} height={bubble.size * u} viewBox="0 0 8 8" aria-hidden={true}>
                <Circle cx={4} cy={4} r={3} fill="#FFE3BF" fillOpacity={0.14} stroke="#FFE3BF" strokeWidth={0.8} />
              </Svg>
            </Animated.View>
          ))}
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [
            { translateY: breathe.interpolate({ inputRange: [0, 1], outputRange: [3 * u, -3 * u] }) },
            { rotate: breathe.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] }) },
          ] }]}>
            <Svg width={224 * u} height={224 * u} viewBox="0 0 224 224" aria-hidden={true}>
              <Defs>
                <LinearGradient id={`${id}-nectar`} x1="0" y1="0" x2="0.2" y2="1">
                  <Stop offset="0" stopColor="#FFE3AD" /><Stop offset="1" stopColor="#DB956E" stopOpacity={0.55} />
                </LinearGradient>
                <LinearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="0.7">
                  <Stop offset="0" stopColor="#FFF4DA" /><Stop offset="0.55" stopColor="#F5C4BC" stopOpacity={0.6} /><Stop offset="1" stopColor="#FFF2DA" />
                </LinearGradient>
              </Defs>
              <Path d="M68 81h88l-44 51Z" fill="#FFF2E2" fillOpacity={0.05} stroke={paint('rim')} strokeWidth={2.2} strokeLinejoin="round" />
              <Path d="M78 94q20-4 37 0t31-1l-34 38Z" fill={paint('nectar')} />
              <Path d="M112 132v42 M92 174h40" fill="none" stroke={paint('rim')} strokeWidth={2.2} strokeLinecap="round" />
              <Ellipse cx={112} cy={176} rx={24} ry={3} fill="#F4CFB7" fillOpacity={0.12} />
              <Path d="M71 81h82" stroke="#FFF3DC" strokeWidth={1.4} strokeLinecap="round" />
              <Path d="m130 88 29-44" stroke="#E5B895" strokeWidth={1.7} strokeLinecap="round" />
            </Svg>
          </Animated.View>
          <Animated.View style={[box(135, 43, 37), { transform: [
            { translateY: breathe.interpolate({ inputRange: [0, 1], outputRange: [2 * u, -2 * u] }) },
            { rotate: breathe.interpolate({ inputRange: [0, 1], outputRange: ['-18deg', '24deg'] }) },
          ] }]}>
            <Svg width={37 * u} height={37 * u} viewBox="0 0 40 40" aria-hidden={true}>
              <Circle cx={20} cy={20} r={17} fill="#BC7659" stroke="#FFE0AE" strokeWidth={2} />
              <Circle cx={20} cy={20} r={13.5} fill="#F4C884" stroke="#F7DCA6" strokeWidth={1} />
              <G stroke="#FFE9BA" strokeWidth={1.3} strokeLinecap="round"><Path d="M20 7v26 M7 20h26 M11 11l18 18 M11 29l18-18" /></G>
              <Circle cx={20} cy={20} r={2.8} fill="#FFF0C8" />
            </Svg>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }),
            transform: [{ translateX: breathe.interpolate({ inputRange: [0, 1], outputRange: [-2 * u, 3 * u] }) }] }]}>
            <Svg width={224 * u} height={224 * u} viewBox="0 0 224 224" aria-hidden={true}>
              <Ellipse cx={67} cy={46} rx={43} ry={22} fill="#FFEAE2" opacity={0.13} transform="rotate(-38 67 46)" />
              <Path d="M27 76q13-37 48-49" fill="none" stroke="#FFF4E4" strokeWidth={4.5} strokeLinecap="round" opacity={0.8} />
              <Path d="M30 85q-3 9-4 16 M203 130q-3 39-32 60" fill="none" stroke="#F7CBC3" strokeWidth={1.6} strokeLinecap="round" opacity={0.65} />
              <Path d="M51 195q48 28 98 9" fill="none" stroke="#F6BCAE" strokeWidth={0.7} opacity={0.5} />
            </Svg>
          </Animated.View>
        </View>
        <View style={[StyleSheet.absoluteFill, { borderRadius: 112 * u, borderWidth: 1, borderColor: '#E3B4AD88' }]} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: -25 * u }, { rotate: orbitTurn }, { translateY: 25 * u }] }]}>
        {renderParticles(true)}
      </Animated.View>
      <Animated.View style={[box(31, 68, 20), { opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] }),
        transform: [{ rotate: breathe.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '12deg'] }) }] }]}>
        <Svg width={20 * u} height={20 * u} viewBox="0 0 20 20" fill="none" stroke="#F8D2AC" strokeWidth={0.9} aria-hidden={true}>
          <Path d="m10 1 2.2 6.8L19 10l-6.8 2.2L10 19l-2.2-6.8L1 10l6.8-2.2Z" />
        </Svg>
      </Animated.View>
      <Svg width={size} height={size} viewBox="0 0 360 360" style={StyleSheet.absoluteFill} aria-hidden={true}>
        <Path d="M293 56v10 M288 61h10 M62 233v6 M59 236h6" fill="none" stroke="#EBC9A5" strokeWidth={1} strokeLinecap="round" opacity={0.7} />
        <Circle cx={266} cy={31} r={1.2} fill="#F6D4AD" /><Circle cx={307} cy={216} r={1.7} fill="#D7A3A0" />
      </Svg>
    </View>
  );
});
