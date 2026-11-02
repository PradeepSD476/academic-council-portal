// Icon + one line saying why it's empty + an action.
export default function EmptyState({ icon: Icon, title, detail, action, onAction }) {
  return (
    <div className="text-center py-14 px-6 bg-white/95 border border-slate-200 rounded-2xl shadow-xs">
      {Icon && (
        <div className="mx-auto mb-3 w-11 h-11 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400">
          <Icon size={20} aria-hidden="true" />
        </div>
      )}
      <p className="text-sm font-bold text-[var(--color-primary)]">{title}</p>
      {detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-[var(--color-secondary)] bg-[var(--color-secondary-light)] border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
        >
          {action}
        </button>
      )}
    </div>
  );
}
