import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { MAX_BACKUP_BYTES } from '@/features/backup/backupModel';
import { backupFileNameForTimestamp } from '@/features/backup/backupService';
import { logEvent } from '@/utils/logger';

export type ExportFileResult = {
  uri: string;
  shared: boolean;
};

/**
 * Writes a backup into the app cache and opens the share sheet when the
 * platform supports it. The file never leaves the device unless the user picks
 * a destination in the system sheet.
 */
export async function exportBackupFile(
  json: string,
  timestampMs: number,
  dialogTitle: string,
): Promise<ExportFileResult> {
  const file = new File(Paths.cache, backupFileNameForTimestamp(timestampMs));
  file.create({ overwrite: true });
  await file.write(json);

  let shared = false;
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        dialogTitle,
        mimeType: 'application/json',
      });
      shared = true;
    }
  } catch (error) {
    logEvent('warn', 'Backup created but sharing was dismissed or failed', error);
  }

  return { uri: file.uri, shared };
}

export type PickBackupResult =
  | { status: 'canceled' }
  | { status: 'too-large' }
  | { status: 'picked'; text: string; byteSize: number };

/** Opens the system file picker and returns the text of the chosen JSON file. */
export async function pickBackupFile(): Promise<PickBackupResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return { status: 'canceled' };

  const asset = result.assets[0];
  if (!asset) return { status: 'canceled' };
  if (typeof asset.size === 'number' && asset.size > MAX_BACKUP_BYTES) {
    return { status: 'too-large' };
  }

  const file = new File(asset.uri);
  const text = await file.text();
  return { status: 'picked', text, byteSize: asset.size ?? text.length };
}
