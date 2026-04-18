import React, { useState } from "react";
import { ArrowLeft, CheckCircle, FileText, Save, Tag, Type } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { EXPERIENCE_TYPE_OPTIONS, EXPERIENCE_TYPE_VALUES } from "../lib/experienceTypes";
import {
  getRoutedPost,
  publishPost,
  saveDraft,
} from "../lib/Post_Functions";

const AdminPostEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const id = location.state?.postId ?? -1;


  
  const routedPost = getRoutedPost(id);

  const selectedPost = routedPost;
  const normalizedType = selectedPost?.experienceType || selectedPost?.type;

  const defaultExperienceType = EXPERIENCE_TYPE_VALUES.includes(normalizedType)
    ? normalizedType
    : EXPERIENCE_TYPE_OPTIONS[0].value;

  // Initialize state with post data if editing, or empty if new
  const [formData, setFormData] = useState({
    title: selectedPost?.title || "",
    content: selectedPost?.content || selectedPost?.description || "",
    experienceType: defaultExperienceType,
  });

  const isNewPost = Number(id) === -1 || !selectedPost;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRichTextChange = (value) => {
    setFormData((prev) => ({ ...prev, content: value }));
  };

  const handleClose = () => {
    navigate("/admin/manage-posts");
  };

  const handlePublish = () => {
    const payload = {
      ...formData,
      status: "PUBLISHED",
    };

    publishPost(Number(id), payload);
  };

  const handleSaveDraft = () => {
    const payload = {
      ...formData,
      status: "DRAFT",
    };

    saveDraft(Number(id), payload);
  };

  return (
    <div className="p-6 h-[calc(100vh-7.5rem)] bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">

        {/*Header*/}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-blue-600" />
            {isNewPost ? "Create New Post" : "Edit Post"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Review and manage the student experience post before publishing.
          </p>
        </div>

        {/*Actions*/}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Posts
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Save size={16} />
            Save Draft
          </button>
          <button
            type="button"
            onClick={handlePublish}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <CheckCircle size={16} />
            Publish Post
          </button>
        </div>
      </div>

      {/*Form*/}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Type size={16} className="text-gray-400" />
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Google SDE Interview Experience"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-gray-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Tag size={16} className="text-gray-400" />
                Experience Type
              </label>
              <select
                name="experienceType"
                value={formData.experienceType}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-gray-800"
              >
                {EXPERIENCE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5 flex-1 flex flex-col">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FileText size={16} className="text-gray-400" />
              Content
            </label>

            <textarea
              name="content"
              value={formData.content}
              onChange={(e) => handleRichTextChange(e.target.value)}
              placeholder="Write the complete experience details here..."
              className="w-full min-h-80 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-gray-800 resize-y"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPostEditor;