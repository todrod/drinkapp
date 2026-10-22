import React from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { C } from '../theme';

export function Atmosphere() {
  const { width, height } = useWindowDimensions();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" aria-hidden={true}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.ink }]} />
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="room-glow">
            <Stop offset="0" stopColor={C.ambient} stopOpacity={0.10} />
            <Stop offset="1" stopColor={C.ambient} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={width * 0.8} cy={height * 0.1} rx={width * 0.8} ry={height * 0.7} fill="url(#room-glow)" />
      </Svg>
      <Image source={require('../../assets/grain.png')} resizeMode="repeat" style={[StyleSheet.absoluteFill, { opacity: 0.025 }]} />
    </View>
  );
}
