import { NavLink } from "react-router-dom";

// Experiences | Jobs & Internships | Companies | Saved.
const TABS = [
  { to: "/dashboard/career-vault", label: "Experiences", end: true },
  { to: "/dashboard/career-vault/jobs", label: "Jobs & Internships" },
  { to: "/dashboard/career-vault/companies", label: "Companies" },
  { to: "/dashboard/career-vault/saved", label: "Saved" },
];

export default function CareerVaultTabs() {
  return (
    <nav aria-label="Career Vault sections" className="flex gap-1 p-1 rounded-xl bg-slate-100/80 border border-slate-200 w-fit max-w-full overflow-x-auto">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] ${isActive
            ? "bg-white border border-slate-200 shadow-xs text-slate-950 font-bold"
            : "border border-transparent text-slate-600 font-semibold hover:bg-white/80 hover:text-slate-950"}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
