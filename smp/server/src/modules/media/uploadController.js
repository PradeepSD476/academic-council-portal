import { getUploadSignedUrl } from "../../utils/signedUrl.js";

export const generateSignedURL = async (req, res) => {
    try {
        const { filename, contentType, folder } = req.body;

        if (!filename || !contentType || !folder) {
            return res.status(400).json({
                success: false,
                message: 'Missing filename, contentType, or folder.'
            });
        }

        const { signedURL, filePath } = await getUploadSignedUrl({
            fileName: filename,
            contentType,
            folder
        });

        const publicDomain = process.env.PUBLIC_DOMAIN || 'http://localhost';
        const bucketName = process.env.MINIO_BUCKET_NAME || 'smp-media';
        const publicUrl = `${publicDomain}/media/${bucketName}/${filePath}`;

        res.status(200).json({
            success: true,
            signedUrl: signedURL,
            filePath: filePath,
            publicUrl: publicUrl,
        });

    } catch (error) {
        console.error("Presigned URL Error:", error);
        res.status(500).json({
            success: false,
            message: 'Could not generate upload URL.'
        });
    }
}