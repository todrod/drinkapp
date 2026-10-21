import { backupFilename, MAX_BACKUP_BYTES, parseBackup } from './logic/backup';

export const LOCAL_STORAGE_KIND = 'browser' as 'phone' | 'browser';
export async function saveBackupFile(text: string, name: string, _profileId: string): Promise<{ message: string; uri?: string }> {
  parseBackup(text);
  const uri = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = uri; anchor.download = backupFilename(name);
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(uri), 30000);
  return { message: 'Backup download started. Keep the JSON file in Downloads or your files.' };
}
export async function shareBackupFile(_uri: string) { /* Browser backups already use a file download. */ }
export function pickBackupFile(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json,.json'; input.style.display = 'none';
    input.setAttribute('aria-label', 'Choose a local bar backup file');
    const clean = () => input.remove();
    input.oncancel = () => { clean(); resolve(null); };
    input.onchange = async () => {
      try {
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }
        if (file.size > MAX_BACKUP_BYTES) throw new Error('Choose a Drink Shaker backup smaller than 4 MB.');
        resolve(await file.text());
      } catch (error) { reject(error); } finally { clean(); }
    };
    document.body.appendChild(input); input.click();
  });
}
export async function persistentStorageState(): Promise<boolean | null> {
  try { return typeof navigator.storage?.persisted === 'function' ? await navigator.storage.persisted() : null; } catch { return null; }
}
export async function requestPersistentStorage(): Promise<boolean | null> {
  try { return typeof navigator.storage?.persist === 'function' ? await navigator.storage.persist() : null; } catch { return null; }
}
