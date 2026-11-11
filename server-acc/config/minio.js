import dotenv from "dotenv";
dotenv.config();
import * as Minio from "minio";

const accessKey = process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER;
const secretKey = process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD;
const isConfigured = Boolean(accessKey && secretKey);

const storage = isConfigured
  ? new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT, 10) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey,
      secretKey,
    })
  : new Proxy({}, {
      get(_target, property) {
        if (property === 'then') return undefined;
        return () => Promise.reject(
          new Error('MinIO is unavailable: configure MINIO_ACCESS_KEY and MINIO_SECRET_KEY to enable storage.')
        );
      },
    });

const bucketName = process.env.MINIO_BUCKET_NAME || 'acc-portal';

async function ensureBucket() {
  if (!isConfigured) {
    console.warn("MinIO credentials are not configured; skipping bucket initialization.");
    return;
  }

  try {
    const exists = await storage.bucketExists(bucketName);
    if (exists) {
      console.log(`Bucket "${bucketName}" already exists`);
    } else {
      await storage.makeBucket(bucketName, "us-east-1");
      console.log(`Bucket "${bucketName}" created`);
    }
  } catch (err) {
    console.warn(`MinIO connection warning (skipping bucket check): ${err?.message || err}`);
  }
}

export { storage, bucketName, ensureBucket };