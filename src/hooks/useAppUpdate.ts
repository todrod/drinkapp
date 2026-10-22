import type { AppUpdate } from '../updates/types';

// This updater belongs to the installed website. Native apps have their own release lifecycle.
const nativeUpdate: AppUpdate = {
  snapshot: { available: false, applying: false, dismissed: false, error: null },
  dismiss: () => {}, apply: () => {},
};
export function useAppUpdate(): AppUpdate { return nativeUpdate; }
