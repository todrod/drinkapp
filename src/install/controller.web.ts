import type { InstallOutcome, InstallPlatform, InstallSnapshot } from './types';

type Choice = { outcome: 'accepted' | 'dismissed' };
type InstallEvent = Event & { prompt: () => Promise<Choice | void>; userChoice?: Promise<Choice> };
export const INSTALL_HINT_KEY = 'shaker:install-hint-until';
export const INSTALL_HINT_COOLDOWN = 7 * 24 * 60 * 60 * 1_000;

export function createInstallController(browser: Window, now = Date.now) {
  const nav = browser.navigator as Navigator & { standalone?: boolean };
  const apple = /iPhone|iPad|iPod/i.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  const platform: InstallPlatform = apple ? 'ios' : /Android/i.test(nav.userAgent) ? 'android' : 'desktop';
  const display = browser.matchMedia('(display-mode: standalone)');
  const listeners = new Set<() => void>();
  let pending: InstallEvent | null = null;
  let installedHere = false;
  let dismissedUntil = 0;
  try {
    const saved = Number(browser.localStorage.getItem(INSTALL_HINT_KEY));
    if (Number.isFinite(saved) && saved > 0) dismissedUntil = saved;
  } catch { /* A blocked preference store must not block installation. */ }
  const initiallyInstalled = display.matches || nav.standalone === true;
  let snapshot: InstallSnapshot = {
    installed: initiallyInstalled, canPrompt: false, prompting: false,
    platform, canSuggest: browser.isSecureContext && apple && !initiallyInstalled, hintDismissedUntil: dismissedUntil,
  };
  const update = (patch: Partial<InstallSnapshot>) => {
    snapshot = { ...snapshot, ...patch };
    snapshot.canSuggest = browser.isSecureContext && !snapshot.installed && (apple || snapshot.canPrompt);
    listeners.forEach((listener) => listener());
  };
  const onPrompt = (event: Event) => {
    if (snapshot.installed || typeof (event as InstallEvent).prompt !== 'function') return;
    event.preventDefault();
    pending = event as InstallEvent;
    update({ canPrompt: true });
  };
  const onInstalled = () => {
    installedHere = true;
    pending = null;
    update({ installed: true, canPrompt: false, prompting: false });
  };
  const onDisplay = () => {
    const installed = installedHere || display.matches || nav.standalone === true;
    if (installed) pending = null;
    update({ installed, canPrompt: installed ? false : !!pending });
  };
  // Capture immediately, before font loading or the age gate can delay the UI.
  browser.addEventListener('beforeinstallprompt', onPrompt);
  browser.addEventListener('appinstalled', onInstalled);
  display.addEventListener('change', onDisplay);
  const dismissHint = () => {
    const until = now() + INSTALL_HINT_COOLDOWN;
    try { browser.localStorage.setItem(INSTALL_HINT_KEY, String(until)); } catch { /* Keep the session preference. */ }
    update({ hintDismissedUntil: until });
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    dismissHint,
    async requestInstall(): Promise<InstallOutcome> {
      if (snapshot.installed) return 'installed';
      if (snapshot.prompting) return 'busy';
      if (!pending) return 'instructions';
      const event = pending;
      pending = null; // Each browser event is single-use, including rejected/dismissed requests.
      update({ canPrompt: false, prompting: true });
      dismissHint();
      try {
        // Invoke synchronously from the tap, before the first await loses activation.
        const response = await event.prompt();
        const choice = response ?? await event.userChoice;
        return choice?.outcome ?? 'instructions';
      } catch {
        return 'error';
      } finally {
        update({ prompting: false });
      }
    },
    dispose() {
      browser.removeEventListener('beforeinstallprompt', onPrompt);
      browser.removeEventListener('appinstalled', onInstalled);
      display.removeEventListener('change', onDisplay);
      listeners.clear();
    },
  };
}
