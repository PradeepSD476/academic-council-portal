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
    const preservedDescription = getPreservedEditorHtml();
    const payload = {
      ...formData,
      content: preservedDescription,
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
      content: preservedDescription,
      description: preservedDescription,
      status: "DRAFT",
    };

    const response = await saveDraft(Number(id), payload);

    if (response?.success) {
      navigate("/admin/manage-posts");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        {/*Header*/}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-[3px] h-6 bg-[#E85D25] rounded-full shadow-[0_0_8px_#E85D25]" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <FileText className="text-[#E85D25]" size={24} />
              {isNewPost ? "Create Career Experience Post" : "Edit Career Experience Post"}
            </h1>
          </div>
          <p className="text-gray-400 text-sm ml-4">
            Review, format, and manage student career insights before publishing.
          </p>
        </div>

        {/*Actions*/}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 text-gray-300 text-xs font-semibold rounded-xl hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <ArrowLeft size={14} />
            Back to Posts
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 text-gray-300 text-xs font-semibold rounded-xl hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <Save size={14} />
            Save Draft
          </button>
          <button
            type="button"
            onClick={handlePublish}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#E85D25] hover:bg-[#d44d18] text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(232,93,37,0.35)] transition cursor-pointer"
          >
            <CheckCircle size={14} />
            Publish Post
          </button>
        </div>
      </div>

      {/*Form Container*/}
      <div className="bg-[#141414] rounded-3xl border border-neutral-800 shadow-xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wider">
              <Type size={14} className="text-[#E85D25]" />
              Post Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Google SWE Summer Intern Interview & Prep"
              className="w-full px-3.5 py-2.5 border border-neutral-800 bg-[#181818] rounded-xl text-white placeholder-gray-500 focus:border-[#E85D25] focus:outline-none text-sm transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wider">
              <Tag size={14} className="text-[#E85D25]" />
              Experience Type
            </label>
            <select
              name="experienceType"
              value={formData.experienceType}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-[#181818] border border-neutral-800 rounded-xl text-white focus:border-[#E85D25] focus:outline-none text-sm transition cursor-pointer"
            >
              {EXPERIENCE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-900 text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wider">
              <Tag size={14} className="text-[#E85D25]" />
              Domain Track
            </label>
            <select
              name="domain"
              value={formData.domain}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-[#181818] border border-neutral-800 rounded-xl text-white focus:border-[#E85D25] focus:outline-none text-sm transition cursor-pointer"
            >
              {DOMAIN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-900 text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wider">
              <FileText size={14} className="text-[#E85D25]" />
              Rich Article Content
            </label>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyCommand("formatBlock", "h1")}
                className="inline-flex items-center gap-1 rounded-xl border border-neutral-800 bg-[#181818] px-2.5 py-1 text-xs font-semibold text-gray-300 hover:text-white hover:border-[#E85D25]/40 transition cursor-pointer"
              >
                <Heading1 size={13} />
                H1
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyCommand("bold")}
                className="inline-flex items-center gap-1 rounded-xl border border-neutral-800 bg-[#181818] px-2.5 py-1 text-xs font-semibold text-gray-300 hover:text-white hover:border-[#E85D25]/40 transition cursor-pointer"
              >
                <Bold size={13} />
                Bold
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyCommand("italic")}
                className="inline-flex items-center gap-1 rounded-xl border border-neutral-800 bg-[#181818] px-2.5 py-1 text-xs font-semibold text-gray-300 hover:text-white hover:border-[#E85D25]/40 transition cursor-pointer"
              >
                <Italic size={13} />
                Italic
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => wrapSelectionWithTag("code")}
                className="inline-flex items-center gap-1 rounded-xl border border-neutral-800 bg-[#181818] px-2.5 py-1 text-xs font-semibold text-gray-300 hover:text-white hover:border-[#E85D25]/40 transition cursor-pointer"
              >
                <Code size={13} />
                Code
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyCommand("insertUnorderedList")}
                className="inline-flex items-center gap-1 rounded-xl border border-neutral-800 bg-[#181818] px-2.5 py-1 text-xs font-semibold text-gray-300 hover:text-white hover:border-[#E85D25]/40 transition cursor-pointer"
              >
                <List size={13} />
                List
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyCommand("formatBlock", "blockquote")}
                className="inline-flex items-center gap-1 rounded-xl border border-neutral-800 bg-[#181818] px-2.5 py-1 text-xs font-semibold text-gray-300 hover:text-white hover:border-[#E85D25]/40 transition cursor-pointer"
              >
                <Quote size={13} />
                Quote
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={applyLink}
                className="inline-flex items-center gap-1 rounded-xl border border-neutral-800 bg-[#181818] px-2.5 py-1 text-xs font-semibold text-gray-300 hover:text-white hover:border-[#E85D25]/40 transition cursor-pointer"
              >
                <Link size={13} />
                Link
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-[#181818] overflow-hidden focus-within:border-[#E85D25] transition">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              onBlur={handleEditorInput}
              className="rich-editor min-h-80 px-5 py-5 text-gray-100 outline-none leading-relaxed text-sm"
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