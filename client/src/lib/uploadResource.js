const handleFileUpload = async ({ idToken, file, folder, description, title, resourceType, courseCode }) => {
    if (!file || !folder || !title) {
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
        const uploadToDB = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/${folder}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                title: title, 
                description: description, 
                filePath: filePath,
                resourceType: resourceType,
                courseCode: courseCode
            })
        })
        if(!uploadToDB.ok){
            throw new Error('Upload to DB failed');
            return;
        }
    } catch (error) {
        console.log(error);
        return;
    }
}