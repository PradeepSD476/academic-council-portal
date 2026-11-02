// The Career Vault page header with the accent bar (Design §3), plus an optional action on the right.
export default function PageTitle({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-[3px] h-6 bg-[var(--color-secondary)] rounded-full shadow-[0_0_8px_var(--color-secondary)]" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)] tracking-tight break-words">{title}</h1>
        </div>
        {subtitle && <p className="text-slate-500 text-sm ml-4">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
