export const PARTY_GAG_DURATION_MS = 4_000;

const VERDICTS = [
  { title: 'Certified snack captain', detail: 'The chips have elected you their leader. A very respectable promotion.' },
  { title: 'Professional couch commentator', detail: 'Excellent company. Strong opinions about the playlist. Impeccable cushion selection.' },
  { title: 'Playlist philosopher', detail: 'You have a deep personal connection to every song that comes on.' },
  { title: 'Air-guitar alert', detail: 'An imaginary guitar solo may occur at any moment. Please respect the imaginary stage.' },
  { title: 'Confetti in the forecast', detail: 'The dance floor has requested your presence. Your signature move remains a mystery.' },
  { title: 'You’re cut off… from the aux cord.', detail: 'The playlist has filed a formal complaint. Time to let someone else choose a song.' },
] as const;

/** Fictional party nonsense only: never a BAC, impairment, or sobriety estimate. */
export function pickPartyGagResult(random = Math.random()) {
  const sample = Math.min(1, Math.max(0, Number.isFinite(random) ? random : 0));
  const score = Math.min(100, Math.floor(sample * 101));
  const index = score < 20 ? 0 : score < 40 ? 1 : score < 60 ? 2 : score < 80 ? 3 : score < 95 ? 4 : 5;
  return { score, ...VERDICTS[index] };
}

export type PartyGagResult = ReturnType<typeof pickPartyGagResult>;

export function partyGagSecondsLeft(deadline: number, now: number) {
  return Math.min(PARTY_GAG_DURATION_MS / 1_000, Math.max(0, Math.ceil((deadline - now) / 1_000)));
}
