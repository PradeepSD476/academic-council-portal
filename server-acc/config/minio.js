import dotenv from "dotenv";
dotenv.config();
import * as Minio from "minio";

function createDisabledStorage(error) {
  const unavailable = async () => {
    throw error;
  };

  return {
    bucketExists: unavailable,
    makeBucket: unavailable,
    presignedGetObject: unavailable,
    presignedPutObject: unavailable,
  };
}

let storage;
try {
  storage = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: process.env.MINIO_PORT,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  });
} catch (error) {
  console.warn(`MinIO client disabled: ${error.message}`);
  storage = createDisabledStorage(error);
}

console.log("\x1b[34m%s\x1b[0m", "CheckPoint0/minio.js")

const bucketName = process.env.MINIO_BUCKET_NAME;
if (!bucketName) {
  console.warn("MINIO_BUCKET_NAME is undefined; skipping bucket setup");
}

async function ensureBucket() {
  console.log("\x1b[34m%s\x1b[0m", "CheckPoint1/minio.js")
  if (!bucketName) {
    return false;
  }

  try {
    const exists = await storage.bucketExists(bucketName);
    console.log("\x1b[34m%s\x1b[0m", "CheckPoint2/minio.js")
    if (exists) {
      console.log(`Bucket \"${bucketName}\" already exists`);
    } else {
      await storage.makeBucket(bucketName, "us-east-1");
      console.log(`Bucket \"${bucketName}\" created`);
    }
    return true;
  } catch (error) {
    console.warn(`MinIO is unavailable; skipping bucket setup: ${error.message}`);
    return false;
  }
}

export { storage, bucketName, ensureBucket };