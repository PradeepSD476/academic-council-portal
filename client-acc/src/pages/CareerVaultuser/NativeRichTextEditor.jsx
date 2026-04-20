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
    <div className="flex-1 flex flex-col border border-gray-300 rounded-md focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-shadow bg-white overflow-hidden mb-4" style={{ minHeight }}>
      <div className="bg-gray-50 px-3 py-2 flex items-center gap-1 border-b border-gray-200 text-gray-600 flex-wrap z-10">
        <button type="button" onMouseDown={(e) => execCommand(e, "bold")} className="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors" title="Bold"><Bold size={16} strokeWidth={2.5}/></button>
        <button type="button" onMouseDown={(e) => execCommand(e, "italic")} className="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors" title="Italic"><Italic size={16} strokeWidth={2.5}/></button>
        <button type="button" onMouseDown={(e) => execCommand(e, "strikeThrough")} className="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors" title="Strikethrough"><Strikethrough size={16} strokeWidth={2.5}/></button>
        <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
        <button type="button" onMouseDown={(e) => {
            e.preventDefault();
            const url = prompt("Enter link URL:");
            if(url) {
              document.execCommand("createLink", false, url);
              onChange(editorRef.current.innerHTML);
            }
        }} className="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors" title="Link"><LinkIcon size={16} strokeWidth={2.5}/></button>
        <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
        <button type="button" onMouseDown={(e) => execCommand(e, "insertUnorderedList")} className="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors" title="Bullet List"><List size={16} strokeWidth={2.5}/></button>
        <button type="button" onMouseDown={(e) => execCommand(e, "insertOrderedList")} className="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors" title="Numbered List"><ListOrdered size={16} strokeWidth={2.5}/></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        // Tailwind empty:before selector reads the data-placeholder attribute 
        // to show placeholder text when the contenteditable div is empty
        className="flex-1 p-4 outline-none text-gray-800 focus:outline-none overflow-y-auto w-full format-prose empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
      />
    </div>
  );
};

export default NativeRichTextEditor;
