import React, { memo } from "react";
import { GraduationCap } from "lucide-react";

const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 px-1">
      {/* Bot avatar */}
      <div className="shrink-0 w-7 h-7 rounded-xl bg-slate-100 border border-[var(--color-secondary)]/40 flex items-center justify-center text-[var(--color-secondary)] shadow-[0_0_8px_rgba(21,135,212,0.2)]">
        <GraduationCap size={14} />
      </div>
      {/* Bubble */}
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-md">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)] block"
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
