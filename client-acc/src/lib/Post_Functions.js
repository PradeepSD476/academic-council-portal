import mockData from "../pages/admin/mock-post.json";
import toast from "react-hot-toast";

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

//Still To be Done.
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

const createPost = async (formData) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/posts`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(formData),
      headers: {
        "Content-Type": "application/json",
      },
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    const message = data?.message || "Something went wrong while creating the post.";

    if (response.status === 201 && data?.success) {
      if (Array.isArray(mockData?.data)) {
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

      toast.success(message);
      return data;
    }

    if (response.status === 400 || response.status === 500) {
      toast.error(message);
      return data;
    }

    toast.error(message);
    return data;
  } catch {
    const fallback = {
      success: false,
      error: "NetworkError",
      message: "Unable to create post due to a network error. Please try again.",
    };
    toast.error(fallback.message);
    return fallback;
  }
};

const updatePost = async (postId, formData) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/posts/${postId}`, {
      method: "PATCH",
      credentials: "include",
      body: JSON.stringify({ updates: formData }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    const message = data?.message || "Something went wrong while updating the post.";

    if (response.status === 201 && data?.success) {
      if (Array.isArray(mockData?.data)) {
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

      toast.success(message);
      return data;
    }

    if (response.status === 400 || response.status === 404 || response.status === 500) {
      toast.error(message);
      return data;
    }

    toast.error(message);
    return data;
  } catch {
    const fallback = {
      success: false,
      error: "NetworkError",
      message: "Unable to update post due to a network error. Please try again.",
    };
    toast.error(fallback.message);
    return fallback;
  }
};

export const saveDraft = async (postId, formData) => {
  // Saves draft data; if id is -1 create a new post, otherwise update the existing post.
  if (postId === -1) {
    return createPost(formData);
  }

  return updatePost(postId, formData);
};

export const publishPost = async (postId, formData) => {
  // Publishes data; if id is -1 create a new post, otherwise update the existing post.
  if (postId === -1) {
    return createPost(formData);
  }

  return updatePost(postId, formData);
};

export const deletePost = async (postId) => {
  // Deletes the post with the provided post id.
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/posts/${postId}`, {
      method: "DELETE",
      credentials: "include",
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    const message = data?.message || "Something went wrong while deleting the post.";

    if (response.status === 200 && data?.success) {
      const numericPostId = Number(postId);
      if (!Number.isNaN(numericPostId) && Array.isArray(mockData?.data)) {
        mockData.data = mockData.data.filter((item) => item.id !== numericPostId);
      }
      toast.success(message);
      return data;
    }

    if (response.status === 400 || response.status === 404 || response.status === 500) {
      toast.error(message);
      return data;
    }

    toast.error(message);
    return data;
  } catch {
    const fallback = {
      success: false,
      error: "NetworkError",
      message: "Unable to delete post due to a network error. Please try again.",
    };
    toast.error(fallback.message);
    return fallback;
  }
};
