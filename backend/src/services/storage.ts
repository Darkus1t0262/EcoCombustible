import { createReadStream, createWriteStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  FILES_BASE_URL,
  S3_ACCESS_KEY,
  S3_BUCKET,
  S3_ENDPOINT,
  S3_FORCE_PATH_STYLE,
  S3_REGION,
  S3_SECRET_KEY,
  STORAGE_DRIVER,
} from '../config/env.js';
import { COMPLAINTS_DIR, REPORTS_DIR } from '../config/storage.js';

type StorageCategory = 'reports' | 'complaints';

const s3Client =
  STORAGE_DRIVER === 's3'
    ? new S3Client({
        region: S3_REGION,
        endpoint: S3_ENDPOINT,
        forcePathStyle: S3_FORCE_PATH_STYLE,
        credentials: {
          accessKeyId: S3_ACCESS_KEY ?? '',
          secretAccessKey: S3_SECRET_KEY ?? '',
        },
      })
    : null;

const trimBaseUrl = (value: string) => value.replace(/\/+$/, '');

const buildLocalUrl = (category: StorageCategory, filename: string) => {
  const base = trimBaseUrl(FILES_BASE_URL);
  return `${base}/files/${category}/${filename}`;
};

const buildRemoteUrl = (key: string) => {
  const base = trimBaseUrl(FILES_BASE_URL);
  return `${base}/${key}`;
};

const buildKey = (category: StorageCategory, filename: string) => `${category}/${filename}`;

const getLocalPath = (category: StorageCategory, filename: string) => {
  const dir = category === 'reports' ? REPORTS_DIR : COMPLAINTS_DIR;
  return path.join(dir, filename);
};

const uploadToS3 = async (localPath: string, key: string, contentType?: string | null) => {
  if (!s3Client) {
    throw new Error('S3 client not configured.');
  }
  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: createReadStream(localPath),
      ContentType: contentType ?? undefined,
    })
  );
};

export const storeStream = async (options: {
  category: StorageCategory;
  filename: string;
  stream: NodeJS.ReadableStream;
  contentType?: string | null;
}) => {
  const localPath = getLocalPath(options.category, options.filename);
  await pipeline(options.stream, createWriteStream(localPath));
  return await storeLocalFile({
    category: options.category,
    filename: options.filename,
    filePath: localPath,
    contentType: options.contentType,
  });
};

export const storeLocalFile = async (options: {
  category: StorageCategory;
  filename: string;
  filePath: string;
  contentType?: string | null;
}) => {
  const key = buildKey(options.category, options.filename);

  if (STORAGE_DRIVER === 's3') {
    await uploadToS3(options.filePath, key, options.contentType);
    await unlink(options.filePath).catch(() => undefined);
    return { fileUrl: buildRemoteUrl(key), key };
  }

  return { fileUrl: buildLocalUrl(options.category, options.filename), key };
};
