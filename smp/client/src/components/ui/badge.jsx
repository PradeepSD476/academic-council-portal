import React from 'react';

export function Badge({
  className = '',
  variant = 'primary',
  onRemove,
  children,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-all duration-200';

  const variants = {
    primary: 'bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25',
    secondary: 'bg-neutral-800 text-neutral-300 border border-neutral-700/50',
    success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded-full p-0.5 hover:bg-white/10 active:scale-95 transition-colors cursor-pointer"
        >
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
