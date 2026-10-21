import React, { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

/** Vector glass keeps the centerpiece sharp and offline on both native and web. */
export function CrystalBall({ size = 300 }: { size?: number }) {
  const id = useId().replace(/:/g, '');
  const paint = (name: string) => `url(#${id}-${name})`;
  return (
    <Svg width={size} height={size} viewBox="0 0 320 320" aria-hidden={true}>
      <Defs>
        <RadialGradient id={`${id}-halo`}>
          <Stop offset="0" stopColor="#DC969B" stopOpacity={0.48} />
          <Stop offset="0.65" stopColor="#AA4E60" stopOpacity={0.14} />
          <Stop offset="1" stopColor="#AA4E60" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`${id}-glass`} cx="32%" cy="25%" r="85%">
          <Stop offset="0" stopColor="#F5D4CD" stopOpacity={0.95} />
          <Stop offset="0.28" stopColor="#C8848D" stopOpacity={0.8} />
          <Stop offset="0.65" stopColor="#814451" stopOpacity={0.95} />
          <Stop offset="0.88" stopColor="#40232C" />
          <Stop offset="1" stopColor="#DB9DA1" />
        </RadialGradient>
        <LinearGradient id={`${id}-mist`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F6CACA" stopOpacity={0} />
          <Stop offset="0.5" stopColor="#F4BDB9" stopOpacity={0.65} />
          <Stop offset="1" stopColor="#E7B790" stopOpacity={0.05} />
        </LinearGradient>
        <LinearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#B89372" /><Stop offset="0.35" stopColor="#533B3E" /><Stop offset="1" stopColor="#2D1E23" />
        </LinearGradient>
        <ClipPath id={`${id}-clip`}><Circle cx={160} cy={137} r={100} /></ClipPath>
      </Defs>
      <Circle cx={160} cy={142} r={155} fill={paint('halo')} />
      <Ellipse cx={160} cy={281} rx={82} ry={9} fill="#10080B" opacity={0.6} />
      <Path d="M113 224q47 14 94 0l-11 32q15 5 17 15H107q2-10 17-15Z" fill={paint('base')} stroke="#D5B699" strokeOpacity={0.5} />
      <Ellipse cx={160} cy={230} rx={49} ry={9} fill="#9E7F76" />
      <Circle cx={160} cy={137} r={100} fill={paint('glass')} stroke="#F6D5D4" strokeOpacity={0.68} strokeWidth={1.3} />
      <G clipPath={paint('clip')}>
        <Path d="M36 173q70-78 140-5t112-36l-4 74q-69 42-124 0T36 200Z" fill={paint('mist')} />
        <Path d="M59 179q82-42 153 0t67-23" fill="none" stroke="#F3D0BE" strokeOpacity={0.23} strokeWidth={2} />
        <Ellipse cx={121} cy={83} rx={39} ry={20} fill="#FFF4ED" opacity={0.19} transform="rotate(-32 121 83)" />
        <Path d="M83 107q10-35 42-45" fill="none" stroke="#FFF3EC" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
        <Path d="M237 157q-4 36-34 55" fill="none" stroke="#F2CECD" strokeWidth={2} strokeLinecap="round" opacity={0.55} />
        <G stroke="#FFF4E8" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <Path d="M126 119h68l-34 39Z M160 158v37 M141 195h38" />
          <Path d="M137 130h46l-23 26Z" fill="#F4C79D" fillOpacity={0.65} stroke="none" />
          <Path d="m173 125 18-30" />
          <Circle cx={183} cy={106} r={13} stroke="#F5CDA3" />
        </G>
        <Circle cx={111} cy={161} r={2} fill="#FBE5DC" /><Circle cx={202} cy={151} r={1.5} fill="#FBE5DC" />
      </G>
      <G stroke="#F6D4AD" strokeWidth={1.4} fill="none" strokeLinecap="round">
        <Path d="m44 77 3-9 3 9 9 3-9 3-3 9-3-9-9-3Z M260 65l2-6 2 6 6 2-6 2-2 6-2-6-6-2Z M267 197l3-8 3 8 8 3-8 3-3 8-3-8-8-3Z" />
        <Path d="M127 249q33 7 66 0 M113 269h94" strokeOpacity={0.7} />
      </G>
      <Circle cx={67} cy={211} r={2.4} fill="#D7A3A0" /><Circle cx={238} cy={33} r={1.6} fill="#F6D4AD" />
    </Svg>
  );
}
