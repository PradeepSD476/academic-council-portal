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
import { getFilePath } from "../lib/getFilePath";
import { forumApi } from "../api/forumApi";
import toast from "react-hot-toast";

const DOMAIN_OPTIONS = [
  { value: "CS", label: "CS" },
  { value: "ME", label: "ME" },
  { value: "ECE", label: "ECE" },
  { value: "EE", label: "EE" },
  { value: "Quant", label: "Quant" },
  { value: "Civil", label: "Civil" },
  { value: "Chemical", label: "Chemical" },
  { value: "Consulting", label: "Consulting" },
  { value: "Product", label: "Product" },
  { value: "Other", label: "Other" }
];

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
  const [resumeFile, setResumeFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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
    domain: selectedPost?.domain || "Other",
  });

  const isNewPost = Number(id) === -1 || !selectedPost;

  useEffect(() => {
    setFormData({
      title: selectedPost?.title || "",
      description: selectedPost?.description || selectedPost?.content || "",
      experienceType: defaultExperienceType,
      domain: selectedPost?.domain || "Other",
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
      <div className="p-16 flex items-center justify-center">
        <p className="text-sm font-semibold text-gray-400">Loading post data...</p>
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
    const payload = await getPayloadWithResume("PUBLISHED");
    if (!payload) return;

    const response = await publishPost(Number(id), payload);

    if (response?.success) {
      navigate("/admin/manage-posts");
    }
  };

  const handleSaveDraft = async () => {
    const payload = await getPayloadWithResume("DRAFT");
    if (!payload) return;

    const response = await saveDraft(Number(id), payload);

    if (response?.success) {
      navigate("/admin/manage-posts");
    }
  };

  const getPayloadWithResume = async (status) => {
    const preservedDescription = getPreservedEditorHtml();
    const payload = {
      ...formData,
      content: preservedDescription,
      description: preservedDescription,
      status: status,
    };

    if (resumeFile) {
      if (resumeFile.type !== "application/pdf") {
        toast.error("Resume must be a PDF file.");
        return null;
      }
      if (resumeFile.size > 5 * 1024 * 1024) {
        toast.error("Resume size must be less than 5MB.");
        return null;
      }
      
      setIsUploading(true);
      try {
        const uploadResult = await getFilePath({ file: resumeFile, folder: "resumes" });
        if (uploadResult?.filePath) {
          payload.resumeUrl = uploadResult.filePath;
        } else {
          toast.error("Failed to upload resume. Please try again.");
          return null;
        }
      } catch (err) {
        toast.error("Error uploading resume. Please check your storage service.");
        return null;
      } finally {
        setIsUploading(false);
      }
    }

    return payload;
  };

  const handleRemoveResume = async () => {
    if (Number(id) === -1) return; // New post, no resume to delete from server yet
    if (!window.confirm("Are you sure you want to permanently delete the attached resume?")) return;
    
    setIsUploading(true);
    try {
      const response = await forumApi.deleteResume(id);
      if (response?.data?.success) {
        setSelectedPost((prev) => ({ ...prev, resumeUrl: null }));
        toast.success("Resume removed successfully.");
      } else {
        toast.error("Failed to remove resume.");
      }
    } catch (err) {
      toast.error("Error removing resume.");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2.5">
              <FileText className="text-blue-600" size={24} />
              <span>{isNewPost ? "Create Career Post" : "Edit Career Post"}</span>
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm">
            Review, format, and manage student career insights before publishing.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 hover:text-slate-950 transition cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={14} />
            <span>Back to Posts</span>
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 hover:text-slate-950 transition cursor-pointer shadow-2xs disabled:opacity-60"
          >
            <Save size={14} />
            <span>{isUploading ? "Uploading..." : "Save Draft"}</span>
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer disabled:opacity-60"
          >
            <CheckCircle size={14} />
            <span>{isUploading ? "Uploading..." : "Publish Post"}</span>
          </button>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Type size={14} className="text-blue-600" />
              <span>Post Title</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Google SWE Summer Intern Interview & Prep"
              className="w-full px-3.5 py-2.5 border border-slate-200 bg-white rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:outline-none text-sm transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Tag size={14} className="text-blue-600" />
              <span>Experience Type</span>
            </label>
            <select
              name="experienceType"
              value={formData.experienceType}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:outline-none text-sm transition cursor-pointer"
            >
              {EXPERIENCE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Tag size={14} className="text-blue-600" />
              <span>Domain Track</span>
            </label>
            <select
              name="domain"
              value={formData.domain}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:outline-none text-sm transition cursor-pointer"
            >
              {DOMAIN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center justify-between gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-blue-600" />
                <span>Resume (Optional)</span>
              </div>
              {selectedPost?.resumeUrl && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Attached</span>
                  <a 
                    href={selectedPost.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-500 px-2 py-0.5 rounded-full border border-blue-200 transition"
                  >
                    View
                  </a>
                  <button 
                    type="button" 
                    onClick={handleRemoveResume}
                    disabled={isUploading}
                    className="text-[9px] text-red-600 hover:text-white bg-red-50 hover:bg-red-500 px-2 py-0.5 rounded-full border border-red-200 transition disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              )}
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setResumeFile(e.target.files[0] || null)}
              className="w-full text-sm mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <FileText size={14} className="text-blue-600" />
              <span>Rich Article Content</span>
            </label>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyCommand("formatBlock", "h1")}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition cursor-pointer"
              >
                <Heading1 size={13} />
                <span>H1</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyCommand("bold")}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition cursor-pointer"
              >
                <Bold size={13} />
                <span>Bold</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyCommand("italic")}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition cursor-pointer"
              >
                <Italic size={13} />
                <span>Italic</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => wrapSelectionWithTag("code")}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition cursor-pointer"
              >
                <Code size={13} />
                <span>Code</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyCommand("insertUnorderedList")}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition cursor-pointer"
              >
                <List size={13} />
                <span>List</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyCommand("formatBlock", "blockquote")}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition cursor-pointer"
              >
                <Quote size={13} />
                <span>Quote</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={applyLink}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition cursor-pointer"
              >
                <Link size={13} />
                <span>Link</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-blue-600 transition shadow-2xs">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              onBlur={handleEditorInput}
              className="rich-editor min-h-80 px-5 py-4 text-slate-900 outline-none leading-relaxed text-sm"
              data-placeholder="Write the complete experience details here..."
              aria-label="Post description editor"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPostEditor;