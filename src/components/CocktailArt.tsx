import React, { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export function CocktailArt({ color, glass, size = 104 }: { color: string; glass?: string | null; size?: number }) {
  const id = useId().replace(/:/g, '');
  const tall = /highball|collins|flute|mug|hurricane/.test(glass ?? '');
  const rocks = /rocks/.test(glass ?? '');
  const coupe = /coupe/.test(glass ?? '');
  const bowl = tall ? 'M36 18h48l-5 82H41Z' : rocks ? 'M28 42h64l-5 58H33Z' : coupe ? 'M20 30h80a40 34 0 0 1-80 0Z' : 'M20 26h80L60 72Z';
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" aria-hidden={true}>
      <Defs>
        <LinearGradient id={`${id}-drink`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.75} /><Stop offset="1" stopColor={color} />
        </LinearGradient>
        <ClipPath id={`${id}-glass`}><Path d={bowl} /></ClipPath>
      </Defs>
      <Circle cx={60} cy={60} r={47} fill={color} opacity={0.07} />
      <Path d={bowl} fill="#D9D4EC" fillOpacity={0.08} />
      <G clipPath={`url(#${id}-glass)`}>
        <Rect x={20} y={tall ? 39 : rocks ? 56 : 38} width={80} height={70} fill={`url(#${id}-drink)`} />
        {tall || rocks ? <><Rect x={42} y={45} width={19} height={18} rx={4} fill="#FFFFFF" opacity={0.25} transform="rotate(15 50 54)" /><Rect x={57} y={68} width={19} height={18} rx={4} fill="#FFFFFF" opacity={0.2} transform="rotate(-12 66 77)" /></> : null}
        <Path d={tall ? 'M44 24l3 64' : rocks ? 'M36 49l3 40' : 'M30 31l24 28'} stroke="#FFFFFF" strokeWidth={2.5} strokeOpacity={0.45} strokeLinecap="round" />
      </G>
      <Path d={bowl} stroke="#E7DEEA" strokeOpacity={0.7} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
      {!tall && !rocks ? <Path d={coupe ? 'M60 64v38 M43 103h34' : 'M60 72v30 M43 103h34'} stroke="#E7DEEA" strokeOpacity={0.7} strokeWidth={2} strokeLinecap="round" /> : null}
      <Circle cx={tall ? 80 : 90} cy={tall ? 25 : 29} r={13} fill="#F0CA79" stroke="#FFE7AE" strokeWidth={2} />
      <Path d={tall ? 'M80 14v22 M69 25h22 M72 17l16 16 M72 33l16-16' : 'M90 18v22 M79 29h22 M82 21l16 16 M82 37l16-16'} stroke="#FFE7AE" strokeWidth={1} />
      <Path d="M18 101q13-13 25-3-11 14-25 3Z" fill="#83AE8E" /><Path d="m18 101 19-2" stroke="#C1D9B4" strokeWidth={1} />
    </Svg>
  );
}
