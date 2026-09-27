import { createElement, useEffect, useState } from 'react';
import { Bookmark, BookOpen, BriefcaseBusiness, Check, CircleHelp, ExternalLink, FlaskConical, Search, Send, Sparkles, ThumbsUp, UserRoundPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { researchVaultApi } from '../../api/researchVaultApi';

const sections = [
  { id: 'faculty', label: 'Faculty', icon: FlaskConical },
  { id: 'experiences', label: 'Experiences', icon: BookOpen },
  { id: 'discussions', label: 'Q&A', icon: CircleHelp },
  { id: 'resources', label: 'Resources', icon: Bookmark },
  { id: 'positions', label: 'Open positions', icon: BriefcaseBusiness },
];

const responseData = (response) => response.data?.data || [];
const errorMessage = (error) => error.response?.data?.message || 'The request could not be completed.';

export default function ResearchVault() {
  const [section, setSection] = useState('faculty');
  const [areas, setAreas] = useState([]);
  const [items, setItems] = useState([]);
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [areaId, setAreaId] = useState('');
  const [openingsOnly, setOpeningsOnly] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [interest, setInterest] = useState({ department: '', subArea: '', projectType: '' });
  const [matches, setMatches] = useState([]);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    researchVaultApi.getAreas().then((response) => setAreas(responseData(response))).catch(() => {});
    researchVaultApi.getFaculty({ limit: 100 }).then((response) => setFacultyOptions(responseData(response))).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = { search, ...(areaId ? { areaId } : {}) };
    const request = section === 'faculty'
      ? researchVaultApi.getFaculty({ search, department, area: areas.find((area) => String(area.id) === areaId)?.slug, openings: openingsOnly ? 'true' : undefined })
      : section === 'experiences'
        ? researchVaultApi.getExperiences({ ...params, department })
        : section === 'discussions'
          ? researchVaultApi.getDiscussions(params)
          : section === 'resources'
            ? researchVaultApi.getResources(params)
            : researchVaultApi.getPositions({ search, department });
    request.then((response) => {
      if (active) setItems(responseData(response));
    }).catch((error) => {
      if (active) toast.error(errorMessage(error));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [section, search, department, areaId, areas, openingsOnly, refreshVersion]);

  const follow = async (kind, id) => {
    try {
      if (kind === 'faculty') await researchVaultApi.followFaculty(id);
      else await researchVaultApi.followArea(id);
      toast.success('Added to your follows.');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const findMatches = async (event) => {
    event.preventDefault();
    try {
      setMatches(responseData(await researchVaultApi.matchInterest(interest)));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const submitContent = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      if (section === 'experiences') {
        await researchVaultApi.submitExperience({ ...data, facultyId: data.facultyId || null, researchAreaIds: data.researchAreaIds ? [Number(data.researchAreaIds)] : [] });
        toast.success('Experience submitted for review.');
      } else {
        await researchVaultApi.submitDiscussion({ ...data, researchAreaIds: data.researchAreaIds ? [Number(data.researchAreaIds)] : [] });
        toast.success('Question posted.');
      }
      setFormOpen(false);
      form.reset();
      setRefreshVersion((version) => version + 1);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const reply = async (discussionId, content) => {
    try {
      await researchVaultApi.replyToDiscussion(discussionId, { content });
      toast.success('Reply added.');
      setRefreshVersion((version) => version + 1);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const vote = async (discussionId) => {
    try {
      await researchVaultApi.voteDiscussion(discussionId);
      setItems((current) => current.map((item) => item.id === discussionId ? { ...item, _count: { ...item._count, votes: (item._count?.votes || 0) + 1 } } : item));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="research-vault-theme mx-auto max-w-7xl space-y-6 pb-12 text-slate-900">
      <header className="border-b border-slate-200 pb-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="accent-bar h-6 rounded-full shadow-[0_0_8px_var(--color-secondary-glow)]" />
              <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-[var(--color-primary)] md:text-3xl"><FlaskConical size={26} className="text-[var(--color-secondary)]" /> Research Vault</h1>
            </div>
            <p className="ml-4 text-sm text-slate-500">Find a research group, learn from student experiences, and get practical guidance for your next step.</p>
          </div>
          {(section === 'experiences' || section === 'discussions') && (
            <button onClick={() => setFormOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95">
              <Send size={16} /> {section === 'experiences' ? 'Share an experience' : 'Ask a question'}
            </button>
          )}
        </div>
      </header>

      <nav className="vault-tabs flex items-center gap-2 overflow-x-auto px-1 pb-1 scrollbar-none" aria-label="Research Vault sections">
        {sections.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setSection(id); setSearch(''); setAreaId(''); }} className={`inline-flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-bold whitespace-nowrap transition-all duration-200 ${section === id ? 'is-active bg-[var(--color-secondary)] text-white shadow-[0_4px_16px_var(--color-secondary-glow)] scale-[1.02]' : 'border-slate-200 bg-white/95 text-slate-500 shadow-xs hover:border-slate-300 hover:bg-white/90 hover:text-[var(--color-primary)]'}`}>
            {createElement(Icon, { size: 16 })} {label}
          </button>
        ))}
      </nav>

      <div className="vault-toolbar flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-xl sm:p-4 md:flex-row md:items-center">
        <label className="relative min-w-0 flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${section}...`} className="w-full rounded-xl border border-slate-200 bg-white/90 py-2.5 pl-10 pr-3 text-xs text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)]" />
        </label>
        {(section === 'faculty' || section === 'experiences' || section === 'positions') && (
          <input value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Department" className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)] sm:w-56" />
        )}
        {section === 'faculty' && <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-semibold text-slate-700"><input type="checkbox" checked={openingsOnly} onChange={(event) => setOpeningsOnly(event.target.checked)} className="accent-emerald-800" /> Current openings</label>}
        {section !== 'positions' && (
          <select value={areaId} onChange={(event) => setAreaId(event.target.value)} className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)] sm:w-56">
            <option value="">All research areas</option>
            {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
          </select>
        )}
      </div>

      {section === 'faculty' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <VaultList loading={loading} empty="No faculty profiles match these filters.">
            {items.map((faculty) => <article key={faculty.id} className="border-b border-slate-200 py-5 first:pt-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-lg font-bold text-slate-950">{faculty.name}</h2><p className="mt-1 text-sm text-slate-600">{faculty.designation}{faculty.designation && faculty.department ? ' · ' : ''}{faculty.department}</p></div>
                <button onClick={() => follow('faculty', faculty.id)} title={`Follow ${faculty.name}`} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-700 hover:text-emerald-800"><UserRoundPlus size={15} /> Follow</button>
              </div>
              {faculty.biography && <p className="mt-3 text-sm leading-6 text-slate-700">{faculty.biography}</p>}
              <TagList areas={faculty.researchAreas?.map((entry) => entry.researchArea) || []} onFollow={follow} />
              {faculty.positions?.length > 0 && <p className="mt-3 text-xs font-semibold text-emerald-800">{faculty.positions.length} current opening{faculty.positions.length === 1 ? '' : 's'}</p>}
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">{faculty.email && <a className="hover:text-emerald-800" href={`mailto:${faculty.email}`}>{faculty.email}</a>}{faculty.website && <a className="inline-flex items-center gap-1 hover:text-emerald-800" href={faculty.website} target="_blank" rel="noreferrer">Faculty website <ExternalLink size={12} /></a>}</div>
              {faculty.publications && <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold text-slate-700">Publications and work</summary><p className="mt-2 whitespace-pre-wrap text-slate-600">{faculty.publications}</p></details>}
            </article>)}</VaultList>
          <aside className="self-start rounded-3xl border-2 border-[var(--color-secondary)]/30 bg-gradient-to-b from-white/95 via-sky-50/25 to-blue-50/35 p-5 shadow-[0_12px_35px_rgba(11,30,63,0.06)]">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-950"><Sparkles size={16} /> Find a research match</p>
            <p className="mt-2 text-xs leading-5 text-slate-600">Tell us what you want to explore and we’ll suggest relevant faculty.</p>
            <form onSubmit={findMatches} className="mt-4 space-y-3">
              <input value={interest.department} onChange={(event) => setInterest({ ...interest, department: event.target.value })} placeholder="Department" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
              <input value={interest.subArea} onChange={(event) => setInterest({ ...interest, subArea: event.target.value })} placeholder="Research area" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
              <select value={interest.projectType} onChange={(event) => setInterest({ ...interest, projectType: event.target.value })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">Project type</option><option>Summer research</option><option>Thesis</option><option>Reading project</option><option>RA-ship</option></select>
              <button className="w-full rounded-md bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900">Show matches</button>
            </form>
            {matches.length > 0 && <div className="mt-4 border-t border-emerald-200 pt-3">{matches.map((match) => <p key={match.id} className="py-1 text-sm font-semibold text-slate-800">{match.name}<span className="block text-xs font-normal text-slate-500">{match.department}</span></p>)}</div>}
          </aside>
        </div>
      )}

      {section === 'experiences' && <VaultList loading={loading} empty="No published experiences yet.">{items.map((experience) => <article key={experience.id} className="border-b border-slate-200 py-5 first:pt-1"><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="text-lg font-bold">{experience.title}</h2><span className="text-xs text-slate-500">{experience.faculty?.name || experience.guideName || 'Student contributor'}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{experience.description}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">{experience.labName && <span>Lab: {experience.labName}</span>}{experience.duration && <span>Duration: {experience.duration}</span>}{experience.outcome && <span>Outcome: {experience.outcome}</span>}</div>{experience.keyLearnings && <p className="mt-2 text-sm text-slate-600"><strong>Key learnings:</strong> {experience.keyLearnings}</p>}<TagList areas={experience.researchAreas?.map((entry) => entry.researchArea) || []} onFollow={follow} /></article>)}</VaultList>}

      {section === 'discussions' && <VaultList loading={loading} empty="No discussions found.">{items.map((discussion) => <DiscussionItem key={discussion.id} discussion={discussion} onReply={reply} onVote={vote} onFollow={follow} />)}</VaultList>}

      {section === 'resources' && <VaultList loading={loading} empty="No resources found.">{items.map((resource) => <article key={resource.id} className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 py-5 first:pt-1"><div><p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">{resource.resourceType?.replaceAll('_', ' ')}</p><h2 className="mt-1 text-lg font-bold">{resource.title}</h2>{resource.description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{resource.description}</p>}<TagList areas={resource.researchAreas?.map((entry) => entry.researchArea) || []} onFollow={follow} /></div><a href={resource.url || resource.filePath} target="_blank" rel="noreferrer" onClick={() => { researchVaultApi.trackResourceView(resource.id).catch(() => {}); if (resource.filePath) researchVaultApi.trackResourceDownload(resource.id).catch(() => {}); }} className="inline-flex shrink-0 items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-700 hover:text-emerald-800">Open <ExternalLink size={15} /></a></article>)}</VaultList>}

      {section === 'positions' && <VaultList loading={loading} empty="No open research positions right now.">{items.map((position) => <article key={position.id} className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 py-5 first:pt-1"><div><p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">{position.positionType?.replaceAll('_', ' ')}</p><h2 className="mt-1 text-lg font-bold">{position.title}</h2><p className="mt-1 text-sm text-slate-600">{position.faculty?.name}{position.faculty?.department ? ` · ${position.faculty.department}` : ''}</p>{position.description && <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-700">{position.description}</p>}{position.deadline && <p className="mt-2 text-xs text-slate-500">Apply by {new Date(position.deadline).toLocaleDateString()}</p>}</div>{position.applicationUrl && <a href={position.applicationUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 rounded-md bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900">Details <ExternalLink size={15} /></a>}</article>)}</VaultList>}

      {formOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="vault-form-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-md bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h2 id="vault-form-title" className="text-xl font-bold">{section === 'experiences' ? 'Share a research experience' : 'Ask the community'}</h2><button onClick={() => setFormOpen(false)} aria-label="Close" className="rounded p-2 text-slate-500 hover:bg-slate-100">×</button></div><form onSubmit={submitContent} className="mt-5 space-y-3"><input name="title" required placeholder={section === 'experiences' ? 'Experience title' : 'Question title'} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" />{section === 'experiences' && <><input name="labName" placeholder="Lab name" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /><input name="guideName" placeholder="Faculty guide" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /><input name="duration" placeholder="Duration" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /><input name="prerequisites" placeholder="Prerequisites" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /><input name="keyLearnings" placeholder="Key learnings" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /></>}<textarea name={section === 'experiences' ? 'description' : 'content'} required rows={5} placeholder={section === 'experiences' ? 'What did you work on and what should others know?' : 'Write your question or details. Markdown is supported.'} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" />{section === 'experiences' && <input name="outcome" placeholder="Outcome" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" />}<select name="researchAreaIds" defaultValue="" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="">Research area (optional)</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select>{section === 'experiences' && <select name="facultyId" defaultValue="" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="">Faculty member (optional)</option>{facultyOptions.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}</select>}<div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setFormOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button><button className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white">Submit</button></div></form></section></div>}
    </div>
  );
}

function VaultList({ loading, empty, children }) {
  if (loading) return <div className="academic-card flex min-h-48 items-center justify-center rounded-3xl p-8 text-center text-sm text-slate-500">Loading Research Vault...</div>;
  if (!children || (Array.isArray(children) && children.length === 0)) return <div className="academic-card flex min-h-48 items-center justify-center rounded-3xl p-8 text-center text-sm text-slate-500">{empty}</div>;
  return <div className="space-y-4">{children}</div>;
}

function TagList({ areas, onFollow }) {
  if (!areas?.length) return null;
  return <div className="mt-3 flex flex-wrap gap-2">{areas.map((area) => <button key={area.id} onClick={() => onFollow('area', area.id)} title={`Follow ${area.name}`} className="rounded-sm border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100">{area.name}</button>)}</div>;
}

function DiscussionItem({ discussion, onReply, onVote, onFollow }) {
  const [replyText, setReplyText] = useState('');
  return <article className="border-b border-slate-200 py-5 first:pt-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">{discussion.title}</h2>{discussion.isResolved && <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-900"><Check size={12} /> Resolved</span>}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{discussion.content}</p><p className="mt-2 text-xs text-slate-500">{discussion.uploadedBy?.displayName || 'ACC student'}{discussion.uploadedBy?.role === 'FACULTY' ? ' · Verified faculty' : ''}</p><TagList areas={discussion.researchAreas?.map((entry) => entry.researchArea) || []} onFollow={onFollow} /><div className="mt-3 flex items-center gap-4"><button onClick={() => onVote(discussion.id)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-800"><ThumbsUp size={14} /> {discussion._count?.votes || 0}</button><span className="text-xs text-slate-500">{discussion._count?.replies || 0} replies</span></div>{discussion.replies?.map((entry) => <div key={entry.id} className="ml-4 mt-3 border-l-2 border-slate-200 pl-3"><p className="text-sm text-slate-700">{entry.content}</p><p className="mt-1 text-[11px] text-slate-500">{entry.uploadedBy?.displayName || 'ACC student'}{entry.uploadedBy?.role === 'FACULTY' ? ' · Verified faculty' : ''}</p>{entry.replies?.map((child) => <p key={child.id} className="mt-2 text-sm text-slate-600">↳ {child.content}</p>)}</div>)}<form onSubmit={(event) => { event.preventDefault(); if (replyText.trim()) { onReply(discussion.id, replyText); setReplyText(''); } }} className="mt-3 flex gap-2"><input value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="Add a reply" className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" /><button aria-label="Send reply" className="rounded-md bg-slate-900 px-3 text-white"><Send size={15} /></button></form></article>;
}