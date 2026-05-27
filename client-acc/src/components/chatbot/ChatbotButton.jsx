/**
 * ChatbotButton – Floating AskACC trigger button.
 *
 * Design: pill "Ask ACC" label + circular graduation cap button.
 * Appears on every page (rendered in App.jsx outside page flow).
 */
import React, { useState, useCallback } from "react";
import { GraduationCap, X } from "lucide-react";
import AskACC from "./AskACC.jsx";

export default function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [labelVisible, setLabelVisible] = useState(true);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    setLabelVisible(false); // hide label after first click
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* ── Floating trigger ───────────────────────────────────────── */}
      <div className="fixed bottom-6 right-5 z-50 flex flex-col items-end gap-2 select-none">

        {/* Pill label "Ask ACC" — shown when panel is closed */}
        {!isOpen && labelVisible && (
          <div className="flex items-center gap-2 bg-[#1e3a5f] text-white text-sm font-semibold
                          px-4 py-2 rounded-full shadow-lg
                          animate-askacc-label-in
                          cursor-pointer hover:bg-[#16304f] transition-colors"
            onClick={toggle}
          >
            <span>Ask ACC</span>
            {/* Small dot indicator */}
            <span className="w-2.5 h-2.5 rounded-full bg-white/40 flex-shrink-0" />
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
            relative w-16 h-16 rounded-full
            bg-gradient-to-br from-[#1a3560] via-[#1e4080] to-[#2563eb]
            flex items-center justify-center
            shadow-xl hover:shadow-2xl
            transition-all duration-300 ease-out
            hover:scale-105 active:scale-95
            focus:outline-none focus:ring-4 focus:ring-blue-400/40
            overflow-hidden
          "
        >
          {/* Subtle inner glow */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-white/5 pointer-events-none" />

          {/* Pulse ring — only when closed */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full border-2 border-blue-400/40 animate-ping" />
          )}

          {/* Icon */}
          <span className="relative z-10 flex items-center justify-center" aria-hidden="true">
            {isOpen
              ? <X size={20} className="text-white" />
              : <GraduationCap size={24} className="text-white" />}
          </span>
        </button>
      </div>

      {/* ── Chat panel ──────────────────────────────────────────────── */}
      {isOpen && <AskACC onClose={handleClose} />}
    </>
  );
}
