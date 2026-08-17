import React, { useState, useCallback } from "react";
import { GraduationCap, X, MessageSquare } from "lucide-react";
import AskACC from "./AskACC.jsx";

export default function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [labelVisible, setLabelVisible] = useState(true);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    setLabelVisible(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* ── Floating trigger ───────────────────────────────────────── */}
      <div className="fixed bottom-6 right-5 z-50 flex flex-col items-end gap-2.5 select-none">

        {/* Pill label "Ask ACC" — shown when panel is closed */}
        {!isOpen && labelVisible && (
          <div
            className="flex items-center gap-2 bg-white/95 backdrop-blur-xl border border-[var(--color-secondary)]/40 text-[var(--color-primary)] text-xs font-bold
                       px-3.5 py-1.5 rounded-full shadow-[0_0_15px_rgba(21,135,212,0.25)]
                       cursor-pointer hover:border-[var(--color-secondary)] hover:bg-slate-50 transition-all"
            onClick={toggle}
          >
            <span className="text-[var(--color-secondary)]">Ask ACC</span>
            <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)] animate-pulse" />
          </div>
        )}

        {/* Circular graduation cap button */}
        <button
          id="askacc-trigger"
          onClick={toggle}
          aria-label={isOpen ? "Close AskACC chatbot" : "Open AskACC chatbot"}
          aria-expanded={isOpen}
          aria-controls="askacc-panel"
          className="
            relative w-14 h-14 rounded-full
            bg-white/95 backdrop-blur-xl border-2 border-[var(--color-secondary)]
            flex items-center justify-center
            shadow-[0_0_20px_rgba(21,135,212,0.35)] hover:shadow-[0_0_25px_rgba(21,135,212,0.5)]
            transition-all duration-300 ease-out
            hover:scale-105 active:scale-95
            focus:outline-none cursor-pointer
            overflow-hidden group
          "
        >
          {/* Pulse ring — only when closed */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full border-2 border-[var(--color-secondary)]/30 animate-ping pointer-events-none" />
          )}

          {/* Icon */}
          <span className="relative z-10 flex items-center justify-center" aria-hidden="true">
            {isOpen
              ? <X size={20} className="text-[var(--color-secondary)]" />
              : <GraduationCap size={24} className="text-[var(--color-secondary)] group-hover:scale-110 transition-transform" />}
          </span>
        </button>
      </div>

      {/* ── Chat panel ──────────────────────────────────────────────── */}
      {isOpen && <AskACC onClose={handleClose} />}
    </>
  );
}
