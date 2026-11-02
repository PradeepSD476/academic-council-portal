// A posting's review status as a small chip (LIVE emerald · PENDING amber · EXPIRED slate · REJECTED rose).
const STATUS_STYLE = {
  PENDING_REVIEW: "text-amber-800 bg-amber-50 border-amber-100",
  LIVE: "text-emerald-700 bg-emerald-50 border-emerald-100",
  EXPIRED: "text-slate-600 bg-slate-100 border-slate-200",
  REJECTED: "text-rose-700 bg-rose-50 border-rose-100",
};

export default function PostingStatusChip({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[status] ?? STATUS_STYLE.EXPIRED}`}>
      {status.replace("_", " ")}
    </span>
  );
}
