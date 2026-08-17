import React, { memo } from "react";
import { GraduationCap, User } from "lucide-react";

/** Minimal bold-text renderer: **text** → <strong>text</strong> */
function renderText(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-[var(--color-primary)] font-bold">{part.slice(2, -2)}</strong>;
    }
    // Also handle line breaks
    return part.split("\n").map((line, j, arr) => (
      <React.Fragment key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  });
}

function formatTime(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const ChatMessage = memo(function ChatMessage({ message }) {
  const { type, text, timestamp } = message;
  const isUser = type === "user";

  if (isUser) {
    return (
      <div className="flex justify-end items-end gap-2 group">
        <div className="flex flex-col items-end gap-1 max-w-[82%]">
          <div className="bg-[var(--color-secondary)] text-[var(--color-primary)] px-4 py-2.5 rounded-2xl rounded-br-xs shadow-[0_0_15px_rgba(21,135,212,0.25)] text-xs leading-relaxed font-medium">
            {renderText(text)}
          </div>
          <span className="text-[9px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity px-1">
            {formatTime(timestamp)}
          </span>
        </div>
        {/* User avatar */}
        <div className="shrink-0 w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold">
          <User size={12} />
        </div>
      </div>
    );
  }

  // Bot message
  return (
    <div className="flex items-start gap-2.5 group">
      {/* Bot avatar */}
      <div className="shrink-0 w-7 h-7 rounded-xl bg-slate-100 border border-[var(--color-secondary)]/40 flex items-center justify-center text-[var(--color-secondary)] shadow-[0_0_8px_rgba(21,135,212,0.2)]">
        <GraduationCap size={14} />
      </div>
      <div className="flex flex-col gap-1 max-w-[88%]">
        <div className="px-4 py-3 rounded-2xl rounded-tl-xs shadow-md text-xs leading-relaxed bg-white/95 backdrop-blur-xl border border-slate-200 text-slate-700">
          {renderText(text)}
        </div>
        <span className="text-[9px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity px-1">
          {formatTime(timestamp)}
        </span>
      </div>
    </div>
  );
});

export default ChatMessage;
