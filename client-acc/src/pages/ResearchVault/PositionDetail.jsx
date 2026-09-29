import { useEffect, useState, createElement } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, BriefcaseBusiness, Calendar, CheckCircle2, Clock, ExternalLink, GraduationCap, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { researchVaultApi } from '../../api/researchVaultApi';

const deadlineInfo = (deadline) => {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (ms < 0) return { label: 'Deadline passed', cls: 'bg-slate-100 text-slate-500 border-slate-200', closed: true };
  if (days <= 7) return { label: days === 0 ? 'Closes today' : `${days} day${days === 1 ? '' : 's'} left`, cls: days <= 2 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200', closed: false };
  return { label: `Open · ${new Date(deadline).toLocaleDateString()}`, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', closed: false };
};

// Keep badge labels in sync with the Open Positions tab filter labels
// (index.jsx POSITION_TYPE_LABELS).
const POSITION_TYPE_LABELS = {
  RA: 'Research Assistant',
  INTERNSHIP: 'Internship',
  PROJECT: 'Project',
  FELLOWSHIP: 'Fellowship',
  SUMMER: 'Summer Research',
  THESIS: 'Thesis Slot',
  OTHER: 'Other',
};

const positionTypeLabel = (type) => {
  if (!type) return '';
  return POSITION_TYPE_LABELS[type] || type.replaceAll('_', ' ');
};

export default function PositionDetail() {
  const { positionId } = useParams();
  const navigate = useNavigate();
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    researchVaultApi.getPositionById(positionId)
      .then((response) => {
        if (active) setPosition(response.data?.data || null);
      })
      .catch(() => {
        if (active) setError('This position could not be found or is no longer listed.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [positionId]);

  const toggleBookmark = async () => {
    if (!position) return;
    try {
      if (position.bookmarked) {
        await researchVaultApi.unbookmarkPosition(position.id);
        setPosition({ ...position, bookmarked: false });
        toast.success('Removed from saved positions.');
      } else {
        await researchVaultApi.bookmarkPosition(position.id);
        setPosition({ ...position, bookmarked: true });
        toast.success('Position saved — see it under Following.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update bookmark.');
    }
  };

  if (loading) {
    return <div className="academic-card flex min-h-48 items-center justify-center rounded-3xl p-8 text-center text-sm text-slate-500">Loading position…</div>;
  }
  if (error || !position) {
    return (
      <div className="academic-card rounded-3xl p-10 text-center">
        <p className="text-sm text-slate-500">{error || 'Position not found.'}</p>
        <button type="button" onClick={() => navigate('/dashboard/research-vault?section=positions')} className="mt-4 rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900">Back to Open positions</button>
      </div>
    );
  }

  const urgency = deadlineInfo(position.deadline);
  const isBookmarked = Boolean(position.bookmarked);

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate('/dashboard/research-vault?section=positions')} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[var(--color-primary-accent)]">
        <ArrowLeft size={14} /> Back to Open positions
      </button>

      <article className="academic-card rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            {createElement(BriefcaseBusiness, { size: 11, className: 'mr-1' })}{positionTypeLabel(position.positionType)}
          </span>
          {urgency && <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${urgency.cls}`}>{urgency.label}</span>}
          {isBookmarked && <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">Saved</span>}
        </div>

        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">{position.title}</h1>

        {position.faculty && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
              {(position.faculty.name || 'F').split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">{position.faculty.name}</p>
              <p className="text-xs text-slate-500">{position.faculty.designation}{position.faculty.designation && position.faculty.department ? ' · ' : ''}{position.faculty.department}</p>
            </div>
            <Link
              to={`/dashboard/research-vault?section=faculty&search=${encodeURIComponent(position.faculty.name)}`}
              className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[var(--color-secondary)] hover:text-[var(--color-primary-accent)]"
            >
              <UserRound size={13} /> View faculty profile
            </Link>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600">
          {position.faculty?.department && <span className="inline-flex items-center gap-1"><GraduationCap size={13} /> {position.faculty.department}</span>}
          {position.deadline && <span className="inline-flex items-center gap-1"><Calendar size={13} /> Apply by {new Date(position.deadline).toLocaleDateString()}</span>}
        </div>

        {position.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{position.description}</p>
        )}

        {position.eligibility && (
          <section className="mt-5">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900"><CheckCircle2 size={15} className="text-emerald-700" /> Eligibility</h2>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-slate-700">{position.eligibility}</p>
          </section>
        )}

        {(position.applicationUrl || position.applicationInstructions) && (
          <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <h2 className="text-sm font-bold text-emerald-900">How to apply</h2>
            {position.applicationInstructions && <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-emerald-900/90">{position.applicationInstructions}</p>}
            {position.applicationUrl && (
              <a
                href={position.applicationUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                Apply now <ExternalLink size={14} />
              </a>
            )}
          </section>
        )}

        {position.researchAreas?.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {position.researchAreas.map(({ researchArea }) => (
              <span key={researchArea.id} className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-900">{researchArea.name}</span>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={toggleBookmark}
            aria-pressed={isBookmarked}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${isBookmarked ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:border-[var(--color-secondary)] hover:text-[var(--color-primary-accent)]'}`}
          >
            <Bookmark size={14} /> {isBookmarked ? 'Saved' : 'Save position'}
          </button>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Clock size={12} /> Posted {position.createdAt ? new Date(position.createdAt).toLocaleDateString() : ''}</span>
        </div>
      </article>
    </div>
  );
}
