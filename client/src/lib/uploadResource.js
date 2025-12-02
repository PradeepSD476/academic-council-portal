const uploadedResource = async ({ idToken, filename, contentType, folder }) => {
    if(!idToken || !filename || !contentType || !folder) {
        console.error("Missing required parameters to fetch signed URL");
        return;
    }
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload/get-upload-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                filename: filename,
                contentType: contentType,
                folder: folder || 'uploads'
            }),
            credentials: 'include'
        })
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (data.signedURL) {
            console.log("Signed URL fetched successfully");
            console.log(data);
            return data;
        } else {
            throw new Error('Signed URL not found in response');
        }
    }
    catch (error) {
        console.error("Error fetching signed URL:", error);
    }
}

export default uploadedResource;