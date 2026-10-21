import { Accelerometer } from 'expo-sensors';
import type { MotionSample } from '../logic/shake';
import type { MotionPermission, MotionState } from './motion.types';

export async function getMotionState(): Promise<MotionState> {
  const [available, permission] = await Promise.all([
    Accelerometer.isAvailableAsync(), Accelerometer.getPermissionsAsync(),
  ]);
  return {
    support: available ? 'supported' : 'unsupported',
    permission: permission.status === 'undetermined' ? 'prompt' : permission.status,
  };
}

export async function requestMotionPermission(): Promise<MotionPermission> {
  const result = await Accelerometer.requestPermissionsAsync();
  return result.status === 'undetermined' ? 'prompt' : result.status;
}

export function subscribeMotion(listener: (sample: MotionSample) => void): () => void {
  Accelerometer.setUpdateInterval(80);
  const subscription = Accelerometer.addListener(listener);
  return () => subscription.remove();
}
