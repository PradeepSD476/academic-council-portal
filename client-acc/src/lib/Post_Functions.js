import mockData from "../pages/admin/mock-post.json";

/**
 *
 * formData = {
 *  title: string,
 *  content: string,
 *  experienceType: string,
 *  status: "DRAFT" | "PUBLISHED"
 * }
 *
 * postId = number (if -1, it means create new post)
 *
 *
 */

export const getRoutedPost = (postId) => {
  // Finds a post by id from the mock post data for editor routing.
  const numericPostId = Number(postId);

  if (Number.isNaN(numericPostId) || numericPostId === -1) {
    return null;
  }

  return (
    (mockData?.data || []).find((item) => item.id === numericPostId) || null
  );
};

export const saveDraft = async (postId, formData) => {
  // Saves draft data; if id is -1 create a new post, otherwise update the existing post.
  if (postId === -1) {
    return fetch(`${import.meta.env.VITE_API_URL}/api/v1/posts`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(formData),
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (response) => {
      const data = await response.json();

      if (response.ok && data?.success && Array.isArray(mockData?.data)) {
        const createdPost = data?.data || {};
        const nextId = Math.max(0, ...mockData.data.map((item) => Number(item.id) || 0)) + 1;

        mockData.data = [
          {
            ...createdPost,
            id: createdPost?.id ?? nextId,
            title: createdPost?.title ?? formData?.title ?? "",
            description:
              createdPost?.description ?? formData?.description ?? formData?.content ?? "",
            experienceType: createdPost?.experienceType ?? formData?.experienceType,
            status: createdPost?.status ?? formData?.status,
            updatedAt: createdPost?.updatedAt ?? new Date().toISOString(),
            _count: createdPost?._count ?? { likes: 0, comments: 0 },
            hasLiked: createdPost?.hasLiked ?? false,
          },
          ...mockData.data,
        ];
      }

      return data;
    });
  }

  return fetch(`${import.meta.env.VITE_API_URL}/api/v1/posts/${postId}`, {
    method: "PATCH",
    credentials: "include",
    body: JSON.stringify({ updates: formData }),
    headers: {
      "Content-Type": "application/json",
    },
  }).then(async (response) => {
    const data = await response.json();

    if (response.ok && data?.success && Array.isArray(mockData?.data)) {
      const numericPostId = Number(postId);
      const updatedPost = data?.data || {};

      mockData.data = mockData.data.map((item) => {
        if (item.id !== numericPostId) {
          return item;
        }

        return {
          ...item,
          ...updatedPost,
          id: numericPostId,
          title: updatedPost?.title ?? formData?.title ?? item.title,
          description:
            updatedPost?.description ??
            formData?.description ??
            formData?.content ??
            item.description,
          experienceType:
            updatedPost?.experienceType ?? formData?.experienceType ?? item.experienceType,
          status: updatedPost?.status ?? formData?.status ?? item.status,
          updatedAt: updatedPost?.updatedAt ?? new Date().toISOString(),
        };
      });
    }

    return data;
  });
};

export const publishPost = async (postId, formData) => {
  // Publishes data; if id is -1 create a new post, otherwise update the existing post.
  if (postId === -1) {
    return fetch(`${import.meta.env.VITE_API_URL}/api/v1/posts`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(formData),
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (response) => {
      const data = await response.json();

      if (response.ok && data?.success && Array.isArray(mockData?.data)) {
        const createdPost = data?.data || {};
        const nextId = Math.max(0, ...mockData.data.map((item) => Number(item.id) || 0)) + 1;

        mockData.data = [
          {
            ...createdPost,
            id: createdPost?.id ?? nextId,
            title: createdPost?.title ?? formData?.title ?? "",
            description:
              createdPost?.description ?? formData?.description ?? formData?.content ?? "",
            experienceType: createdPost?.experienceType ?? formData?.experienceType,
            status: createdPost?.status ?? formData?.status,
            updatedAt: createdPost?.updatedAt ?? new Date().toISOString(),
            _count: createdPost?._count ?? { likes: 0, comments: 0 },
            hasLiked: createdPost?.hasLiked ?? false,
          },
          ...mockData.data,
        ];
      }

      return data;
    });
  }

  return fetch(`${import.meta.env.VITE_API_URL}/api/v1/posts/${postId}`, {
    method: "PATCH",
    credentials: "include",
    body: JSON.stringify({ updates: formData }),
    headers: {
      "Content-Type": "application/json",
    },
  }).then(async (response) => {
    const data = await response.json();

    if (response.ok && data?.success && Array.isArray(mockData?.data)) {
      const numericPostId = Number(postId);
      const updatedPost = data?.data || {};

      mockData.data = mockData.data.map((item) => {
        if (item.id !== numericPostId) {
          return item;
        }

        return {
          ...item,
          ...updatedPost,
          id: numericPostId,
          title: updatedPost?.title ?? formData?.title ?? item.title,
          description:
            updatedPost?.description ??
            formData?.description ??
            formData?.content ??
            item.description,
          experienceType:
            updatedPost?.experienceType ?? formData?.experienceType ?? item.experienceType,
          status: updatedPost?.status ?? formData?.status ?? item.status,
          updatedAt: updatedPost?.updatedAt ?? new Date().toISOString(),
        };
      });
    }

    return data;
  });
};

export const deletePost = async (postId) => {
  // Deletes the post with the provided post id.
  return fetch(`${import.meta.env.VITE_API_URL}/api/v1/posts/${postId}`, {
    method: "DELETE",
    credentials: "include",
  }).then(async (response) => {
    const data = await response.json();

    console.log("Delete post response:", data.message);
    if (response.ok && data?.success) {
      const numericPostId = Number(postId);
      if (!Number.isNaN(numericPostId) && Array.isArray(mockData?.data)) {
        mockData.data = mockData.data.filter(
          (item) => item.id !== numericPostId,
        );
      }
    }

    return data;
  });
};
