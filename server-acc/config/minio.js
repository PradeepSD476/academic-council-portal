import dotenv from "dotenv";
dotenv.config();
import * as Minio from "minio";


const storage = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: process.env.MINIO_PORT,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

console.log("\x1b[34m%s\x1b[0m", "CheckPoint0/minio.js")

const bucketName = process.env.MINIO_BUCKET_NAME;
if (!bucketName) {
  throw new Error("MINIO_BUCKET_NAME is undefined");
}

async function ensureBucket() {
  console.log("\x1b[34m%s\x1b[0m", "CheckPoint1/minio.js")
  const exists = await storage.bucketExists(bucketName);
  console.log("\x1b[34m%s\x1b[0m", "CheckPoint2/minio.js")
  if (exists) {
    console.log(`Bucket "${bucketName}" already exists`);
  } else {
    await storage.makeBucket(bucketName, "us-east-1");
    console.log(`Bucket "${bucketName}" created`);
  }
}

export { storage, bucketName, ensureBucket };