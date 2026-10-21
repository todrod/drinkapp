import { tokenFromUrl } from './logic/guestMenu';

export async function initialGuestToken() { return tokenFromUrl(globalThis.location.href); }
export function subscribeGuestToken(onToken: (token: string | null) => void) {
  const handler = () => onToken(tokenFromUrl(globalThis.location.href));
  globalThis.addEventListener('hashchange', handler);
  return () => globalThis.removeEventListener('hashchange', handler);
}
export function defaultShareAddress() { return `${globalThis.location.origin}${globalThis.location.pathname}`; }
export function leaveGuestMenu() { globalThis.history.replaceState(null, '', globalThis.location.pathname + globalThis.location.search); }
