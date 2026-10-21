let error: string | null = null;
let readError = false;
let queued = false;
const listeners = new Set<() => void>();
export const getPersistenceError = () => error;
export const getPersistenceReadError = () => readError;
export function subscribePersistenceError(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function notify() {
  if (queued) return;
  queued = true;
  Promise.resolve().then(() => { queued = false; listeners.forEach((listener) => listener()); });
}
export function reportPersistenceError(kind: 'read' | 'write' = 'write') {
  if (kind === 'read') readError = true;
  error = 'Some changes could not be saved on this device. Keep the app open and export a backup, or retry saving.';
  notify();
}
export function clearPersistenceError() { error = null; readError = false; notify(); }
