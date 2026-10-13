import dotenv from "dotenv";
dotenv.config();
import * as Minio from "minio";

const storage = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
  port: parseInt(process.env.MINIO_PORT, 10) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
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
    console.warn(`MinIO connection warning (skipping bucket check): ${err.message}`);
  }
}

export { storage, bucketName, ensureBucket };