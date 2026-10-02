// Small shared building blocks for the careers admin pages (styles follow the Career Vault pages).
import { useEffect } from "react";
import { X } from "lucide-react";

const STATUS_STYLES = {
  ACTIVE: "text-emerald-700 bg-emerald-50 border-emerald-100",
  CANDIDATE: "text-blue-700 bg-blue-50 border-blue-100",
  MERGED: "text-slate-600 bg-slate-100 border-slate-200",
};

export function StatusChip({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[status] || STATUS_STYLES.MERGED}`}>
      {status}
    </span>
  );
}

export function PageHeader({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-[3px] h-6 bg-[var(--color-secondary)] rounded-full shadow-[0_0_8px_var(--color-secondary)]" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)] tracking-tight flex items-center gap-2.5">
            {Icon && <Icon className="text-[var(--color-secondary)]" size={24} />} {title}
          </h1>
        </div>
        {subtitle && <p className="text-slate-500 text-sm ml-4">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start sm:self-auto">{children}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide = false }) {
  // Escape closes the dialog.
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/30 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`w-full ${wide ? "sm:max-w-3xl" : "sm:max-w-xl"} max-h-[90vh] flex flex-col bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-xl`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-[var(--color-primary)]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export const inputClass =
  "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[var(--color-primary)] placeholder-slate-400 bg-sky-50/50 focus:outline-none focus:border-[var(--color-secondary)] transition";

export const primaryButton =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-accent)] transition-colors disabled:opacity-50 cursor-pointer";

export const outlineButton =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer";

export const dangerButton =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-50 cursor-pointer";

export const cardClass = "rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-xs";

export function Skeleton({ rows = 5 }) {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}
