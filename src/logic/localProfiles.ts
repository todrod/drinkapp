import type { LocalProfile, ProfileData, ProfileIndex } from '../types';
import { DEFAULT_PARTY } from './hosting';

export const MAX_PROFILES = 24;
export const DEFAULT_PROFILE: LocalProfile = { id: 'default', name: 'My bar', createdAt: 0 };
export const DEFAULT_PROFILE_INDEX: ProfileIndex = { version: 1, activeId: 'default', profiles: [DEFAULT_PROFILE] };

export function profileIdIsValid(id: unknown): id is string {
  return typeof id === 'string' && (id === 'default' || /^bar-[a-z0-9]{12,40}$/.test(id));
}

export function profileName(name: string): string {
  const cleaned = name.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!cleaned || cleaned.length > 60) throw new Error('Use a bar name from 1 to 60 characters.');
  return cleaned;
}

export function readProfileIndex(value: unknown): ProfileIndex {
  if (value === null || value === undefined) return { ...DEFAULT_PROFILE_INDEX, profiles: [{ ...DEFAULT_PROFILE }] };
  if (typeof value !== 'object') throw new Error('The local bar list could not be read. Your bar files have been kept.');
  const v = value as ProfileIndex;
  if (v.version !== 1 || !Array.isArray(v.profiles) || !v.profiles.length || v.profiles.length > MAX_PROFILES || !profileIdIsValid(v.activeId)) throw new Error('The local bar list is invalid. Your bar files have been kept.');
  const ids = new Set<string>();
  const profiles = v.profiles.map((p) => {
    if (!p || !profileIdIsValid(p.id) || ids.has(p.id) || typeof p.name !== 'string' || !Number.isFinite(p.createdAt) || p.createdAt < 0) throw new Error('The local bar list is invalid. Your bar files have been kept.');
    ids.add(p.id);
    return { id: p.id, name: profileName(p.name), createdAt: p.createdAt };
  });
  if (!ids.has('default') || !ids.has(v.activeId)) throw new Error('The active local bar could not be found. Your bar files have been kept.');
  return { version: 1, activeId: v.activeId, profiles };
}

export function newLocalProfile(name: string, index: ProfileIndex): LocalProfile {
  if (index.profiles.length >= MAX_PROFILES) throw new Error(`You can keep up to ${MAX_PROFILES} local bars on this device.`);
  const base = profileName(name);
  let unique = base; let suffix = 2;
  const names = new Set(index.profiles.map((p) => p.name.toLowerCase()));
  while (names.has(unique.toLowerCase())) { const ending = ` (${suffix++})`; unique = base.slice(0, 60 - ending.length) + ending; }
  let id: string;
  do { id = 'bar-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12).padEnd(10, '0'); } while (index.profiles.some((p) => p.id === id));
  return { id, name: unique, createdAt: Date.now() };
}

export function emptyProfileData(ageGateAcceptedAt: number | null): ProfileData {
  return { kit: [], recipes: [], shopping: [], prefs: { ageGateAcceptedAt, zeroProofMode: false, allowSubstitutes: true, shakeToShake: true }, party: { ...DEFAULT_PARTY, entries: [] } };
}

export function renameLocalProfile(index: ProfileIndex, id: string, name: string): ProfileIndex {
  const cleaned = profileName(name);
  if (!index.profiles.some((p) => p.id === id)) throw new Error('That local bar could not be found.');
  if (index.profiles.some((p) => p.id !== id && p.name.toLowerCase() === cleaned.toLowerCase())) throw new Error('Another local bar already has that name.');
  return { ...index, profiles: index.profiles.map((p) => p.id === id ? { ...p, name: cleaned } : p) };
}
