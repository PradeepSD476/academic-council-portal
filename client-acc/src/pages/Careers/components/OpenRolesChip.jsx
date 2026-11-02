import { Link } from "react-router-dom";
import { Briefcase } from "lucide-react";

// On a Career Vault experience card: "3 open roles at Google →" (or "Google →" when none are open),
// linking to the company page. Stops the click so the card doesn't also expand.
export default function OpenRolesChip({ company, count }) {
  return (
    <Link
      to={`/dashboard/career-vault/companies/${company.slug}`}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border text-teal-700 bg-teal-50 border-teal-100 hover:bg-teal-100 transition-colors"
    >
      <Briefcase size={11} aria-hidden="true" />
      {count > 0 ? `${count} open role${count === 1 ? "" : "s"} at ${company.name} →` : `${company.name} →`}
    </Link>
  );
}
