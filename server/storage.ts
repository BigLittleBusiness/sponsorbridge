// Storage helpers support the existing Manus Forge adapter and a portable
// S3-compatible adapter for self-hosted and third-party deployments.

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;

  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY",
    );
  }

  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

function getS3Config() {
  const { s3Endpoint, s3Region, s3Bucket, s3AccessKeyId, s3SecretAccessKey } = ENV;
  if (!s3Bucket || !s3AccessKeyId || !s3SecretAccessKey) {
    throw new Error(
      "S3 storage config missing: set S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY",
    );
  }

  return { s3Endpoint, s3Region, s3Bucket, s3AccessKeyId, s3SecretAccessKey };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

let portableStorageClient: S3Client | undefined;

function getPortableStorageClient() {
  if (portableStorageClient) return portableStorageClient;
  const config = getS3Config();
  portableStorageClient = new S3Client({
    region: config.s3Region,
    endpoint: config.s3Endpoint || undefined,
    forcePathStyle: ENV.s3ForcePathStyle,
    credentials: {
      accessKeyId: config.s3AccessKeyId,
      secretAccessKey: config.s3SecretAccessKey,
    },
  });
  return portableStorageClient;
}

export function isPortableStorageEnabled() {
  return ENV.storageDriver === "s3";
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));

  if (isPortableStorageEnabled()) {
    const config = getS3Config();
    await getPortableStorageClient().send(
      new PutObjectCommand({
        Bucket: config.s3Bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
        CacheControl: "private, max-age=0, no-store",
      }),
    );
    return { key, url: `/media/${key}` };
  }

  const { forgeUrl, forgeKey } = getForgeConfig();
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);

  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }

  const { url: s3Url } = (await presignResp.json()) as { url: string };
  if (!s3Url) throw new Error("Forge returned empty presign URL");

  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });

  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });

  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: isPortableStorageEnabled() ? `/media/${key}` : `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  if (isPortableStorageEnabled()) {
    const config = getS3Config();
    return getSignedUrl(
      getPortableStorageClient(),
      new GetObjectCommand({ Bucket: config.s3Bucket, Key: key }),
      { expiresIn: 60 * 15 },
    );
  }

  const { forgeUrl, forgeKey } = getForgeConfig();
  const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
  getUrl.searchParams.set("path", key);

  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }

  const { url } = (await resp.json()) as { url: string };
  return url;
}
