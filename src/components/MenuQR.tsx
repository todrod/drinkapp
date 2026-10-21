import React, { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import qrcode from 'qrcode-generator';
import { View } from 'react-native';

export function MenuQR({ value }: { value: string }) {
  const matrix = useMemo(() => {
    try {
      const qr = qrcode(0, 'M'); qr.addData(value); qr.make();
      const count = qr.getModuleCount();
      const commands: string[] = [];
      for (let row = 0; row < count; row++) for (let col = 0; col < count; col++) if (qr.isDark(row, col)) commands.push(`M${col + 4} ${row + 4}h1v1h-1z`);
      return { size: count + 8, path: commands.join('') };
    } catch { return null; }
  }, [value]);
  if (!matrix) return null;
  return <View accessible accessibilityRole="image" accessibilityLabel="QR code for the read-only guest menu" style={{ width: '100%', maxWidth: 320, aspectRatio: 1, alignSelf: 'center' }}>
    <Svg viewBox={`0 0 ${matrix.size} ${matrix.size}`} width="100%" height="100%"><Rect width={matrix.size} height={matrix.size} fill="#fff" /><Path d={matrix.path} fill="#111" /></Svg>
  </View>;
}
