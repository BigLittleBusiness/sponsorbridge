export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  appBaseUrl: process.env.APP_BASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeChildWebhookSecret:
    process.env.STRIPE_CHILD_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripeProjectWebhookSecret:
    process.env.STRIPE_PROJECT_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET ?? "",
  storageDriver:
    process.env.STORAGE_DRIVER ??
    (process.env.BUILT_IN_FORGE_API_URL && process.env.BUILT_IN_FORGE_API_KEY
      ? "forge"
      : "s3"),
  s3Endpoint: process.env.S3_ENDPOINT ?? "",
  s3Region: process.env.S3_REGION ?? "auto",
  s3Bucket: process.env.S3_BUCKET ?? "",
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  legacyManusStorageOrigin: process.env.LEGACY_MANUS_STORAGE_ORIGIN ?? "",
  schedulerSecret: process.env.SCHEDULER_SECRET ?? "",
};
