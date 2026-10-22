import type { AppInstall } from '../install/types';

// Already running as a native app. Keep browser globals out of native bundles.
const nativeInstall: AppInstall = {
  snapshot: { installed: true, canPrompt: false, prompting: false, platform: 'desktop', canSuggest: false, hintDismissedUntil: 0 },
  showEntry: false, hintVisible: false, dismissHint: () => {}, requestInstall: async () => 'installed',
};
export function useAppInstall(_enabled: boolean): AppInstall { return nativeInstall; }
