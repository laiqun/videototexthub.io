export type StoragePresignedUrlOperation = 'get' | 'put' | 'head' | 'delete';

export const MAX_PRESIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;
export const DEFAULT_PRESIGNED_URL_EXPIRES_IN_SECONDS = 15 * 60;

export interface StorageCreatePresignedUrlOptions {
  operation?: StoragePresignedUrlOperation;
  key?: string;
  prefix?: string;
  filename?: string;
  contentType?: string;
  expiresIn?: number;
}

export interface StorageCreatePresignedUrlResult {
  url: string;
  key: string;
  method: Uppercase<StoragePresignedUrlOperation>;
  headers?: Record<string, string>;
  expiresIn: number;
  objectUrl: string;
}
