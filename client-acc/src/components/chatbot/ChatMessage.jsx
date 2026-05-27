/**
 * ChatMessage – Renders a single user or bot message bubble.
 *
 * Features:
 * - User: right-aligned blue gradient bubble
 * - Bot: left-aligned white card with avatar
 * - Bold text via **markdown-lite** (no external parser needed)
 * - Timestamp shown on hover
 * - React.memo for render optimization
 */
import React, { memo } from "react";

/** Minimal bold-text renderer: **text** → <strong>text</strong> */
function renderText(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
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
        <div className="flex flex-col items-end gap-0.5 max-w-[78%]">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-3.5 py-2.5 rounded-2xl rounded-br-sm shadow-sm text-sm leading-relaxed">
            {renderText(text)}
          </div>
          <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity px-1">
            {formatTime(timestamp)}
          </span>
        </div>
        {/* User avatar */}
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-[10px] font-bold">
          U
        </div>
      </div>
    );
  }

  // Bot message
  return (
    <div className="flex items-start gap-2.5 group">
      {/* Bot avatar */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
        A
      </div>
      <div className="flex flex-col gap-0.5 max-w-[88%]">
        <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm text-sm leading-relaxed bg-white border border-gray-100 text-gray-700">
          {renderText(text)}
        </div>
        <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity px-1">
          {formatTime(timestamp)}
        </span>
      </div>
    </div>
  );
});

export default ChatMessage;
