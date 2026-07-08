/**
 * AskACC – Main chatbot panel controller.
 *
 * Manages:
 * - Panel open/close state
 * - Chat orchestration via useChatbot hook
 * - Panel slide animation
 * - Header with status, clear, minimize controls
 * - Link to full FAQ page
 */
import React, { useState, useCallback } from "react";
import { X, RotateCcw, ExternalLink, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { useChatbot } from "@/hooks/useChatbot.js";
import ChatWindow from "./ChatWindow.jsx";
import InputBar from "./InputBar.jsx";

export default function AskACC({ onClose }) {
  const [input, setInput] = useState("");
  const [isOpen] = useState(true); // panel is always open when this mounts

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
        w-[92vw] sm:w-96 h-[82vh] sm:h-[600px] max-h-[700px]
        bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden
        border border-gray-100
        animate-askacc-slide-up
      "
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#1e3a5f] via-blue-800 to-indigo-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Bot avatar */}
          <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm leading-tight">AskACC</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-blue-200 text-[11px]">IIT Patna Guide · Online</span>
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
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-[11px] font-medium"
            aria-label="Go to full FAQ page"
          >
            <ExternalLink size={11} />
            All FAQs
          </Link>

          {/* Clear chat */}
          <button
            onClick={clearChat}
            title="Clear chat"
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Clear conversation"
          >
            <RotateCcw size={14} />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            title="Close chatbot"
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close chatbot"
          >
            <X size={16} />
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
