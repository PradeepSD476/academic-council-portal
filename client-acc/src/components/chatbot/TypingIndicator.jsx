/**
 * TypingIndicator – Animated 3-dot bounce indicating bot is thinking.
 */
import React, { memo } from "react";

const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 px-1">
      {/* Bot avatar */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
        A
      </div>
      {/* Bubble */}
      <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-blue-400 block"
              style={{
                animation: `typingBounce 1.2s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default TypingIndicator;
