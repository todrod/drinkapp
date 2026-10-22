export type InstallPlatform = 'ios' | 'android' | 'desktop';
export type InstallOutcome = 'accepted' | 'dismissed' | 'instructions' | 'error' | 'busy' | 'installed';
export interface InstallSnapshot {
  installed: boolean;
  canPrompt: boolean;
  prompting: boolean;
  platform: InstallPlatform;
  canSuggest: boolean;
  hintDismissedUntil: number;
}
export interface AppInstall {
  snapshot: InstallSnapshot;
  showEntry: boolean;
  hintVisible: boolean;
  dismissHint: () => void;
  requestInstall: () => Promise<InstallOutcome>;
}
