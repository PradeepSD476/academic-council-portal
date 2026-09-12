import { storage } from "../config/minio.js";

export const getPublicUrl = async ({ bucketName, filePath }) => {
    if (!filePath) {
        return;
    }
    if (!bucketName) {
        const error = new Error("Missing required fields.");
        error.code = "MISSING_PARAMETERS";
        throw error;
    }
    const url = await storage.presignedGetObject(
        bucketName,
        filePath,
        60 * 60
    );

    const publicUrl = url.replace(/http:\/\/[^/]+/, `${process.env.PUBLIC_DOMAIN || 'http://localhost:800'}/media`);

    return publicUrl;
}

export const getUploadSignedUrl = async ({ fileName, contentType, folder }) => {
    if (!fileName || !contentType || !folder) {
        const error = new Error("Missing required fields.");
        error.code = "MISSING_PARAMETERS";
        throw error;
    }
    const objectName = `${folder}/${Date.now()}-${fileName}`;
    const bucketName = process.env.MINIO_BUCKET_NAME || 'iitp-media';
    const url = await storage.presignedPutObject(
        bucketName,
        objectName,
        5 * 60
    );
    
    // In local environment without Nginx proxy, upload directly to MinIO endpoint
    let signedURL = url;
    if (process.env.NODE_ENV === 'production' && process.env.PUBLIC_DOMAIN) {
      signedURL = url.replace(/http:\/\/[^/]+/, `${process.env.PUBLIC_DOMAIN}/media`);
    }
    
    return { signedURL, filePath: objectName };
}
