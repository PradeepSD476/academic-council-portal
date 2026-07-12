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

export const getRoutedPost = async (postId) => {
  // Finds a post by id from the backend Experience data for editor routing.
  const numericPostId = Number(postId);

  if (Number.isNaN(numericPostId) || numericPostId === -1) {
    return null;
  }

  const response = await getAllPosts(1, 1000);
  return (response?.data || []).find((item) => item.id === numericPostId) || null;
};

export const getAllPosts = async (page = 1, limit = 10) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/v1/posts?page=${page}&limit=${limit}&status=ALL`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    const message = data?.message || "Something went wrong while fetching posts.";

    if (response.ok && data?.success) {
      return data;
    }

    if (
      response.status === 400 ||
      response.status === 401 ||
      response.status === 403 ||
      response.status === 500
    ) {
      toast.error(message);
      return { success: false, message, data: [], pagination: { total: 0, totalPages: 0 } };
    }

    toast.error(message);
    return { success: false, message, data: [], pagination: { total: 0, totalPages: 0 } };
  } catch {
    const fallback = {
      success: false,
      error: "NetworkError",
      message: "Unable to fetch posts due to a network error. Please try again.",
      data: [],
      pagination: { total: 0, totalPages: 0 }
    };
    toast.error(fallback.message);
    return fallback;
  }
};


const createPost = async (formData) => {
  try {
    if (!formData?.title) {
      const fallback = {
        success: false,
        error: "ValidationError",
        message: "Title is required to create a post.",
      };
      toast.error(fallback.message);
      return fallback;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/v1/posts`, {
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
    if (!formData?.title) {
      const fallback = {
        success: false,
        error: "ValidationError",
        message: "Title is required to update a post.",
      };
      toast.error(fallback.message);
      return fallback;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/v1/posts/${postId}`, {
      method: "PATCH",
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

    const message = data?.message || "Something went wrong while updating the post.";

    if (response.status === 201 && data?.success) {
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
    const response = await fetch(`${import.meta.env.VITE_API_URL}/v1/posts/${postId}`, {
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
