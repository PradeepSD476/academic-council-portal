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

  return (mockData?.data || []).find((item) => item.id === numericPostId) || null;
};

export const saveDraft = (postId, formData) => {
  // Saves draft data; if id is -1 create a new post, otherwise update the existing post.
  void postId;
  void formData;
};

export const publishPost = (postId, formData) => {
  // Publishes data; if id is -1 create a new post, otherwise update the existing post.
  void postId;
  void formData;
};

export const deletePost = (postId) => {
  // Deletes the post with the provided post id.
  void postId;
};