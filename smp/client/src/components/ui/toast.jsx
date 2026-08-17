import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = 'info', duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, title, description, variant }]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Portal/Container */}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex flex-col p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 scale-100 hover:scale-[1.02] ${
              t.variant === 'error'
                ? 'bg-rose-950/80 border-rose-800 text-rose-200'
                : t.variant === 'success'
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
                : 'bg-neutral-900/95 border-neutral-800 text-neutral-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="font-bold text-sm">{t.title}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {t.description && (
              <span className="text-xs text-neutral-300 mt-1 leading-relaxed">
                {t.description}
              </span>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
