import type { UpdateSnapshot } from './types';

export const UPDATE_CHECK_INTERVAL = 60_000;
const APPLY_TIMEOUT = 15_000;

export function createUpdateController(browser: Window) {
  const listeners = new Set<() => void>();
  let snapshot: UpdateSnapshot = { available: false, applying: false, dismissed: false, error: null };
  let registration: ServiceWorkerRegistration | null = null;
  let candidate: ServiceWorker | null = null;
  let candidateVersion = '';
  let disposed = false;
  let checking = false;
  let reloaded = false;
  let applyTimer: number | undefined;
  let interval: number | undefined;
  const watched = new Map<ServiceWorker, () => void>();
  const queried = new Set<ServiceWorker>();
  const container = browser.navigator.serviceWorker;
  const build = browser.document.querySelector('meta[name="shaker-build"]')?.getAttribute('content');
  const supported = browser.isSecureContext && !!container && !!build;
  const update = (patch: Partial<UpdateSnapshot>) => {
    if (disposed) return;
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  };
  const fail = () => {
    browser.clearTimeout(applyTimer);
    update({ applying: false, error: 'The update couldn’t finish. Please try again.' });
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
      return;
    }
    candidate = worker;
    const changed = candidateVersion !== version;
    candidateVersion = version;
    update({ available: true, ...(changed ? { dismissed: false, error: null } : {}) });
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
    };
    watched.set(worker, onState);
    worker.addEventListener('statechange', onState);
    onState();
  };
  const check = async () => {
    if (!registration || disposed || checking || browser.document.visibilityState === 'hidden' || browser.navigator.onLine === false) return;
    checking = true;
    try {
      await registration.update();
      if (!disposed) { watchInstalling(); askVersion(registration.waiting); }
    } catch { /* Offline checks keep the running app and previous cache usable. */ }
    finally { checking = false; }
  };
  const start = async () => {
    if (!supported || disposed) return;
    try {
      const result = await container.register('/sw.js', { updateViaCache: 'none' });
      if (disposed) return;
      registration = result;
      registration.addEventListener('updatefound', watchInstalling);
      watchInstalling();
      askVersion(registration.waiting);
      interval = browser.setInterval(() => { void check(); }, UPDATE_CHECK_INTERVAL);
    } catch { /* Browsers that block service workers can still use the site. */ }
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
