import { storage } from "../lib/minio.js";

export const getPublicUrl = async ({ bucketName = process.env.MINIO_BUCKET_NAME, filePath }) => {
    if (!filePath) return null;

    // 1 hour expiration
    const url = await storage.presignedGetObject(bucketName, filePath, 60 * 60);

    // Swap internal Docker DNS with your public Nginx domain
    const publicDomain = process.env.PUBLIC_DOMAIN || 'http://localhost';
    const minioHost = `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || 9000}`;
    return url.replace(minioHost, `${publicDomain}/media`).replace('http://minio-acc:9000', `${publicDomain}/media`);
}

export const getUploadSignedUrl = async ({ fileName, contentType, folder }) => {
    if (!fileName || !contentType || !folder) {
        throw new Error("Missing required fields: fileName, contentType, or folder.");
    }

    const bucketName = process.env.MINIO_BUCKET_NAME;

    // Sanitize filename: Replace spaces with dashes and remove weird characters
    const safeFileName = fileName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');
    const objectName = `${folder}/${Date.now()}-${safeFileName}`;

    // 5 minute expiration for upload
    const url = await storage.presignedPutObject(bucketName, objectName, 5 * 60);

    const publicDomain = process.env.PUBLIC_DOMAIN || 'http://localhost';
    const minioHost = `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || 9000}`;
    const signedURL = url.replace(minioHost, `${publicDomain}/media`).replace('http://minio-acc:9000', `${publicDomain}/media`);

    return { signedURL, filePath: objectName };
}