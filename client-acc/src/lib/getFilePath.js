import toast from "react-hot-toast";
export const getFilePath = async ({ file, folder }) => {
    if (!folder || !file ) {
        console.error("Missing required parameters to fetch signed URL");
        return;
    }
    try {
        const resolvedContentType = file.type || 'application/octet-stream';
        const response = await fetch(`${import.meta.env.VITE_API_URL}/v1/upload/get-upload-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filename: file.name,
                contentType: resolvedContentType,
                folder: folder || 'uploads'
            }),
            credentials: 'include'
        })
        if(!response.ok){
            console.error(response.error);
            return;
        }
        const data = await response.json();
        const { signedUrl, filePath } = data;
        const minioResponse = await fetch(signedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': resolvedContentType,
            },
            body: file
        })
        if(!minioResponse.ok){
            toast.error("Failed to upload.")
            throw new Error('Upload To MINIO Failed');
        }
        return { filePath };
    } catch (error) {
        console.log(error);
        return;
    }
}