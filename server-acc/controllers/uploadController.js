import { getUploadSignedUrl } from "../utils/signedUrl.js";

const signedURL = async (req, res) => {
    try {
        const { filename, contentType, folder } = req.body;
        if (!filename) {
            return res.status(400).json({ success: false, message: 'Missing filename.' });
        }
        const resolvedType = contentType || 'application/octet-stream';

        const { signedURL, filePath } = await getUploadSignedUrl({ fileName: filename, contentType: resolvedType, folder: folder || 'uploads' })
        console.log(signedURL, filePath)
        res.status(200).json({
            success: true,
            signedUrl: signedURL,
            filePath: filePath, 
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Could not generate upload URL.' });
    }
}

export default signedURL