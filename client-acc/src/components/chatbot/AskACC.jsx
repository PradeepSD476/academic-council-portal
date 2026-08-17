import React, { useState, useCallback } from "react";
import { X, RotateCcw, ExternalLink, GraduationCap, Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { useChatbot } from "@/hooks/useChatbot.js";
import ChatWindow from "./ChatWindow.jsx";
import InputBar from "./InputBar.jsx";

export default function AskACC({ onClose }) {
  const [input, setInput] = useState("");
  const [isOpen] = useState(true);

  const {
    messages,
    isTyping,
    isWelcomeState,
    sendMessage,
    selectCategory,
    clearChat,
  } = useChatbot({ isOpen });

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  }, [input, sendMessage]);

  const handleSuggestion = useCallback(
    (query) => {
      sendMessage(query);
    },
    [sendMessage]
  );

  return (
    <div
      id="askacc-panel"
      role="dialog"
      aria-label="AskACC Chatbot"
      aria-modal="true"
      className="
        fixed bottom-24 right-4 z-[9999]
        w-[92vw] sm:w-[410px] h-[82vh] sm:h-[620px] max-h-[720px]
        bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_10px_40px_rgba(11,30,63,0.15)] flex flex-col overflow-hidden
        border border-slate-200 animate-askacc-slide-up text-[var(--color-primary)]
      "
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Bot avatar */}
          <div className="w-9 h-9 rounded-2xl bg-slate-100 border border-[var(--color-secondary)]/40 flex items-center justify-center shadow-[0_0_10px_rgba(21,135,212,0.2)]">
            <GraduationCap className="w-5 h-5 text-[var(--color-secondary)]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-[var(--color-primary)] font-extrabold text-sm leading-tight">AskACC</h2>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[var(--color-secondary)]/15 text-[var(--color-secondary)]">AI Guide</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-500 text-[10px] font-semibold">IIT Patna · Online</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Link to full FAQ page */}
          <Link
            to="/faq"
            onClick={onClose}
            title="Browse all FAQs"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-600 hover:text-[var(--color-primary)] bg-slate-50 hover:bg-slate-200 transition-colors text-[11px] font-semibold"
            aria-label="Go to full FAQ page"
          >
            <ExternalLink size={12} />
            <span>FAQs</span>
          </Link>

          {/* Clear chat */}
          <button
            onClick={clearChat}
            title="Clear chat"
            className="p-2 rounded-xl text-slate-500 hover:text-[var(--color-primary)] hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Clear conversation"
          >
            <RotateCcw size={13} />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            title="Close chatbot"
            className="p-2 rounded-xl text-slate-500 hover:text-[var(--color-primary)] hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Close chatbot"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── Chat messages ────────────────────────────────────────────── */}
      <ChatWindow
        messages={messages}
        isTyping={isTyping}
        isWelcomeState={isWelcomeState}
        onCategorySelect={selectCategory}
        onSuggestionSelect={handleSuggestion}
      />

      {/* ── Input bar ────────────────────────────────────────────────── */}
      <InputBar
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isTyping}
      />
    </div>
  );
}
