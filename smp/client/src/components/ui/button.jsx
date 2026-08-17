import React from 'react';

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-red-600 hover:bg-red-700 text-white shadow-[0_4px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_25px_rgba(220,38,38,0.5)] border border-red-500/20',
    secondary: 'bg-zinc-100 dark:bg-neutral-800 hover:bg-zinc-200 dark:hover:bg-neutral-700 text-zinc-800 dark:text-white border border-zinc-200 dark:border-neutral-700/50',
    outline: 'border border-zinc-300 dark:border-neutral-700 bg-transparent hover:bg-zinc-100 dark:hover:bg-neutral-900 text-zinc-700 dark:text-neutral-300 hover:text-zinc-900 dark:hover:text-white',
    ghost: 'hover:bg-zinc-100 dark:hover:bg-neutral-900 text-zinc-700 dark:text-neutral-300 hover:text-zinc-900 dark:hover:text-white',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_4px_20px_rgba(244,63,94,0.3)]',
  };

  const sizes = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-6 text-base',
    lg: 'h-13 px-8 text-lg',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-5 w-5 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}
