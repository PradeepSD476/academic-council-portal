import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Edit2, FileText, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { deletePost, getAllPosts } from "../../lib/Post_Functions";

const PAGE_SIZE = 10;

const stripHtml = (value = "") => value.replace(/<[^>]*>/g, "").trim();

const ManagePost = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      setIsLoading(true);
      const response = await getAllPosts();

      if (!isMounted) {
        return;
      }

      setPosts(Array.isArray(response?.data) ? response.data : []);
      setIsLoading(false);
    };

    void loadPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const openEditorForId = (postId) => {
    navigate("/admin/editor", { state: { postId } });
  };

  const handleDeletePost = async (postId) => {
    const response = await deletePost(postId);

    if (response?.success) {
      setPosts((prev) => prev.filter((item) => item.id !== postId));
    }
  };

  
  

  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));

  const currentPosts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return posts.slice(start, start + PAGE_SIZE);
  }, [posts, page]);

  const startItem = posts.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, posts.length);

  return (
    <div className="p-6 h-[calc(100vh-7.5rem)] bg-gray-50 flex flex-col overflow-hidden">
      {/*Headers*/}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-blue-600" /> Manage Posts
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Add,Edit and Delete your Posts
          </p>
        </div>

        <div className="flex justify-between items-center gap-5">
          <div className="text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-4 py-2">
            Total Posts:{" "}
            <span className="font-semibold text-gray-800">{posts.length}</span>
          </div>

          <button
            className="bg-blue-700 px-4 py-2 text-white rounded-lg cursor-pointer "
            onClick={() => {
              openEditorForId(-1);
            }}
          >+ New Post</button>
        </div>
      </div>

      {/*Pagination Table*/}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Likes / Comments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Options
                  </th> 
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPosts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      {isLoading ? "Loading posts..." : "No posts found."}
                    </td>
                  </tr>
                ) : (
                  currentPosts.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/*Title and Description*/}
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-xs mt-1 overflow-clip">
                          {stripHtml(item.description)}
                        </div>
                      </td>

                      {/*Types*/}
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-blue-700">
                        {item.experienceType}
                      </td>

                      {/*Posted By*/}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.uploadedBy?.displayName || "Unknown"}
                      </td>

                      {/*Likes/Comments*/}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item._count?.likes || 0} / {item._count?.comments || 0}
                      </td>
                      
                      {/*Post Data*/}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </td>

                      {/*Status*/}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {item.status}
                      </td>

                      {/*Editing Options for a Single Post*/}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            aria-label={`Edit ${item.title}`}
                            onClick={() => {
                              openEditorForId(item.id);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-800 transition-colors"
                            aria-label={`Delete ${item.title}`}
                            onClick={() => {
                              void handleDeletePost(item.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50 flex-none">
          {/*Page Number*/}
          <p className="text-xs text-gray-600">
            Showing {startItem} to {endItem} of {posts.length}
          </p>

          <div className="flex items-center gap-1">
            {/*Previous Button as per announcement section*/}
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (pageNo) => (
                <button
                  key={pageNo}
                  onClick={() => setPage(pageNo)}
                  className={`px-3 py-1.5 text-sm border rounded-md ${
                    pageNo === page
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {pageNo}
                </button>
              ),
            )}

            {/*Set Page Number*/}
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default ManagePost;
