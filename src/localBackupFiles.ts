import { Directory, File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { backupFilename, MAX_BACKUP_BYTES, parseBackup } from './logic/backup';
import { profileIdIsValid } from './logic/localProfiles';

export const LOCAL_STORAGE_KIND = 'phone' as 'phone' | 'browser';
export async function saveBackupFile(text: string, name: string, profileId: string): Promise<{ message: string; uri?: string }> {
  parseBackup(text);
  if (!profileIdIsValid(profileId)) throw new Error('Invalid local bar identifier.');
  const folder = new Directory(Paths.document, 'BarBackups', profileId);
  folder.create({ intermediates: true, idempotent: true });
  const file = new File(folder, backupFilename(name));
  file.create(); file.write(text);
  if (await file.text() !== text) throw new Error('The backup could not be verified. Please try saving again.');
  return { uri: file.uri, message: 'Backup saved inside Drink Shaker on this phone. Save a copy to Files to keep it outside the app.' };
}
export async function shareBackupFile(uri: string) {
  if (!await Sharing.isAvailableAsync()) throw new Error('The file sharing sheet is unavailable. Your backup is still saved inside the app.');
  await Sharing.shareAsync(uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Save your local bar backup' });
}
export async function pickBackupFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain'], copyToCacheDirectory: true, multiple: false });
  if (result.canceled) return null;
  const asset = result.assets[0]; const file = new File(asset.uri);
  if ((asset.size ?? file.size ?? MAX_BACKUP_BYTES + 1) > MAX_BACKUP_BYTES) throw new Error('Choose a Drink Shaker backup smaller than 4 MB.');
  return file.text();
}
export async function persistentStorageState(): Promise<boolean | null> { return true; }
export async function requestPersistentStorage(): Promise<boolean | null> { return true; }
