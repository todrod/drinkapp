import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';

/**
 * Physical shake detection.
 *
 * A single threshold crossing fires on anything — setting the phone down, a
 * pocket bump. Requiring several spikes inside a short window means it only
 * triggers on a sustained shake, which is what the gesture actually is.
 *
 * Web notes: DeviceMotion needs HTTPS and, on iOS Safari, an explicit
 * permission grant that must originate from a user tap — hence
 * `requestPermission` being exposed for a button to call rather than fired
 * automatically on mount.
 */

const SPIKE_G = 1.7; // magnitude above resting 1g that counts as a jolt
const SPIKES_NEEDED = 3;
const WINDOW_MS = 600;
const COOLDOWN_MS = 1500;
const SAMPLE_MS = 80;

interface Options {
  enabled: boolean;
  onShake: () => void;
}

export function useShakeDetector({ enabled, onShake }: Options) {
  const [available, setAvailable] = useState(false);
  const [granted, setGranted] = useState(Platform.OS !== 'web');

  const spikes = useRef<number[]>([]);
  const lastFired = useRef(0);
  // Kept in a ref so re-registering the listener is not needed when the
  // callback identity changes between renders.
  const handler = useRef(onShake);
  handler.current = onShake;

  useEffect(() => {
    let cancelled = false;
    Accelerometer.isAvailableAsync()
      .then((ok) => !cancelled && setAvailable(ok))
      .catch(() => !cancelled && setAvailable(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const res = await Accelerometer.requestPermissionsAsync();
      const ok = res.status === 'granted';
      setGranted(ok);
      return ok;
    } catch {
      setGranted(false);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !available || !granted) return;

    Accelerometer.setUpdateInterval(SAMPLE_MS);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (magnitude < SPIKE_G) return;

      const now = Date.now();
      if (now - lastFired.current < COOLDOWN_MS) return;

      spikes.current = [...spikes.current, now].filter((t) => now - t <= WINDOW_MS);
      if (spikes.current.length >= SPIKES_NEEDED) {
        spikes.current = [];
        lastFired.current = now;
        handler.current();
      }
    });

    return () => sub.remove();
  }, [enabled, available, granted]);

  return {
    /** Device reports a usable accelerometer. */
    available,
    /** Motion access still needs a tap to grant (iOS Safari). */
    needsPermission: available && !granted,
    requestPermission,
  };
}
