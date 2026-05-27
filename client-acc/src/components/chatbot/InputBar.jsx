/**
 * InputBar – Chat input with send button.
 *
 * Features:
 * - Enter to send
 * - Disabled during typing / loading
 * - Character count
 * - Animated send button
 * - Keyboard shortcut hint
 */
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
    <div className="border-t border-gray-100 bg-white p-3">
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
              w-full px-3.5 py-2.5 rounded-xl border text-sm leading-relaxed
              focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400
              transition-all duration-150 pr-12
              ${
                disabled
                  ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-50 border-gray-200 text-gray-800 hover:border-gray-300"
              }
            `}
          />
          {/* Character counter */}
          {charCount > 0 && (
            <span
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium transition-colors ${
                isNearLimit ? "text-amber-500" : "text-gray-300"
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
            flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
            transition-all duration-200 shadow-sm
            ${
              disabled || !value.trim()
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-md active:scale-95"
            }
          `}
        >
          <Send size={15} />
        </button>
      </div>

      {/* Hint + FAQ link */}
      <div className="flex items-center justify-between mt-1.5 px-1">
        <p className="text-[10px] text-gray-400">
          Press <kbd className="bg-gray-100 px-1 rounded text-gray-500">Enter</kbd> to send
        </p>
        <Link
          to="/faq"
          className="flex items-center gap-1 text-[10px] font-semibold text-blue-500 hover:text-blue-700 transition-colors"
        >
          <ExternalLink size={9} />
          Browse all FAQs
        </Link>
      </div>
    </div>
  );
});

export default InputBar;
