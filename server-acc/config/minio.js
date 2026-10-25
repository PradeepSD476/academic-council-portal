import dotenv from "dotenv";
dotenv.config();
import * as Minio from "minio";

const accessKey = process.env.MINIO_ACCESS_KEY;
const secretKey = process.env.MINIO_SECRET_KEY;

if (!accessKey || !secretKey) {
  throw new Error("MINIO_ACCESS_KEY and MINIO_SECRET_KEY must be configured");
}

const storage = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT, 10) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey,
  secretKey,
});

const bucketName = process.env.MINIO_BUCKET_NAME || 'acc-portal';

async function ensureBucket() {
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