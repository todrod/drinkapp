import { MAX_INVENTORY_FILE_BYTES } from './logic/inventoryImport';

export function pickInventoryFile(): Promise<{ name: string; text: string } | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.csv,.tsv,.txt,.json,text/plain,text/csv,application/json'; input.style.display = 'none';
    input.setAttribute('aria-label', 'Choose inventory list file');
    input.oncancel = () => { input.remove(); resolve(null); };
    input.onchange = async () => {
      try {
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }
        if (file.size > MAX_INVENTORY_FILE_BYTES) throw new Error('Choose an inventory list smaller than 1 MB.');
        if (!/\.(csv|tsv|txt|json)$/i.test(file.name)) throw new Error('Choose a CSV, TSV, TXT or JSON file. Export spreadsheets as CSV first.');
        resolve({ name: file.name, text: await file.text() });
      } catch (error) { reject(error); } finally { input.remove(); }
    };
    document.body.appendChild(input); input.click();
  });
}
