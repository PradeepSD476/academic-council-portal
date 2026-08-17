import React, { useRef, useEffect } from "react";
import { Bold, Italic, Strikethrough, Link as LinkIcon, List, ListOrdered } from "lucide-react";

const NativeRichTextEditor = ({ 
  value, 
  onChange, 
  minHeight = "250px", 
  placeholder = "Share your experience...", 
  autoFocus = false 
}) => {
  // We use a ref to directly manipulate the DOM node of our editor.
  // Normal React state variables don't work beautifully with contentEditable divs.
  const editorRef = useRef(null);
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  useEffect(() => {
    if (autoFocus && editorRef.current) {
      setTimeout(() => editorRef.current.focus(), 0);
    }
  }, [autoFocus]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Applies formatting (bold, italic, etc.) to the highlighted text.
  // We rely on the browser's built-in document.execCommand API. 
  // It's the lightest, dependency-free way to make a solid text editor.
  const execCommand = (e, command, val = null) => {
    // Prevent the default behavior so the editor DOES NOT lose focus
    // before the command executes.
    e.preventDefault(); 
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML); // Bubble the new HTML up to parent
    }
  };

  return (
    <div className="flex-1 flex flex-col border border-slate-200 rounded-2xl focus-within:border-[var(--color-secondary)] transition-all bg-white/90 overflow-hidden mb-4" style={{ minHeight }}>
      <div className="bg-sky-50 px-3 py-2 flex items-center gap-1 border-b border-slate-200 text-slate-600 flex-wrap z-10">
        <button type="button" onMouseDown={(e) => execCommand(e, "bold")} className="p-1.5 hover:bg-sky-100 hover:text-[var(--color-secondary)] rounded-lg transition-colors cursor-pointer" title="Bold"><Bold size={15} strokeWidth={2.5}/></button>
        <button type="button" onMouseDown={(e) => execCommand(e, "italic")} className="p-1.5 hover:bg-sky-100 hover:text-[var(--color-secondary)] rounded-lg transition-colors cursor-pointer" title="Italic"><Italic size={15} strokeWidth={2.5}/></button>
        <button type="button" onMouseDown={(e) => execCommand(e, "strikeThrough")} className="p-1.5 hover:bg-sky-100 hover:text-[var(--color-secondary)] rounded-lg transition-colors cursor-pointer" title="Strikethrough"><Strikethrough size={15} strokeWidth={2.5}/></button>
        <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>
        <button type="button" onMouseDown={(e) => {
            e.preventDefault();
            const url = prompt("Enter link URL:");
            if(url) {
              document.execCommand("createLink", false, url);
              onChange(editorRef.current.innerHTML);
            }
        }} className="p-1.5 hover:bg-sky-100 hover:text-[var(--color-secondary)] rounded-lg transition-colors cursor-pointer" title="Link"><LinkIcon size={15} strokeWidth={2.5}/></button>
        <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>
        <button type="button" onMouseDown={(e) => execCommand(e, "insertUnorderedList")} className="p-1.5 hover:bg-sky-100 hover:text-[var(--color-secondary)] rounded-lg transition-colors cursor-pointer" title="Bullet List"><List size={15} strokeWidth={2.5}/></button>
        <button type="button" onMouseDown={(e) => execCommand(e, "insertOrderedList")} className="p-1.5 hover:bg-sky-100 hover:text-[var(--color-secondary)] rounded-lg transition-colors cursor-pointer" title="Numbered List"><ListOrdered size={15} strokeWidth={2.5}/></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        className="flex-1 p-4 outline-none text-[var(--color-primary)] focus:outline-none overflow-y-auto w-full format-prose empty:before:content-[attr(data-placeholder)] empty:before:text-slate-500 text-sm leading-relaxed"
      />
    </div>
  );
};

export default NativeRichTextEditor;
