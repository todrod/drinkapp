import type { AppUpdate } from '../updates/types';

// This updater belongs to the installed website. Native apps have their own release lifecycle.
const nativeUpdate: AppUpdate = {
  snapshot: { supported: false, checking: false, checkResult: 'idle', available: false, applying: false, dismissed: false, error: null },
  dismiss: () => {}, apply: () => {}, check: async () => {},
};
export function useAppUpdate(): AppUpdate { return nativeUpdate; }
