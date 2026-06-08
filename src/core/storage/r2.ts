import { AwsClient } from 'aws4fetch';

import type {
  StorageConfigs,
  StorageCreatePresignedUrlOptions,
  StorageCreatePresignedUrlResult,
  StorageDownloadUploadOptions,
  StorageProvider,
  StorageUploadOptions,
  StorageUploadResult,
} from '.';

import {
  DEFAULT_PRESIGNED_URL_EXPIRES_IN_SECONDS,
  MAX_PRESIGNED_URL_EXPIRES_IN_SECONDS,
} from './presigned-url';

/**
 * R2 storage provider configs
 * @docs https://developers.cloudflare.com/r2/
 */
export interface R2Configs extends StorageConfigs {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  uploadPath?: string;
  region?: string;
  endpoint?: string;
  publicDomain?: string;
}

/**
 * R2 storage provider implementation
 * @website https://www.cloudflare.com/products/r2/
 */
export class R2Provider implements StorageProvider {
  readonly name = 'r2';
  configs: R2Configs;

  constructor(configs: R2Configs) {
    this.configs = configs;
  }

  private sanitizePathSegment(value?: string) {
    if (!value) {
      return '';
    }

    const trimmed = value.trim().replace(/^\/+|\/+$/g, '');
    if (trimmed.includes('..')) {
      throw new Error('Invalid object path');
    }

    return trimmed;
  }

  private getUploadPath() {
    let uploadPath = this.configs.uploadPath || 'uploads';
    if (uploadPath.startsWith('/')) {
      uploadPath = uploadPath.slice(1);
    }
    if (uploadPath.endsWith('/')) {
      uploadPath = uploadPath.slice(0, -1);
    }
    return uploadPath;
  }

  private getEndpoint() {
    if (this.configs.endpoint) {
      return this.configs.endpoint;
    }
    if (this.configs.accountId) {
      return `https://${this.configs.accountId}.r2.cloudflarestorage.com`;
    }

    throw new Error('R2 endpoint or account ID is not configured');
  }

  private buildObjectKey({
                           key,
                           prefix,
                           filename,
                         }: {
    key?: string;
    prefix?: string;
    filename?: string;
  }) {
    const normalizedPrefix = this.sanitizePathSegment(prefix);

    const joinPrefix = (value: string) =>
        normalizedPrefix ? `${normalizedPrefix}/${value}` : value;

    if (key) {
      return joinPrefix(this.sanitizePathSegment(key));
    }

    const extension = filename?.split('.').pop();
    const uniqueName = `${crypto.randomUUID()}${extension ? `.${extension}` : ''}`;

    return joinPrefix(uniqueName);
  }

  getPublicUrl = (options: { key: string; bucket?: string }) => {
    const uploadBucket = options.bucket || this.configs.bucket;
    const uploadPath = this.getUploadPath();
    const url = `${this.getEndpoint()}/${uploadBucket}/${uploadPath}/${options.key}`;
    return this.configs.publicDomain
      ? `${this.configs.publicDomain}/${uploadPath}/${options.key}`
      : url;
  };
  async createPresignedUrl(
      options: StorageCreatePresignedUrlOptions
  ): Promise<StorageCreatePresignedUrlResult> {
    const uploadBucket = this.configs.bucket;
    if (!uploadBucket) {
      throw new Error('R2 bucket name is not configured');
    }

    if (!this.configs.accessKeyId || !this.configs.secretAccessKey) {
      throw new Error('R2 credentials are not configured');
    }

    const expiresIn =
        options.expiresIn ?? DEFAULT_PRESIGNED_URL_EXPIRES_IN_SECONDS;

    if (expiresIn < 1 || expiresIn > MAX_PRESIGNED_URL_EXPIRES_IN_SECONDS) {
      throw new Error('Invalid expiresIn value');
    }

    const operation = options.operation || 'put';
    const objectKey = this.buildObjectKey({
      key: options.key,
      prefix: options.prefix,
      filename: options.filename,
    });
    const uploadPath = this.getUploadPath();
    const endpoint = this.getEndpoint();
    const uploadUrl = `${endpoint}/${uploadBucket}/${uploadPath}/${objectKey}`;
    const method =
        operation.toUpperCase() as StorageCreatePresignedUrlResult['method'];
    const presignUrl = new URL(uploadUrl);

    presignUrl.searchParams.set('X-Amz-Expires', expiresIn.toString());

    const headers = new Headers();
    if (operation === 'put' && options.contentType) {
      headers.set('Content-Type', options.contentType);
    }

    const client = new AwsClient({
      accessKeyId: this.configs.accessKeyId,
      secretAccessKey: this.configs.secretAccessKey,
      service: 's3',
      region: this.configs.region || 'auto',
    });

    const signedRequest = await client.sign(
        new Request(presignUrl.toString(), {
          method,
          headers,
        }),
        {
          aws: { signQuery: true },
        }
    );

    return {
      url: signedRequest.url,
      key: objectKey,
      method,
      headers:
          operation === 'put' && options.contentType
              ? { 'Content-Type': options.contentType }
              : undefined,
      expiresIn,
      objectUrl: this.getPublicUrl({
        key: objectKey,
        bucket: uploadBucket,
      }),
    };
  }

  exists = async (options: { key: string; bucket?: string }) => {
    try {
      const uploadBucket = options.bucket || this.configs.bucket;
      if (!uploadBucket) return false;
      const uploadPath = this.getUploadPath();
      const url = `${this.getEndpoint()}/${uploadBucket}/${uploadPath}/${options.key}`;

      const { AwsClient } = await import('aws4fetch');
      const client = new AwsClient({
        accessKeyId: this.configs.accessKeyId,
        secretAccessKey: this.configs.secretAccessKey,
        region: this.configs.region || 'auto',
      });

      const response = await client.fetch(
        new Request(url, {
          method: 'HEAD',
        })
      );

      return response.ok;
    } catch {
      return false;
    }
  };

  async uploadFile(
    options: StorageUploadOptions
  ): Promise<StorageUploadResult> {
    try {
      const uploadBucket = options.bucket || this.configs.bucket;
      if (!uploadBucket) {
        return {
          success: false,
          error: 'Bucket is required',
          provider: this.name,
        };
      }

      const bodyArray =
        options.body instanceof Buffer
          ? new Uint8Array(options.body)
          : options.body;

      const uploadPath = this.getUploadPath();

      // R2 endpoint format: https://<accountId>.r2.cloudflarestorage.com
      // Use custom endpoint if provided, otherwise use default
      const url = `${this.getEndpoint()}/${uploadBucket}/${uploadPath}/${options.key}`;

      const { AwsClient } = await import('aws4fetch');

      // R2 uses "auto" as region for S3 API compatibility
      const client = new AwsClient({
        accessKeyId: this.configs.accessKeyId,
        secretAccessKey: this.configs.secretAccessKey,
        region: this.configs.region || 'auto',
      });

      const headers: Record<string, string> = {
        'Content-Type': options.contentType || 'application/octet-stream',
        'Content-Disposition': options.disposition || 'inline',
        'Content-Length': bodyArray.length.toString(),
      };

      const request = new Request(url, {
        method: 'PUT',
        headers,
        body: bodyArray as any,
      });

      const response = await client.fetch(request);

      if (!response.ok) {
        return {
          success: false,
          error: `Upload failed: ${response.statusText}`,
          provider: this.name,
        };
      }

      const publicUrl =
        this.getPublicUrl({ key: options.key, bucket: uploadBucket }) || url;

      return {
        success: true,
        location: url,
        bucket: uploadBucket,
        uploadPath: uploadPath,
        key: options.key,
        filename: options.key.split('/').pop(),
        url: publicUrl,
        provider: this.name,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
      };
    }
  }

  async downloadAndUpload(
    options: StorageDownloadUploadOptions
  ): Promise<StorageUploadResult> {
    try {
      const response = await fetch(options.url);
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error! status: ${response.status}`,
          provider: this.name,
        };
      }

      if (!response.body) {
        return {
          success: false,
          error: 'No body in response',
          provider: this.name,
        };
      }

      const arrayBuffer = await response.arrayBuffer();
      const body = new Uint8Array(arrayBuffer);

      return this.uploadFile({
        body,
        key: options.key,
        bucket: options.bucket,
        contentType: options.contentType,
        disposition: options.disposition,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
      };
    }
  }
}

/**
 * Create R2 provider with configs
 */
export function createR2Provider(configs: R2Configs): R2Provider {
  return new R2Provider(configs);
}
