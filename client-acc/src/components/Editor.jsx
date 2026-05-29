import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bold,
  CheckCircle,
  Code,
  FileText,
  Heading1,
  Italic,
  Link,
  List,
  Quote,
  Save,
  Tag,
  Type,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { EXPERIENCE_TYPE_OPTIONS, EXPERIENCE_TYPE_VALUES } from "../lib/experienceTypes";
import {
  getRoutedPost,
  publishPost,
  saveDraft,
} from "../lib/Post_Functions";

const normalizeHtml = (value) => value?.trim() || "";

const preserveHeadingBold = (value = "") => {
  if (!value) {
    return "";
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(value, "text/html");

  document.querySelectorAll("h1").forEach((heading) => {
    if (heading.querySelector("b, strong")) {
      return;
    }

    const boldWrapper = document.createElement("strong");
    while (heading.firstChild) {
      boldWrapper.appendChild(heading.firstChild);
    }

    heading.appendChild(boldWrapper);
  });

  return document.body.innerHTML.trim();
};

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const AdminPostEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const id = location.state?.postId ?? -1;
  const editorRef = useRef(null);

  const [selectedPost, setSelectedPost] = useState(null);
  const [isLoadingPost, setIsLoadingPost] = useState(Number(id) !== -1);

  useEffect(() => {
    let isMounted = true;

    const loadSelectedPost = async () => {
      if (Number(id) === -1) {
        setSelectedPost(null);
        setIsLoadingPost(false);
        return;
      }

      setIsLoadingPost(true);
      const routedPost = await getRoutedPost(id);

      if (!isMounted) {
        return;
      }

      setSelectedPost(routedPost);
      setIsLoadingPost(false);
    };

    void loadSelectedPost();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const normalizedType = selectedPost?.experienceType || selectedPost?.type;

  const defaultExperienceType = EXPERIENCE_TYPE_VALUES.includes(normalizedType)
    ? normalizedType
    : EXPERIENCE_TYPE_OPTIONS[0].value;

  // Initialize state with post data if editing, or empty if new
  const [formData, setFormData] = useState({
    title: selectedPost?.title || "",
    description: selectedPost?.description || selectedPost?.content || "",
    experienceType: defaultExperienceType,
  });

  const isNewPost = Number(id) === -1 || !selectedPost;

  useEffect(() => {
    setFormData({
      title: selectedPost?.title || "",
      description: selectedPost?.description || selectedPost?.content || "",
      experienceType: defaultExperienceType,
    });
  }, [defaultExperienceType, selectedPost]);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    if (editorRef.current.innerHTML !== normalizeHtml(formData.description)) {
      editorRef.current.innerHTML = normalizeHtml(formData.description);
    }
  }, [formData.description]);

  if (isLoadingPost) {
    return (
      <div className="p-6 h-[calc(100vh-7.5rem)] bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading post...</p>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getPreservedEditorHtml = () =>
    preserveHeadingBold(editorRef.current?.innerHTML || formData.description || "");

  const handleEditorInput = () => {
    const nextValue = getPreservedEditorHtml();
    setFormData((prev) => ({ ...prev, description: nextValue }));
  };

  const applyCommand = (command, value = null) => {
    const element = editorRef.current;
    if (!element) {
      return;
    }

    element.focus();
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const wrapSelectionWithTag = (tagName, placeholder = "text") => {
    const element = editorRef.current;
    if (!element) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (!element.contains(range.commonAncestorContainer)) {
      return;
    }

    const selectedText = escapeHtml(range.toString() || placeholder);
    document.execCommand("insertHTML", false, `<${tagName}>${selectedText}</${tagName}>`);
    handleEditorInput();
  };

  const applyLink = () => {
    const url = window.prompt("Enter link URL", "https://");
    if (!url) {
      return;
    }

    applyCommand("createLink", url);
  };

  const handleClose = () => {
    navigate("/admin/manage-posts");
  };

  const handlePublish = async () => {
    const preservedDescription = getPreservedEditorHtml();
    const payload = {
      ...formData,
      description: preservedDescription,
      status: "PUBLISHED",
    };

    const response = await publishPost(Number(id), payload);

    if (response?.success) {
      navigate("/admin/manage-posts");
    }
  };

  const handleSaveDraft = async () => {
    const preservedDescription = getPreservedEditorHtml();
    const payload = {
      ...formData,
      description: preservedDescription,
      status: "DRAFT",
    };

    const response = await saveDraft(Number(id), payload);

    if (response?.success) {
      navigate("/admin/manage-posts");
    }
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

          <div className="space-y-3 flex-1 flex flex-col">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText size={16} className="text-gray-400" />
                Description
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyCommand("formatBlock", "h1")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Heading1 size={14} />
                  H1
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyCommand("bold")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Bold size={14} />
                  Bold
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyCommand("italic")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Italic size={14} />
                  Italic
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapSelectionWithTag("code")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Code size={14} />
                  Code
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyCommand("insertUnorderedList")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <List size={14} />
                  List
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyCommand("formatBlock", "blockquote")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Quote size={14} />
                  Quote
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={applyLink}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Link size={14} />
                  Link
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50/70">
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleEditorInput}
                  onBlur={handleEditorInput}
                  className="rich-editor min-h-80 px-4 py-4 text-gray-800 outline-none"
                  data-placeholder="Write the complete experience details here..."
                  aria-label="Post description editor"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPostEditor;