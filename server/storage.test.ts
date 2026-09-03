import { afterEach, describe, expect, it, vi } from "vitest";

const storageEnvironmentKeys = [
  "STORAGE_DRIVER",
  "S3_ENDPOINT",
  "S3_REGION",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_FORCE_PATH_STYLE",
  "BUILT_IN_FORGE_API_URL",
  "BUILT_IN_FORGE_API_KEY",
] as const;

const originalEnvironment = Object.fromEntries(
  storageEnvironmentKeys.map(key => [key, process.env[key]]),
);

afterEach(() => {
  for (const key of storageEnvironmentKeys) {
    const originalValue = originalEnvironment[key];
    if (originalValue === undefined) delete process.env[key];
    else process.env[key] = originalValue;
  }
  vi.resetModules();
});

describe("portable storage URLs", () => {
  it("uses the portable media proxy when S3-compatible storage is selected", async () => {
    process.env.STORAGE_DRIVER = "s3";
    const { isPortableStorageEnabled, storageGet } = await import("./storage");

    expect(isPortableStorageEnabled()).toBe(true);
    await expect(storageGet("/project-updates/photo.jpg")).resolves.toEqual({
      key: "project-updates/photo.jpg",
      url: "/media/project-updates/photo.jpg",
    });
  });

  it("preserves legacy Manus URLs while the media migration is in progress", async () => {
    process.env.STORAGE_DRIVER = "forge";
    const { isPortableStorageEnabled, storageGet } = await import("./storage");

    expect(isPortableStorageEnabled()).toBe(false);
    await expect(storageGet("/child-updates/photo.jpg")).resolves.toEqual({
      key: "child-updates/photo.jpg",
      url: "/manus-storage/child-updates/photo.jpg",
    });
  });
});
