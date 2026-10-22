import { File } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { MAX_INVENTORY_FILE_BYTES } from './logic/inventoryImport';

export async function pickInventoryFile(): Promise<{ name: string; text: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
  if (result.canceled) return null;
  const asset = result.assets[0]; const file = new File(asset.uri);
  if (!/\.(csv|tsv|txt|json)$/i.test(asset.name)) throw new Error('Choose a CSV, TSV, TXT or JSON file. Export spreadsheets as CSV first.');
  if ((asset.size ?? file.size ?? MAX_INVENTORY_FILE_BYTES + 1) > MAX_INVENTORY_FILE_BYTES) throw new Error('Choose an inventory list smaller than 1 MB.');
  return { name: asset.name, text: await file.text() };
}
