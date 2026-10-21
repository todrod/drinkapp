import { Linking } from 'react-native';
import { tokenFromUrl } from './logic/guestMenu';

export async function initialGuestToken() { const url = await Linking.getInitialURL(); return url ? tokenFromUrl(url) : null; }
export function subscribeGuestToken(onToken: (token: string | null) => void) {
  const sub = Linking.addEventListener('url', ({ url }) => onToken(tokenFromUrl(url)));
  return () => sub.remove();
}
export function defaultShareAddress() { return 'https://drinkapp-rust.vercel.app/'; }
export function leaveGuestMenu() { /* A native link is not part of browser history. */ }
