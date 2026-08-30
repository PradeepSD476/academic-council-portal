import React, { useRef, useEffect } from "react";
import { Bold, Italic, Strikethrough, Link as LinkIcon, List, ListOrdered } from "lucide-react";

const NativeRichTextEditor = ({ 
  value, 
  onChange, 
  minHeight = "160px", 
  placeholder = "Share your experience...", 
  autoFocus = false 
}) => {
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

  const execCommand = (e, command, val = null) => {
    e.preventDefault(); 
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="flex-1 flex flex-col border border-slate-200 rounded-2xl focus-within:border-[var(--color-secondary)] transition-all bg-white/90 overflow-hidden" style={{ minHeight }}>
      <div className="bg-sky-50/80 px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1 border-b border-slate-200 text-slate-600 flex-wrap shrink-0">
        <button type="button" onMouseDown={(e) => execCommand(e, "bold")} className="p-1 sm:p-1.5 hover:bg-sky-100 hover:text-[var(--color-secondary)] rounded-lg transition-colors cursor-pointer" title="Bold"><Bold size={14} className="sm:w-[15px] sm:h-[15px]" strokeWidth={2.5}/></button>
        <button type="button" onMouseDown={(e) => execCommand(e, "italic")} className="p-1 sm:p-1.5 hover:bg-sky-100 hover:text-[var(--color-secondary)] rounded-lg transition-colors cursor-pointer" title="Italic"><Italic size={14} className="sm:w-[15px] sm:h-[15px]" strokeWidth={2.5}/></button>
        <button type="button" onMouseDown={(e) => execCommand(e, "strikeThrough")} className="p-1 sm:p-1.5 hover:bg-sky-100 hover:text-[var(--color-secondary)] rounded-lg transition-colors cursor-pointer" title="Strikethrough"><Strikethrough size={14} className="sm:w-[15px] sm:h-[15px]" strokeWidth={2.5}/></button>
        <div className="w-[1px] h-3.5 bg-slate-300 mx-1"></div>
        <button type="button" onMouseDown={(e) => {
            e.preventDefault();
            const url = prompt("Enter link URL:");
            if(url) {
              document.execCommand("createLink", false, url);
              if (editorRef.current) onChange(editorRef.current.innerHTML);
            }
        }} className="p-1 sm:p-1.5 hover:bg-sky-100 hover:text-[var(--color-secondary)] rounded-lg transition-colors cursor-pointer" title="Link"><LinkIcon size={14} className="sm:w-[15px] sm:h-[15px]" strokeWidth={2.5}/></button>
        <div className="w-[1px] h-3.5 bg-slate-300 mx-1"></div>
        <button type="button" onMouseDown={(e) => execCommand(e, "insertUnorderedList")} className="p-1 sm:p-1.5 hover:bg-sky-100 hover:text-[var(--color-secondary)] rounded-lg transition-colors cursor-pointer" title="Bullet List"><List size={14} className="sm:w-[15px] sm:h-[15px]" strokeWidth={2.5}/></button>
        <button type="button" onMouseDown={(e) => execCommand(e, "insertOrderedList")} className="p-1 sm:p-1.5 hover:bg-sky-100 hover:text-[var(--color-secondary)] rounded-lg transition-colors cursor-pointer" title="Numbered List"><ListOrdered size={14} className="sm:w-[15px] sm:h-[15px]" strokeWidth={2.5}/></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        className="flex-1 p-3 sm:p-4 outline-none text-[var(--color-primary)] focus:outline-none w-full format-prose empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 text-sm leading-relaxed min-h-[120px] sm:min-h-[150px] max-h-[40vh] overflow-y-auto scrollbar-thin"
      />
    </div>
  );
};

export default NativeRichTextEditor;
