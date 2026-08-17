import React, { forwardRef } from 'react';

export const Input = forwardRef(
  ({ label, error, className = '', type = 'text', ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-2 w-full">
        {label && (
          <label className="text-sm font-medium text-zinc-700 dark:text-neutral-300 tracking-wide">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={`w-full rounded-xl border bg-zinc-50 dark:bg-neutral-900/50 px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-neutral-500 outline-none transition-all duration-200 focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-neutral-500/50 ${
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-zinc-300 dark:border-neutral-800 hover:border-zinc-400 dark:hover:border-neutral-700 focus:border-indigo-500 dark:focus:border-neutral-500'
          } ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs font-medium text-rose-500 animate-fadeIn">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
