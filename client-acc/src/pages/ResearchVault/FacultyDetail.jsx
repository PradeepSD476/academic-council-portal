import { createElement, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, BriefcaseBusiness, Calendar, Clock, ExternalLink,
  GraduationCap, Linkedin, Mail, MapPin, UserRound, Globe,
} from 'lucide-react';
import { researchVaultApi } from '../../api/researchVaultApi';

// Keep labels in sync with index.jsx / PositionDetail.jsx
const POSITION_TYPE_LABELS = {
  RA: 'Research Assistant', INTERNSHIP: 'Internship', PROJECT: 'Project',
  FELLOWSHIP: 'Fellowship', SUMMER: 'Summer Research', THESIS: 'Thesis Slot',
  SUMMER_RESEARCH: 'Summer Research', READING_PROJECT: 'Reading Project',
  RA_SHIP: 'Research Assistantship', PHD: 'PhD Position', PHD_ASSIST: 'PhD Assistantship',
  OTHER: 'Other',
};
const positionTypeLabel = (type) => (type ? (POSITION_TYPE_LABELS[type] || type.replaceAll('_', ' ')) : '');

const deadlineInfo = (opening) => {
  if (!opening.deadline) return null;
  const ms = new Date(opening.deadline).getTime() - Date.now();
  const days = Math.ceil(ms / 86400000);
  if (ms < 0) return { label: 'Deadline passed', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
  if (days <= 7) return { label: days === 0 ? 'Closes today' : `Closes in ${days} day${days === 1 ? '' : 's'}`, cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: `Apply by ${new Date(opening.deadline).toLocaleDateString()}`, cls: 'bg-blue-50 text-blue-700 border-blue-200' };
};

const LINKS = [
  { key: 'email', icon: Mail, label: 'Email', href: (v) => `mailto:${v}` },
  { key: 'website', icon: Globe, label: 'Lab / Dept website', href: (v) => v },
  { key: 'personalWebsiteUrl', icon: UserRound, label: 'Personal website', href: (v) => v },
  { key: 'googleScholarUrl', icon: BookOpen, label: 'Google Scholar', href: (v) => v },
  { key: 'linkedinUrl', icon: Linkedin, label: 'LinkedIn', href: (v) => v },
];

export default function FacultyDetail() {
  const { facultyId } = useParams();
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    researchVaultApi.getFacultyProfileById(facultyId)
      .then((response) => { if (active) setFaculty(response.data?.data || null); })
      .catch(() => { if (active) setError('This faculty profile could not be found.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [facultyId]);

  // Open openings first (soonest deadline first), then closed below the divider.
  const { openOpenings, closedOpenings } = useMemo(() => {
    const list = faculty?.positions || [];
    const open = list.filter((o) => o.computedStatus === 'OPEN')
      .sort((a, b) => (a.deadline ? new Date(a.deadline) : Infinity) - (b.deadline ? new Date(b.deadline) : Infinity));
    const closed = list.filter((o) => o.computedStatus !== 'OPEN');
    return { openOpenings: open, closedOpenings: closed };
  }, [faculty]);

  if (loading) {
    return <div className="academic-card flex min-h-48 items-center justify-center rounded-3xl p-8 text-center text-sm text-slate-500">Loading profile…</div>;
  }
  if (error || !faculty) {
    return (
      <div className="academic-card rounded-3xl p-10 text-center">
        <p className="text-sm text-slate-500">{error || 'Faculty profile not found.'}</p>
        <button type="button" onClick={() => navigate('/dashboard/research-vault?section=faculty')} className="mt-4 rounded-full bg-[var(--color-secondary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-accent)]">Back to Faculty</button>
      </div>
    );
  }

  const availableLinks = LINKS.filter(({ key }) => Boolean(faculty[key]));

  const openingCard = (opening, closed = false) => {
    const dl = deadlineInfo(opening);
    const seatsTotal = opening.positionsAvailable ?? 1;
    const seatsFilled = opening.positionsFilled ?? 0;
    const seatsLabel = seatsFilled > 0
      ? `${seatsFilled} of ${seatsTotal} filled`
      : seatsTotal === 1 ? '1 position available' : `${seatsTotal} positions available`;
    const applyUrl = opening.howToApply && /^https?:\/\//.test(opening.howToApply) ? opening.howToApply : null;
    return (
      <article key={opening.id} className={`rounded-2xl border p-4 ${closed ? 'border-slate-200 bg-slate-50/60 opacity-80' : 'border-slate-200 bg-white/95 shadow-sm'}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${closed ? 'border-slate-200 bg-slate-100 text-slate-500' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
            {closed ? 'Closed' : 'Open'}
          </span>
          {opening.positionType && (
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-800">
              {positionTypeLabel(opening.positionType)}
            </span>
          )}
          {opening.researchAreas?.map(({ researchArea }) => (
            <span key={researchArea.id} className="rounded-full border border-[var(--color-secondary-border)] bg-[var(--color-secondary-light)] px-2 py-0.5 text-[11px] font-semibold text-blue-900">{researchArea.name}</span>
          ))}
          {dl && <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${dl.cls}`}>{dl.label}</span>}
        </div>
        <h3 className={`mt-2 text-base font-bold ${closed ? 'text-slate-500' : 'text-slate-950'}`}>{opening.title}</h3>
        <p className="text-xs font-semibold text-slate-600">{seatsLabel}</p>

        {opening.description && <p className="mt-2 text-sm leading-6 text-slate-700">{opening.description}</p>}

        {opening.eligibility && (
          <div className="mt-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Eligibility</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{opening.eligibility}</p>
          </div>
        )}
        {opening.requirements && (
          <div className="mt-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Requirements</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{opening.requirements}</p>
          </div>
        )}

        {(opening.howToApply || opening.applicationUrl) && !closed && (
          <div className="mt-3 rounded-xl border border-[var(--color-secondary-border)] bg-[var(--color-secondary-light)] p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-900">How to apply</p>
            {applyUrl ? (
              <a href={applyUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary-accent)] hover:underline">
                Apply now <ExternalLink size={13} />
              </a>
            ) : (
              <p className="mt-1 text-sm leading-6 text-blue-900/90">{opening.howToApply}</p>
            )}
            {!applyUrl && opening.applicationUrl && (
              <a href={opening.applicationUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary-accent)] hover:underline">
                Application form <ExternalLink size={13} />
              </a>
            )}
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate('/dashboard/research-vault?section=faculty')} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[var(--color-primary-accent)]">
        <ArrowLeft size={14} /> Back to Faculty
      </button>

      {/* Header */}
      <article className="academic-card rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-xl font-bold text-white">
            {faculty.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">{faculty.name}</h1>
            <p className="mt-0.5 text-sm text-slate-600">{[faculty.designation, faculty.department].filter(Boolean).join(' · ')}</p>
            {faculty.officeLocation && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500"><MapPin size={13} /> {faculty.officeLocation}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(faculty.researchAreas || []).map(({ researchArea }) => (
                <span key={researchArea.id} className="rounded-full border border-[var(--color-secondary-border)] bg-[var(--color-secondary-light)] px-2 py-1 text-[11px] font-semibold text-blue-900">{researchArea.name}</span>
              ))}
            </div>
          </div>
        </div>

        {faculty.biography && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">About</p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-slate-700">{faculty.biography}</p>
          </div>
        )}

        {availableLinks.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {availableLinks.map(({ key, icon, label, href }) => (
              <a key={key} href={href(faculty[key])} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[var(--color-secondary)] hover:text-[var(--color-primary-accent)]">
                {createElement(icon, { size: 13 })} {label}
              </a>
            ))}
          </div>
        )}
      </article>

      {/* Openings */}
      <section aria-label="Openings">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <BriefcaseBusiness size={18} className="text-[var(--color-secondary)]" />
          Open positions ({openOpenings.length})
        </h2>
        {openOpenings.length === 0 && closedOpenings.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-slate-200 bg-white/95 p-6 text-center text-sm text-slate-500 shadow-sm">No openings posted yet.</p>
        ) : (
          <>
            <div className="mt-3 space-y-3">
              {openOpenings.length > 0
                ? openOpenings.map((o) => openingCard(o))
                : <p className="rounded-2xl border border-slate-200 bg-white/95 p-4 text-center text-xs text-slate-500 shadow-sm">No open positions right now.</p>}
            </div>
            {closedOpenings.length > 0 && (
              <>
                <div className="my-4 flex items-center gap-3" role="separator">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Closed positions</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="space-y-3">{closedOpenings.map((o) => openingCard(o, true))}</div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
