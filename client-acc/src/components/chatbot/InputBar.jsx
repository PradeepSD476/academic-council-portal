import React, { memo, useRef, useCallback } from "react";
import { Send, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const MAX_LENGTH = 300;

const InputBar = memo(function InputBar({ value, onChange, onSend, disabled }) {
  const inputRef = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey && !disabled) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend, disabled]
  );

  const charCount = value.length;
  const isNearLimit = charCount > MAX_LENGTH * 0.85;

  return (
    <div className="border-t border-slate-200 bg-white/95 backdrop-blur-xl p-3.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            id="askacc-input"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about IIT Patna…"
            maxLength={MAX_LENGTH}
            disabled={disabled}
            aria-label="Type your question"
            className={`
              w-full px-3.5 py-2.5 rounded-xl border text-xs leading-relaxed
              focus:outline-none focus:border-[var(--color-secondary)]
              transition-all duration-150 pr-12
              ${
                disabled
                  ? "bg-white/95 backdrop-blur-xl border-slate-200 text-gray-500 cursor-not-allowed"
                  : "bg-white/95 backdrop-blur-xl border-slate-200 text-[var(--color-primary)] placeholder-gray-500 hover:border-slate-300"
              }
            `}
          />
          {/* Character counter */}
          {charCount > 0 && (
            <span
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium transition-colors ${
                isNearLimit ? "text-[var(--color-secondary)]" : "text-gray-500"
              }`}
            >
              {charCount}/{MAX_LENGTH}
            </span>
          )}
        </div>

        {/* Send button */}
        <button
          id="askacc-send"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className={`
            shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
            transition-all duration-200 cursor-pointer
            ${
              disabled || !value.trim()
                ? "bg-slate-50 border border-slate-200 text-gray-600 cursor-not-allowed"
                : "bg-[var(--color-secondary)] hover:bg-[#d44d18] text-[var(--color-primary)] shadow-[0_0_12px_rgba(21,135,212,0.35)] active:scale-95"
            }
          `}
        >
          <Send size={14} />
        </button>
      </div>

      {/* Hint + FAQ link */}
      <div className="flex items-center justify-between mt-2 px-1 text-[10px]">
        <p className="text-gray-500">
          Press <kbd className="bg-slate-50 border border-slate-200 px-1 py-0.5 rounded text-slate-500">Enter</kbd> to send
        </p>
        <Link
          to="/faq"
          className="flex items-center gap-1 font-bold text-[var(--color-secondary)] hover:underline transition-colors"
        >
          <ExternalLink size={10} />
          Browse all FAQs
        </Link>
      </div>
    </div>
  );
});

export default InputBar;
