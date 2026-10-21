import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// Shared 24-unit grid and stroke give navigation and actions one visual voice.
const PATHS = {
  pause: 'M8 5v14 M16 5v14',
  'play-outline': 'm8 4 12 8-12 8Z',
  'phone-shake': 'M9 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M11 17h2 M3 7 1 10l2 3-2 3 M21 7l2 3-2 3 2 3',
  'shuffle-variant': 'M12 3l2.1 6.9L21 12l-6.9 2.1L12 21l-2.1-6.9L3 12l6.9-2.1Z M20 2v4 M18 4h4',
  cupboard: 'M4 21V9h16v12 M2 21h20 M4 15h16 M7 9V5h3v4 M8 5V2 M14 9V4h3v5 M15.5 4V2 M7 19v-2 M16 19v-2',
  'book-open-variant': 'M12 5c-3-2-6-2-9-1v16c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Z M12 5v16 M6 8h3 M6 12h3 M15 8h3 M15 12h3',
  shaker: 'M8 3h8l1 4H7Z M6 9h12l-2 12H8Z M10 12l-1 6',
  'shaker-outline': 'M8 3h8l1 4H7Z M6 9h12l-2 12H8Z M10 12l-1 6',
  'glass-cocktail': 'M3 4h18l-9 10Z M12 14v7 M7 21h10 M7 7h10 M16 5l3-4',
  'glass-tulip': 'M4 5h16a8 8 0 0 1-16 0Z M12 13v8 M7 21h10 M7 8h10',
  'glass-wine': 'M7 3h10l1 6a6 6 0 0 1-12 0Z M12 15v6 M8 21h8 M7 8h10',
  'glass-stange': 'M6 3h12l-1 18H7Z M7 9h10 M10 12v5',
  'glass-flute': 'M8 2h8v8a4 4 0 0 1-8 0Z M12 14v7 M8 21h8',
  'cup-outline': 'M6 3h12l-3 9 3 9H6l3-9Z M9 12h6',
  'bottle-wine': 'M10 2h4v6l4 4v9H6v-9l4-4Z M10 5h4 M7 14h10 M7 18h10',
  'bottle-tonic-outline': 'M10 2h4v6l4 4v9H6v-9l4-4Z M10 5h4 M7 14h10 M7 18h10',
  'bottle-soda-classic': 'M9 2h6v4l3 4-1 4 1 4v3H6v-3l1-4-1-4 3-4Z M9 5h6 M7 13h10',
  'bottle-tonic-plus': 'M10 2h4v6l4 4v9H6v-9l4-4Z M10 5h4 M12 13v5 M9.5 15.5h5',
  'tune-variant': 'M3 6h5 M12 6h9 M3 12h11 M18 12h3 M3 18h3 M10 18h11 M8 3v6 M16 9v6 M8 15v6',
  'cog-outline': 'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  'cart-outline': 'M3 3h2l3 12h11l2-8H6 M9 15l-1 3h11',
  plus: 'M12 5v14 M5 12h14',
  close: 'M6 6l12 12 M18 6 6 18',
  check: 'M5 12l4 4L19 6',
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-up': 'M6 15l6-6 6 6',
  'chevron-right': 'M9 6l6 6-6 6',
  'arrow-right': 'M4 12h16 M14 6l6 6-6 6',
  heart: 'M20.8 4.6c-2-2-5.3-2-7.3 0L12 6.1l-1.5-1.5a5.2 5.2 0 0 0-7.3 7.4L12 21l8.8-9a5.2 5.2 0 0 0 0-7.4Z',
  'heart-outline': 'M20.8 4.6c-2-2-5.3-2-7.3 0L12 6.1l-1.5-1.5a5.2 5.2 0 0 0-7.3 7.4L12 21l8.8-9a5.2 5.2 0 0 0 0-7.4Z',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z',
  'star-outline': 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z',
  leaf: 'M20 3C8 2 2 8 5 16c8 4 15-2 15-13Z M4 21 16 8',
  'fruit-citrus': 'M3 13a9 9 0 0 0 18 0Z M6 13a6 6 0 0 0 12 0 M12 13v5 M8 13l1 3 M16 13l-1 3 M5 6l2-2 M11 5V2',
  snowflake: 'M12 2v20 M3.3 7l17.4 10 M3.3 17 20.7 7 M9 4l3 3 3-3 M9 20l3-3 3 3',
  'silverware-variant': 'M7 2v7 M4 2v5a3 3 0 0 0 6 0V2 M7 10v12 M18 2c-3 3-3 8 0 9V22 M18 2v9',
} as const;

export type LineIconName = keyof typeof PATHS;
export function hasLineIcon(name: string): name is LineIconName { return name in PATHS; }

export function LineIcon({ name, size, color, style }: {
  name: LineIconName; size: number; color: string; style?: StyleProp<ViewStyle>;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden={true}>
      <Path d={PATHS[name]} fill={name === 'heart' || name === 'star' ? color : 'none'} />
      {name === 'cart-outline' ? <><Circle cx={9} cy={20} r={0.8} /><Circle cx={18} cy={20} r={0.8} /></> : null}
    </Svg>
  );
}
