import type { UpdateSnapshot } from './types';

export const UPDATE_CHECK_INTERVAL = 60_000;
const APPLY_TIMEOUT = 15_000;
const CHECK_TIMEOUT = 30_000;

export function createUpdateController(browser: Window) {
  const listeners = new Set<() => void>();
  let registration: ServiceWorkerRegistration | null = null;
  let candidate: ServiceWorker | null = null;
  let candidateVersion = '';
  let disposed = false;
  let checkPromise: Promise<boolean> | null = null;
  let startPromise: Promise<void> | null = null;
  let manualTarget: ServiceWorker | null = null;
  let checkTimer: number | undefined;
  let reloaded = false;
  let applyTimer: number | undefined;
  let interval: number | undefined;
  const watched = new Map<ServiceWorker, () => void>();
  const queried = new Set<ServiceWorker>();
  const container = browser.navigator.serviceWorker;
  const build = browser.document.querySelector('meta[name="shaker-build"]')?.getAttribute('content');
  const supported = browser.isSecureContext && !!container && !!build;
  const isOffline = () => browser.navigator.onLine === false;
  let snapshot: UpdateSnapshot = { supported, checking: false, checkResult: 'idle', available: false, applying: false, dismissed: false, error: null };
  const update = (patch: Partial<UpdateSnapshot>) => {
    if (disposed) return;
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  };
  const fail = () => {
    browser.clearTimeout(applyTimer);
    update({ applying: false, error: 'The update couldn’t finish. Please try again.' });
  };
  const finishCheck = (checkResult: UpdateSnapshot['checkResult']) => {
    browser.clearTimeout(checkTimer);
    manualTarget = null;
    update({ checking: false, checkResult });
  };
  const reload = () => {
    if (reloaded || disposed) return;
    reloaded = true;
    browser.clearTimeout(applyTimer);
    // Preserve the URL (including a guest menu fragment) and all local bar data.
    browser.location.reload();
  };
  const askVersion = (worker: ServiceWorker | null) => {
    if (!worker || disposed) return;
    queried.add(worker);
    try { worker.postMessage({ type: 'SHAKER_GET_VERSION' }); } catch { /* A superseded worker can disappear between events. */ }
  };
  const onMessage = (event: MessageEvent) => {
    const worker = event.source as ServiceWorker | null;
    const version = event.data?.version;
    if (!worker || !queried.has(worker) || event.data?.type !== 'SHAKER_VERSION' || typeof version !== 'string' || !/^shaker-v4-[a-f0-9]{12}$/.test(version)) return;
    if (worker !== registration?.waiting && worker !== container.controller) return;
    if (version === build) {
      // A fresh navigation may already have the new HTML while its worker waits.
      // Finish that installation silently instead of offering a redundant reload.
      if (worker === registration?.waiting) worker.postMessage({ type: 'SHAKER_ACTIVATE_UPDATE' });
      if (worker === manualTarget) finishCheck('current');
      return;
    }
    candidate = worker;
    const changed = candidateVersion !== version;
    candidateVersion = version;
    update({ available: true, ...(changed ? { dismissed: false, error: null } : {}) });
    if (worker === manualTarget) finishCheck('idle');
    if (snapshot.applying && worker === container.controller) reload();
  };
  const onControllerChange = () => {
    if (snapshot.applying && container.controller === candidate) reload();
    else askVersion(container.controller);
  };
  const watchInstalling = () => {
    const worker = registration?.installing;
    if (!worker || watched.has(worker)) return;
    const onState = () => {
      if (worker.state === 'installed') askVersion(worker);
      if (worker.state === 'activated') onControllerChange();
      if (worker.state === 'redundant' && snapshot.applying && candidate === worker) fail();
      if (worker.state === 'redundant' && manualTarget === worker) finishCheck('error');
    };
    watched.set(worker, onState);
    worker.addEventListener('statechange', onState);
    onState();
  };
  const check = (): Promise<boolean> => {
    if (!registration || disposed || browser.document.visibilityState === 'hidden' || isOffline()) return Promise.resolve(false);
    if (checkPromise) return checkPromise;
    const currentRegistration = registration;
    checkPromise = Promise.resolve().then(async () => {
      try {
        if (disposed) return false;
        await currentRegistration.update();
        if (disposed) return false;
        watchInstalling(); askVersion(currentRegistration.waiting);
        return true;
      } catch { return false; /* Offline background checks stay silent. */ }
      finally { checkPromise = null; }
    });
    return checkPromise;
  };
  const start = (): Promise<void> => {
    if (!supported || disposed || registration) return Promise.resolve();
    if (startPromise) return startPromise;
    startPromise = Promise.resolve().then(async () => {
      try {
        if (disposed) return;
        const result = await container.register('/sw.js', { updateViaCache: 'none' });
        if (disposed) return;
        registration = result;
        registration.addEventListener('updatefound', watchInstalling);
        watchInstalling();
        askVersion(registration.waiting);
        interval = browser.setInterval(() => { void check(); }, UPDATE_CHECK_INTERVAL);
      } catch { /* Browsers that block service workers can still use the site. */ }
      finally { startPromise = null; }
    });
    return startPromise;
  };
  const onResume = () => { void check(); };
  if (supported) {
    container.addEventListener('message', onMessage);
    container.addEventListener('controllerchange', onControllerChange);
    browser.addEventListener('focus', onResume);
    browser.addEventListener('online', onResume);
    browser.document.addEventListener('visibilitychange', onResume);
    if (browser.document.readyState === 'complete') void start();
    else browser.addEventListener('load', start, { once: true });
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async check() {
      if (!supported || disposed || snapshot.checking || snapshot.applying) return;
      update({ checking: true, checkResult: 'idle' });
      checkTimer = browser.setTimeout(() => finishCheck('error'), CHECK_TIMEOUT);
      if (isOffline()) { finishCheck('offline'); return; }
      await start();
      if (disposed || !snapshot.checking) return;
      if (!await check()) { if (!disposed && snapshot.checking) finishCheck(isOffline() ? 'offline' : 'error'); return; }
      if (disposed || !snapshot.checking) return;
      const worker = registration?.installing ?? registration?.waiting;
      if (worker && worker.state !== 'redundant') {
        // update() can resolve before installation finishes. Do not claim the app
        // is current until the download and version handshake have completed.
        manualTarget = worker;
        watchInstalling();
        if (worker.state === 'installed' || worker.state === 'activating' || worker.state === 'activated') askVersion(worker);
      } else finishCheck(snapshot.available ? 'idle' : 'current');
    },
    dismiss() { if (!snapshot.applying) update({ dismissed: true }); },
    apply() {
      if (!snapshot.available || snapshot.applying || !candidate || disposed) return;
      update({ applying: true, error: null });
      if (container.controller === candidate) { reload(); return; }
      if (candidate !== registration?.waiting) { fail(); void check(); return; }
      applyTimer = browser.setTimeout(fail, APPLY_TIMEOUT);
      try { candidate.postMessage({ type: 'SHAKER_ACTIVATE_UPDATE' }); } catch { fail(); }
    },
    dispose() {
      disposed = true;
      browser.clearTimeout(applyTimer);
      browser.clearTimeout(checkTimer);
      browser.clearInterval(interval);
      browser.removeEventListener('load', start);
      browser.removeEventListener('focus', onResume);
      browser.removeEventListener('online', onResume);
      browser.document.removeEventListener('visibilitychange', onResume);
      container?.removeEventListener('message', onMessage);
      container?.removeEventListener('controllerchange', onControllerChange);
      registration?.removeEventListener('updatefound', watchInstalling);
      watched.forEach((listener, worker) => worker.removeEventListener('statechange', listener));
      listeners.clear();
    },
  };
}
