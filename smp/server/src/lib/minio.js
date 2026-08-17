import dotenv from "dotenv";
dotenv.config();
import * as Minio from "minio";

const storage = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
});

const bucketName = process.env.MINIO_BUCKET_NAME;
if (!bucketName) {
    throw new Error("MINIO_BUCKET_NAME is undefined");
}

async function ensureBucket() {
    try {
        const exists = await storage.bucketExists(bucketName);
        if (exists) {
            console.log(`MinIO: Bucket "${bucketName}" already exists`);
        } else {
            await storage.makeBucket(bucketName, "us-east-1");
            console.log(`MinIO: Bucket "${bucketName}" created`);
        }

        // Set bucket policy to allow public read access
        const policy = {
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Action: ["s3:GetObject"],
                    Resource: [`arn:aws:s3:::${bucketName}/*`],
                },
            ],
        };
        await storage.setBucketPolicy(bucketName, JSON.stringify(policy));
        console.log(`MinIO: Public read policy applied to bucket "${bucketName}"`);
    } catch (error) {
        console.error("MinIO Connection Error (Is the container running?):", error.message);
    }
}

export { storage, bucketName, ensureBucket };