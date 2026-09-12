import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bold,
  CheckCircle,
  Code,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link,
  List,
  Quote,
  Save,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { getFilePath } from "../lib/getFilePath";
import toast from "react-hot-toast";

const RoadmapEditor = ({
  initialTitle = "",
  initialContent = "",
  initialDuration = "10 mins",
  onSave,
  onCancel,
  isSaving = false,
}) => {
  const editorRef = useRef(null);
  const [title, setTitle] = useState(initialTitle);
  const [duration, setDuration] = useState(initialDuration);
  const [content, setContent] = useState(initialContent);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlignment, setImageAlignment] = useState("center");

  useEffect(() => {
    setTitle(initialTitle);
    setDuration(initialDuration);
    setContent(initialContent);
  }, [initialTitle, initialContent, initialDuration]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content || "";
    }
  }, [content]);

  const handleEditorInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const applyCommand = (command, value = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const wrapSelectionWithTag = (tagName, placeholder = "code") => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    const selectedText = selection.toString() || placeholder;
    document.execCommand(
      "insertHTML",
      false,
      `<${tagName}>${selectedText}</${tagName}>`
    );
    handleEditorInput();
  };

  const applyLink = () => {
    const url = window.prompt("Enter link URL", "https://");
    if (url) applyCommand("createLink", url);
  };

  const handleImageFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    setIsUploadingImage(true);
    try {
      const result = await getFilePath({ file, folder: "roadmap_images" });
      if (result?.filePath) {
        setImageUrl(result.filePath);
        toast.success("Image uploaded successfully!");
      } else {
        toast.error("Image upload failed.");
      }
    } catch (error) {
      toast.error("Error uploading image.");
      console.error(error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const insertImage = () => {
    if (!imageUrl) {
      toast.error("Please provide an image URL or upload an image file.");
      return;
    }

    let alignClass = "mx-auto block my-4 max-w-full rounded-xl shadow-xs";
    if (imageAlignment === "left") {
      alignClass = "mr-auto block my-4 max-w-md rounded-xl shadow-xs";
    } else if (imageAlignment === "right") {
      alignClass = "ml-auto block my-4 max-w-md rounded-xl shadow-xs";
    } else if (imageAlignment === "full") {
      alignClass = "w-full block my-4 rounded-xl shadow-xs";
    }

    const imgTag = `<img src="${imageUrl}" class="${alignClass}" alt="Roadmap Image" />`;
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand("insertHTML", false, imgTag);
      handleEditorInput();
    }

    setShowImageModal(false);
    setImageUrl("");
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Chapter title is required.");
      return;
    }
    onSave({ title, content, duration });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="text-rose-600" size={24} />
            <span>Chapter Editor</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Write structured, image-rich roadmap content for students.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer disabled:opacity-60"
          >
            <CheckCircle size={14} />
            <span>{isSaving ? "Saving..." : "Save Chapter"}</span>
          </button>
        </div>
      </div>

      {/* Editor Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
        {/* Title & Duration Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Type size={14} className="text-rose-600" />
              <span>Chapter Title</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 1: Getting Started with Next.js"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-600/10 focus:outline-none text-sm font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <FileText size={14} className="text-rose-600" />
              <span>Est. Read Duration</span>
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 10 mins"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-600/10 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Document Content
            </label>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyCommand("formatBlock", "h1")}
                className="px-2 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1"
                title="Heading 1"
              >
                <Heading1 size={13} />
                <span>H1</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyCommand("formatBlock", "h2")}
                className="px-2 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1"
                title="Heading 2"
              >
                <Heading2 size={13} />
                <span>H2</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyCommand("formatBlock", "h3")}
                className="px-2 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1"
                title="Heading 3"
              >
                <Heading3 size={13} />
                <span>H3</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyCommand("bold")}
                className="px-2 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1"
                title="Bold"
              >
                <Bold size={13} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyCommand("italic")}
                className="px-2 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1"
                title="Italic"
              >
                <Italic size={13} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => wrapSelectionWithTag("code")}
                className="px-2 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1"
                title="Code Inline"
              >
                <Code size={13} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyCommand("insertUnorderedList")}
                className="px-2 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1"
                title="Bullet List"
              >
                <List size={13} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyCommand("formatBlock", "blockquote")}
                className="px-2 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1"
                title="Quote Block"
              >
                <Quote size={13} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={applyLink}
                className="px-2 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1"
                title="Insert Link"
              >
                <Link size={13} />
              </button>
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="px-2.5 py-1 text-xs font-bold bg-rose-50 border border-rose-200 text-rose-600 rounded hover:bg-rose-100 flex items-center gap-1 cursor-pointer"
                title="Insert Image"
              >
                <ImageIcon size={13} />
                <span>+ Image</span>
              </button>
            </div>
          </div>

          {/* Editable Canvas */}
          <div className="rounded-xl border border-slate-200 bg-white min-h-[350px] p-5 focus-within:border-rose-600 transition shadow-2xs">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              onBlur={handleEditorInput}
              className="rich-editor outline-none text-slate-900 leading-relaxed text-sm min-h-[320px]"
            />
          </div>
        </div>
      </div>

      {/* Image Insertion Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon size={18} className="text-rose-600" />
                <span>Insert & Position Image</span>
              </h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Upload Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  disabled={isUploadingImage}
                  className="text-xs w-full text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-rose-50 file:text-rose-700 file:font-bold hover:file:bg-rose-100 cursor-pointer"
                />
                {isUploadingImage && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    Uploading image to MinIO...
                  </p>
                )}
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-2 text-[10px] uppercase font-bold text-slate-400">
                  Or Image URL
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.png"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Position & Alignment
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setImageAlignment("center")}
                    className={`flex items-center justify-center gap-1 p-2 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                      imageAlignment === "center"
                        ? "bg-rose-50 border-rose-600 text-rose-700"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    <AlignCenter size={14} />
                    <span>Center</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageAlignment("left")}
                    className={`flex items-center justify-center gap-1 p-2 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                      imageAlignment === "left"
                        ? "bg-rose-50 border-rose-600 text-rose-700"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    <AlignLeft size={14} />
                    <span>Left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageAlignment("right")}
                    className={`flex items-center justify-center gap-1 p-2 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                      imageAlignment === "right"
                        ? "bg-rose-50 border-rose-600 text-rose-700"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    <AlignRight size={14} />
                    <span>Right</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageAlignment("full")}
                    className={`flex items-center justify-center gap-1 p-2 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                      imageAlignment === "full"
                        ? "bg-rose-50 border-rose-600 text-rose-700"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    <span>Full Width</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertImage}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-xs cursor-pointer"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapEditor;
