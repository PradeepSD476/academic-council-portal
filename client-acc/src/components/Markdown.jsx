import { useMemo, useRef, useState } from "react";
import { Bold, Code, ImagePlus, Italic, Link2, List, Quote } from "lucide-react";
import toast from "react-hot-toast";
import { getFilePath } from "../lib/getFilePath";
import { renderMarkdown } from "../lib/markdown";

// <Markdown /> shows Markdown text, <MarkdownEditor /> is the write/preview box
// with a toolbar and image upload. The parsing itself is in lib/markdown.js.

const PROSE =
  "md-body text-sm leading-relaxed text-slate-700 break-words " +
  "[&_p]:my-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-4 [&_h2]:mb-2 " +
  "[&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mt-4 [&_h3]:mb-2 " +
  "[&_h4]:text-sm [&_h4]:font-bold [&_h4]:text-slate-900 [&_h4]:mt-3 [&_h4]:mb-1 " +
  "[&_a]:text-[var(--color-secondary)] [&_a]:underline [&_a]:underline-offset-2 [&_a]:break-all " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-0.5 " +
  "[&_blockquote]:border-l-[3px] [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-slate-500 " +
  "[&_code]:bg-slate-100 [&_code]:border [&_code]:border-slate-200 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px] [&_code]:font-mono " +
  "[&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:rounded-xl [&_pre]:p-3 [&_pre]:my-3 [&_pre]:overflow-x-auto " +
  "[&_pre_code]:bg-transparent [&_pre_code]:border-0 [&_pre_code]:p-0 [&_pre_code]:text-slate-100 " +
  "[&_img]:max-w-full [&_img]:max-h-[420px] [&_img]:rounded-xl [&_img]:border [&_img]:border-slate-200 [&_img]:my-3 " +
  "[&_hr]:my-4 [&_hr]:border-slate-200 [&_.md-missing]:text-xs [&_.md-missing]:text-slate-400 [&_.md-missing]:italic";

export function Markdown({ source, imageMap, className = "" }) {
  const html = useMemo(() => renderMarkdown(source, imageMap), [source, imageMap]);
  return <div className={`${PROSE} ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ------------------------------- Editor ---------------------------------- */

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write here… Markdown is supported.",
  rows = 8,
  maxLength = 20000,
  initialImages = {},
  id,
}) {
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const [tab, setTab] = useState("write");
  const [uploading, setUploading] = useState(false);
  // media path -> URL that can be shown in the preview
  const [images, setImages] = useState(initialImages);

  // Wrap the selection (or insert a sample) and keep the cursor in a useful place.
  const surround = (before, after = before, sample = "text") => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const picked = value.slice(start, end) || sample;
    onChange(value.slice(0, start) + before + picked + after + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + picked.length);
    });
  };

  const prefixLine = (prefix) => {
    const el = textareaRef.current;
    if (!el) return;
    const lineStart = value.lastIndexOf("\n", el.selectionStart - 1) + 1;
    onChange(value.slice(0, lineStart) + prefix + value.slice(lineStart));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(el.selectionStart + prefix.length, el.selectionStart + prefix.length);
    });
  };

  const insertAtCursor = (text) => {
    const el = textareaRef.current;
    const at = el ? el.selectionStart : value.length;
    onChange(value.slice(0, at) + text + value.slice(at));
  };

  const handleImage = async (event) => {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    if (!IMAGE_TYPES.includes(picked.type)) return toast.error("Only PNG, JPG, GIF or WEBP images are allowed.");
    if (picked.size > MAX_IMAGE_BYTES) return toast.error("Image must be smaller than 5 MB.");

    // Keep the stored file name simple so it always fits inside ![](...)
    const safeName = picked.name.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+/, "").slice(-60) || "image";
    const file = new File([picked], safeName, { type: picked.type });

    setUploading(true);
    try {
      const result = await getFilePath({ file, folder: "doubts" });
      if (!result?.filePath) {
        toast.error("Image upload failed. Please try again.");
        return;
      }
      setImages((prev) => ({ ...prev, [result.filePath]: URL.createObjectURL(file) }));
      const alt = safeName.replace(/\.[^.]+$/, "");
      insertAtCursor(`\n![${alt}](media:${result.filePath})\n`);
    } finally {
      setUploading(false);
    }
  };

  const tools = [
    { label: "Bold", icon: <Bold size={14} />, run: () => surround("**") },
    { label: "Italic", icon: <Italic size={14} />, run: () => surround("*") },
    { label: "Code", icon: <Code size={14} />, run: () => surround("`", "`", "code") },
    { label: "Link", icon: <Link2 size={14} />, run: () => surround("[", "](https://)", "link text") },
    { label: "List", icon: <List size={14} />, run: () => prefixLine("- ") },
    { label: "Quote", icon: <Quote size={14} />, run: () => prefixLine("> ") },
  ];

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden focus-within:border-[var(--color-secondary)] transition">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-slate-200 bg-slate-50">
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 mr-1">
          {["write", "preview"].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              aria-pressed={tab === name}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize cursor-pointer transition ${
                tab === name ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {tab === "write" && (
          <>
            {tools.map((tool) => (
              <button
                key={tool.label}
                type="button"
                title={tool.label}
                aria-label={tool.label}
                onClick={tool.run}
                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-2xs cursor-pointer transition"
              >
                {tool.icon}
              </button>
            ))}
            <button
              type="button"
              title="Add image"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="h-7 px-2 flex items-center gap-1.5 rounded-md text-[11px] font-semibold text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-2xs cursor-pointer transition disabled:opacity-60 disabled:cursor-wait"
            >
              <ImagePlus size={14} />
              {uploading ? "Uploading…" : "Image"}
            </button>
            <input ref={fileRef} type="file" accept={IMAGE_TYPES.join(",")} onChange={handleImage} className="hidden" />
          </>
        )}
      </div>

      {tab === "write" ? (
        <textarea
          id={id}
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder}
          className="block w-full px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-y bg-white font-mono leading-relaxed"
        />
      ) : (
        <div className="px-3 py-2.5 min-h-[120px]">
          {value.trim() ? (
            <Markdown source={value} imageMap={images} />
          ) : (
            <p className="text-sm text-slate-400">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
