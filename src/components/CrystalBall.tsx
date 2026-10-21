import React, { memo, useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { Image } from 'expo-image';

const animation = require('../../assets/magic-orb.webp');
const poster = require('../../assets/magic-orb-poster.png');

interface Props {
  size?: number;
  motionEnabled: boolean;
  visible: boolean;
}

/** The surrounding button owns tap and shake selection; this is decorative media. */
export const CrystalBall = memo(function CrystalBall({ size = 320, motionEnabled, visible }: Props) {
  const [foreground, setForeground] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);

  const playing = motionEnabled && visible && foreground && !failed;
  return (
    <View style={{ width: size, height: size, backgroundColor: '#000' }} pointerEvents="none" aria-hidden={true}>
      {/* An animated image cannot be paused by an HTML img. Swapping to its matching poster
          also releases animation work offscreen and honors reduced motion on web. */}
      <Image source={playing ? animation : poster} placeholder={poster} placeholderContentFit="contain" autoplay={playing} contentFit="contain"
        style={{ width: size, height: size }} transition={0} accessible={false}
        cachePolicy="disk" useAppleWebpCodec={false} onError={() => setFailed(true)} />
    </View>
  );
});
