export type MotionPermission = 'granted' | 'prompt' | 'denied';
export interface MotionState {
  support: 'supported' | 'unsupported' | 'insecure';
  permission: MotionPermission;
}
