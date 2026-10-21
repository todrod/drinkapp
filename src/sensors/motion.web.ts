import type { MotionSample } from '../logic/shake';
import type { MotionPermission, MotionState } from './motion.types';

type MotionConstructor = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

// Safari has no permission-query API for motion. Remember its answer while
// switching tabs in this app, but request again after a full page reload.
let permission: MotionPermission | undefined;

function support(): MotionState['support'] {
  if (typeof window === 'undefined') return 'unsupported';
  if (!window.isSecureContext) return 'insecure';
  return typeof window.DeviceMotionEvent === 'function' ? 'supported' : 'unsupported';
}

export async function getMotionState(): Promise<MotionState> {
  const available = support();
  const motion = available === 'supported' ? window.DeviceMotionEvent as MotionConstructor : undefined;
  return {
    support: available,
    // Checking for actual events before asking permission hides the enable
    // button on iOS, where no events can arrive until the user grants access.
    permission: permission ?? (motion?.requestPermission ? 'prompt' : 'granted'),
  };
}

export async function requestMotionPermission(): Promise<MotionPermission> {
  if (support() !== 'supported') return 'denied';
  const motion = window.DeviceMotionEvent as MotionConstructor;
  try {
    // Invoke directly from the button's tap, before any await loses activation.
    permission = motion.requestPermission ? await motion.requestPermission() : 'granted';
  } catch {
    permission = 'denied';
  }
  return permission;
}

export function subscribeMotion(listener: (sample: MotionSample) => void): () => void {
  const onMotion = (event: DeviceMotionEvent) => {
    if (document.visibilityState === 'hidden') return;
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;
    const { x, y, z } = acceleration;
    if (x === null || y === null || z === null || ![x, y, z].every(Number.isFinite)) return;
    // Browser motion is m/s²; Expo's native accelerometer is already in g.
    listener({ x: x / 9.80665, y: y / 9.80665, z: z / 9.80665 });
  };
  window.addEventListener('devicemotion', onMotion);
  return () => window.removeEventListener('devicemotion', onMotion);
}
