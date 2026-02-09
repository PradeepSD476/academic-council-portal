import { getUploadSignedUrl } from "../utils/signedUrl.js";

const signedURL = async (req, res) => {
    try {
        const { filename, contentType, folder } = req.body;
        console.log(req.body)
        if (!filename || !contentType) {
            return res.status(400).json({ success: false, message: 'Missing filename or contentType.' });
        }

        const { signedURL, filePath } = await getUploadSignedUrl({ fileName: filename, contentType: contentType, folder: folder })
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