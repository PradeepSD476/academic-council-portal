import { bucket } from "../config/gcsClient.js";
import { v4 as uuidv4 } from 'uuid';

const signedURL = async (req, res) => {
    try {
        const { filename, contentType, folder } = req.body;
        if (!filename || !contentType) {
            return res.status(400).json({ success: false, message: 'Missing filename or contentType.' });
        }

        const uniqueSuffix = uuidv4();
        const destination = `${folder}/${uniqueSuffix}_${filename}`; 

        const options = {
            version: 'v4', 
            action: 'write', 
            expires: Date.now() + 15 * 60 * 1000, 
            contentType: contentType, 
        };

        const [signedUrl] = await bucket.file(destination).getSignedUrl(options);

        res.status(200).json({
            success: true,
            signedUrl: signedUrl,
            filePath: destination, 
        });

    } catch (error) {
        console.error('Error generating signed URL:', error);
        res.status(500).json({ success: false, message: 'Could not generate upload URL.' });
    }
}

export default signedURL