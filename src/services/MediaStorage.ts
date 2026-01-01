import * as FileSystem from 'expo-file-system';

const ensureDirAsync = async (dir: string): Promise<void> => {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
};

const inferExtension = (uri: string): string => {
  const cleaned = uri.split('?')[0];
  const parts = cleaned.split('.');
  const ext = parts.length > 1 ? parts[parts.length - 1] : 'jpg';
  return ext.length > 6 ? 'jpg' : ext;
};

export const saveImageAsync = async (sourceUri: string): Promise<string> => {
  if (!FileSystem.documentDirectory) {
    throw new Error('Storage not available.');
  }
  const baseDir = `${FileSystem.documentDirectory}complaints/`;
  await ensureDirAsync(baseDir);
  const ext = inferExtension(sourceUri);
  const dest = `${baseDir}complaint_${Date.now()}.${ext}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
};

export const deleteFileAsync = async (uri: string | null | undefined): Promise<void> => {
  if (!uri) {
    return;
  }
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
};
