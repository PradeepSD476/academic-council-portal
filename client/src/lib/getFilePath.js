export const getFilePath = async ({ idToken, file, folder }) => {
    if (!folder || !file || !idToken) {
        console.error("Missing required parameters to fetch signed URL");
        return;
    }
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/upload/get-upload-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type,
                folder: folder || 'uploads'
            }),
            credentials: 'include'
        })
        if(!response.ok){
            console.error(response.error);
            return;
        }
        const data = await response.json();
        console.log(data);
        const { signedUrl, filePath } = data;
        const gcsResponse = await fetch(signedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type,
            },
            body: file
        })
        if(!gcsResponse.ok){
            throw new Error('Upload To Cloud Failed');
        }
        return { filePath };
    } catch (error) {
        console.log(error);
        return;
    }
}