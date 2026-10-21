import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { createShakeDetector } from '../logic/shake';
import { getMotionState, requestMotionPermission, subscribeMotion } from '../sensors/motion';
import type { MotionState } from '../sensors/motion.types';

interface Options { enabled: boolean; onShake: () => void }
export type ShakeStatus = 'checking' | 'unsupported' | 'insecure' | 'requesting' | 'denied' | 'off' | 'permission' | 'ready' | 'unavailable' | 'waiting';

export function useShakeDetector({ enabled, onShake }: Options) {
  const [motion, setMotion] = useState<MotionState | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [foreground, setForeground] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const detector = useRef(createShakeDetector()).current;
  const handler = useRef(onShake);
  const mounted = useRef(true);
  handler.current = onShake;

  useEffect(() => {
    mounted.current = true;
    getMotionState().then((state) => {
      if (mounted.current) setMotion(state);
    }).catch(() => {
      if (mounted.current) setMotion({ support: 'unsupported', permission: 'denied' });
    });
    const subscription = AppState.addEventListener('change', (state) => setForeground(state === 'active'));
    return () => { mounted.current = false; subscription.remove(); };
  }, []);

  const requestPermission = useCallback(async () => {
    setRequesting(true);
    try {
      const permission = await requestMotionPermission();
      if (mounted.current) {
        setMotion((state) => state ? { ...state, permission } : state);
        if (permission === 'granted') setAttempt((value) => value + 1);
      }
      return permission === 'granted';
    } catch {
      if (mounted.current) setMotion((state) => state ? { ...state, permission: 'denied' } : state);
      return false;
    } finally {
      if (mounted.current) setRequesting(false);
    }
  }, []);

  const listening = enabled && foreground && motion?.support === 'supported' && motion.permission === 'granted';
  useEffect(() => {
    detector.reset();
    setReceiving(false);
    setTimedOut(false);
    if (!listening) return;
    let seenSample = false;
    const timeout = setTimeout(() => setTimedOut(true), 3000);
    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeMotion((sample) => {
        if (![sample.x, sample.y, sample.z].every(Number.isFinite)) return;
        if (!seenSample) {
          seenSample = true;
          clearTimeout(timeout);
          setReceiving(true);
        }
        if (detector.sample(sample)) handler.current();
      });
    } catch {
      clearTimeout(timeout);
      setTimedOut(true);
    }
    return () => { clearTimeout(timeout); unsubscribe(); detector.reset(); };
  }, [listening, detector, attempt]);

  const status: ShakeStatus = !motion ? 'checking' : motion.support !== 'supported' ? motion.support :
    requesting ? 'requesting' : motion.permission === 'denied' ? 'denied' :
    !enabled ? 'off' : motion.permission !== 'granted' ? 'permission' :
    receiving ? 'ready' : timedOut ? 'unavailable' : 'waiting';

  return { status, requestPermission };
}
