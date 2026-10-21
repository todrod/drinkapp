export interface MotionSample { x: number; y: number; z: number }

/** Samples are in g, including gravity, on both native and web. */
export function createShakeDetector() {
  let peaks: number[] = [];
  let aboveThreshold = false;
  let lastPeak = -Infinity;
  let lastFired = -Infinity;

  return {
    reset() {
      peaks = [];
      aboveThreshold = false;
      lastPeak = -Infinity;
      lastFired = -Infinity;
    },
    sample({ x, y, z }: MotionSample, now = Date.now()): boolean {
      if (![x, y, z, now].every(Number.isFinite)) return false;
      const magnitude = Math.hypot(x, y, z);
      if (magnitude < 1.25) aboveThreshold = false;
      if (magnitude < 1.7 || aboveThreshold || now - lastPeak < 80) return false;
      aboveThreshold = true;
      lastPeak = now;
      if (now - lastFired < 1800) return false;

      // Count distinct jolts, not consecutive samples from one bump.
      peaks = peaks.filter((time) => now - time <= 800);
      peaks.push(now);
      if (peaks.length < 3) return false;
      peaks = [];
      lastFired = now;
      return true;
    },
  };
}
