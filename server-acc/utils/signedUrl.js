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

    const publicUrl = url.replace('http://minio-acc:9000', `${process.env.PUBLIC_DOMAIN}/media`);

    return publicUrl;
}

export const getUploadSignedUrl = async ({ fileName, contentType, folder }) => {
    if (!fileName || !contentType || !folder) {
        const error = new Error("Missing required fields.");
        error.code = "MISSING_PARAMETERS";
        throw error;
    }
    const objectName = `${folder}/${Date.now()}-${fileName}`;
    const bucketName = process.env.MINIO_BUCKET_NAME;
    const url = await storage.presignedPutObject(
        bucketName,
        objectName,
        5 * 60
    );
    
    const signedURL = url.replace('http://minio-acc:9000', `${process.env.PUBLIC_DOMAIN}/media`);
    
    return { signedURL, filePath: objectName };
}
