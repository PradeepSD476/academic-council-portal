import { createElement, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Bookmark, BookOpen, BookSearch, BriefcaseBusiness, Check, CheckCircle2, CircleHelp, ExternalLink, FlaskConical, Search, Send, ThumbsUp, UserRoundCheck, UserRoundPlus, UsersRound, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthContext from '../../context/auth/authContext';
import { researchVaultApi } from '../../api/researchVaultApi';

const sections = [
  { id: 'faculty', label: 'Faculty', icon: FlaskConical },
  { id: 'experiences', label: 'Experiences', icon: BookOpen },
  { id: 'discussions', label: 'Discussion', icon: CircleHelp },
  { id: 'resources', label: 'Resources', icon: Bookmark },
  { id: 'positions', label: 'Open positions', icon: BriefcaseBusiness },
  { id: 'following', label: 'Following', icon: Activity },
];

const responseData = (response) => response.data?.data || [];
const errorMessage = (error) => error.response?.data?.message || 'The request could not be completed.';

export default function ResearchVault() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [section, setSection] = useState('faculty');
  const [areas, setAreas] = useState([]);
  const [items, setItems] = useState([]);
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [followedFacultyIds, setFollowedFacultyIds] = useState(() => new Set());
  const [followedAreaIds, setFollowedAreaIds] = useState(() => new Set());
  const [pendingUnfollow, setPendingUnfollow] = useState(null);
  const [search, setSearch] = useState('');
  const [discussionStatus, setDiscussionStatus] = useState('all');
  const [department, setDepartment] = useState('');
  const [areaId, setAreaId] = useState('');
  const [areaSearch, setAreaSearch] = useState('');
  const [areaPickerOpen, setAreaPickerOpen] = useState(false);
  const areaPickerRef = useRef(null);
  const [openingsOnly, setOpeningsOnly] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [interest, setInterest] = useState({ department: '', subArea: '', projectType: '' });
  const [matches, setMatches] = useState([]);
  const [matchSearched, setMatchSearched] = useState(false);
  const [matching, setMatching] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    researchVaultApi.getAreas().then((response) => setAreas(responseData(response))).catch(() => {});
    researchVaultApi.getFaculty({ limit: 100 }).then((response) => setFacultyOptions(responseData(response))).catch(() => {});
    researchVaultApi.getFollows().then(({ data }) => {
      setFollowedFacultyIds(new Set(data.data?.facultyIds || []));
      setFollowedAreaIds(new Set(data.data?.areaIds || []));
    }).catch((error) => toast.error(errorMessage(error)));
  }, []);

  useEffect(() => {
    const closeOnOutsidePointer = (event) => {
      if (!areaPickerRef.current?.contains(event.target)) setAreaPickerOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
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
            ? researchVaultApi.getDiscussions({
              ...params,
              ...(discussionStatus === 'needs-reply' ? { unanswered: 'true' } : {}),
              ...(discussionStatus === 'resolved' ? { resolved: 'true' } : {})
            })
          : section === 'resources'
            ? researchVaultApi.getResources(params)
            : section === 'positions'
              ? researchVaultApi.getPositions({ search, department })
              : researchVaultApi.getFollowingUpdates();
    request.then((response) => {
      if (active) setItems(responseData(response));
    }).catch((error) => {
      if (active) toast.error(errorMessage(error));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [section, search, discussionStatus, department, areaId, areas, openingsOnly, refreshVersion]);

  const follow = async (kind, id, name = '') => {
    const numericId = Number(id);
    const isFaculty = kind === 'faculty';
    const followingSet = isFaculty ? followedFacultyIds : followedAreaIds;
    const isFollowing = followingSet.has(numericId);
    if (isFollowing) {
      setPendingUnfollow({ kind, id: numericId, name });
      return;
    }

    try {
      if (isFaculty) {
        await researchVaultApi.followFaculty(numericId);
      } else {
        await researchVaultApi.followArea(numericId);
      }

      const updateFollowed = isFaculty ? setFollowedFacultyIds : setFollowedAreaIds;
      updateFollowed((current) => {
        const next = new Set(current);
        next.add(numericId);
        return next;
      });
      setRefreshVersion((version) => version + 1);
      toast.success(`You're now following ${name || 'this research item'}.`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const confirmUnfollow = async () => {
    if (!pendingUnfollow) return;
    const { kind, id, name } = pendingUnfollow;
    try {
      if (kind === 'faculty') await researchVaultApi.unfollowFaculty(id);
      else await researchVaultApi.unfollowArea(id);
      const updateFollowed = kind === 'faculty' ? setFollowedFacultyIds : setFollowedAreaIds;
      updateFollowed((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      setRefreshVersion((version) => version + 1);
      toast.success(`Unfollowed ${name || 'research item'}.`);
      setPendingUnfollow(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const findMatches = async (event) => {
    event.preventDefault();
    setMatching(true);
    try {
      setMatches(responseData(await researchVaultApi.matchInterest(interest)));
      setMatchSearched(true);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setMatching(false);
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

  const acceptAnswer = async (discussionId, replyId) => {
    try {
      await researchVaultApi.acceptDiscussionReply(discussionId, replyId);
      toast.success('Answer accepted. Discussion marked resolved.');
      setRefreshVersion((version) => version + 1);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const vote = async (discussionId) => {
    try {
      const { data } = await researchVaultApi.voteDiscussion(discussionId);
      setItems((current) => current.map((item) => item.id === discussionId
        ? { ...item, voteCount: data.data.voteCount, hasVoted: data.data.hasVoted }
        : item));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="research-vault-theme mx-auto max-w-7xl space-y-6 pb-12 text-slate-900">
      <header>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="accent-bar h-6 rounded-full shadow-[0_0_8px_var(--color-secondary)]" />
              <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-[var(--color-primary)] md:text-3xl"><BookSearch size={26} className="text-[var(--color-secondary)]" /> Research Vault</h1>
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
          <button key={id} onClick={() => { if (id === 'discussions') { navigate('/dashboard/research-vault/questions'); return; } setSection(id); setItems([]); setLoading(true); setSearch(''); setDiscussionStatus('all'); setAreaId(''); setAreaSearch(''); setAreaPickerOpen(false); }} className={`inline-flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-bold whitespace-nowrap transition-all duration-200 ${section === id ? 'is-active bg-[var(--color-secondary)] text-white shadow-[0_4px_16px_var(--color-secondary-glow)] scale-[1.02]' : 'border-slate-200 bg-white/95 text-slate-500 shadow-xs hover:border-slate-300 hover:bg-white/90 hover:text-[var(--color-primary)]'}`}>
            {createElement(Icon, { size: 16 })} {label}
          </button>
        ))}
      </nav>

      <div className="vault-toolbar flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-xl sm:p-4 md:flex-row md:items-center">
        <label className="relative min-w-0 flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${section}...`} className="w-full rounded-xl border border-slate-200 bg-white/90 py-2.5 pl-10 pr-3 text-xs text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)]" />
        </label>
        {section === 'discussions' && <select value={discussionStatus} onChange={(event) => setDiscussionStatus(event.target.value)} aria-label="Filter discussions by status" className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)] sm:w-48"><option value="all">All discussions</option><option value="needs-reply">Needs a reply</option><option value="resolved">Resolved</option></select>}
        {(section === 'faculty' || section === 'experiences' || section === 'positions') && (
          <input value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Department" className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)] sm:w-56" />
        )}
        {section === 'faculty' && <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-semibold text-slate-700"><input type="checkbox" checked={openingsOnly} onChange={(event) => setOpeningsOnly(event.target.checked)} className="accent-emerald-800" /> Current openings</label>}
        {section !== 'positions' && (
          <div ref={areaPickerRef} className="relative sm:w-56">
            <input
              role="combobox"
              aria-label="Search research areas"
              aria-expanded={areaPickerOpen}
              aria-controls="research-area-options"
              aria-autocomplete="list"
              value={areaId ? areas.find((area) => String(area.id) === areaId)?.name || areaSearch : areaSearch}
              onFocus={() => setAreaPickerOpen(true)}
              onChange={(event) => { setAreaSearch(event.target.value); setAreaId(''); setAreaPickerOpen(true); }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setAreaPickerOpen(false);
                if (event.key === 'Enter' && areaPickerOpen) {
                  event.preventDefault();
                  const firstMatch = areas.filter((area) => `${area.name} ${area.description || ''}`.toLowerCase().includes(areaSearch.trim().toLowerCase()))[0];
                  if (firstMatch) {
                    setAreaId(String(firstMatch.id));
                    setAreaSearch(firstMatch.name);
                    setAreaPickerOpen(false);
                  }
                }
              }}
              placeholder="All research areas"
              className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)]"
            />
            {areaId && <button type="button" aria-label="Clear research area filter" onClick={() => { setAreaId(''); setAreaSearch(''); setAreaPickerOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900">×</button>}
            {areaPickerOpen && <div id="research-area-options" role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
              <button type="button" role="option" aria-selected={!areaId} onClick={() => { setAreaId(''); setAreaSearch(''); setAreaPickerOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-[var(--color-primary-accent)]">All research areas</button>
              {areas.filter((area) => `${area.name} ${area.description || ''}`.toLowerCase().includes(areaSearch.trim().toLowerCase())).slice(0, 8).map((area) => <button type="button" role="option" aria-selected={String(area.id) === areaId} key={area.id} onClick={() => { setAreaId(String(area.id)); setAreaSearch(area.name); setAreaPickerOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-700 hover:bg-blue-50 hover:text-[var(--color-primary-accent)]">{area.name}</button>)}
              {areaSearch.trim() && areas.every((area) => !`${area.name} ${area.description || ''}`.toLowerCase().includes(areaSearch.trim().toLowerCase())) && <p className="px-3 py-2 text-xs text-slate-500">No matching areas. Try another term or clear the filter.</p>}
            </div>}
          </div>
        )}
      </div>

      {section === 'faculty' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <VaultList loading={loading} empty="No faculty profiles match these filters.">
            {items.map((faculty) => <article key={faculty.id} className="border-b border-slate-200 py-5 first:pt-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-lg font-bold text-slate-950">{faculty.name}</h2><p className="mt-1 text-sm text-slate-600">{faculty.designation}{faculty.designation && faculty.department ? ' · ' : ''}{faculty.department}</p></div>
                <button onClick={() => follow('faculty', faculty.id, faculty.name)} aria-pressed={followedFacultyIds.has(faculty.id)} title={followedFacultyIds.has(faculty.id) ? `Unfollow ${faculty.name}` : `Follow ${faculty.name}`} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[var(--color-secondary)] hover:text-[var(--color-primary-accent)]">{followedFacultyIds.has(faculty.id) ? <><UserRoundCheck size={15} /> Following</> : <><UserRoundPlus size={15} /> Follow</>}</button>
              </div>
              {faculty.biography && <p className="mt-3 text-sm leading-6 text-slate-700">{faculty.biography}</p>}
              <TagList areas={faculty.researchAreas?.map((entry) => entry.researchArea) || []} onFollow={follow} followedAreaIds={followedAreaIds} />
              {faculty.positions?.length > 0 && <p className="mt-3 text-xs font-semibold text-emerald-800">{faculty.positions.length} current opening{faculty.positions.length === 1 ? '' : 's'}</p>}
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">{faculty.email && <a className="hover:text-emerald-800" href={`mailto:${faculty.email}`}>{faculty.email}</a>}{faculty.website && <a className="inline-flex items-center gap-1 hover:text-emerald-800" href={faculty.website} target="_blank" rel="noreferrer">Faculty website <ExternalLink size={12} /></a>}</div>
              {faculty.publications && <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold text-slate-700">Publications and work</summary><p className="mt-2 whitespace-pre-wrap text-slate-600">{faculty.publications}</p></details>}
            </article>)}</VaultList>
          <aside className="self-start rounded-3xl border-2 border-[var(--color-secondary)]/30 bg-gradient-to-b from-white/95 via-sky-50/25 to-blue-50/35 p-5 shadow-[0_12px_35px_rgba(11,30,63,0.06)]">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-950"><UsersRound size={16} /> Find a research match</p>
            <p className="mt-2 text-xs leading-5 text-slate-600">Choose any interests. Recommendations are ranked by research-area fit, department, and active openings.</p>
            <form onSubmit={findMatches} className="mt-4 space-y-3">
              <input value={interest.department} onChange={(event) => setInterest({ ...interest, department: event.target.value })} placeholder="Department (e.g. Electrical)" aria-label="Preferred department" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)]" />
              <input value={interest.subArea} onChange={(event) => setInterest({ ...interest, subArea: event.target.value })} placeholder="Research area (e.g. robotics)" aria-label="Research area of interest" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)]" />
              <select value={interest.projectType} onChange={(event) => setInterest({ ...interest, projectType: event.target.value })} aria-label="Preferred project type" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)]"><option value="">Any project type</option><option value="SUMMER_RESEARCH">Summer research</option><option value="THESIS">Thesis</option><option value="READING_PROJECT">Reading project</option><option value="RA_SHIP">Research assistantship</option></select>
              <button disabled={matching || (!interest.department.trim() && !interest.subArea.trim() && !interest.projectType)} className="w-full rounded-xl bg-[var(--color-secondary)] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-accent)] disabled:cursor-not-allowed disabled:opacity-50">{matching ? 'Finding matches...' : 'Find faculty matches'}</button>
            </form>
            {matchSearched && <div className="mt-4 border-t border-blue-100 pt-3">
              <p className="mb-1 text-xs font-semibold text-slate-600">{matches.length ? `${matches.length} recommended faculty, ranked by fit` : 'No close matches yet. Try a broader department or research-area term.'}</p>
              <ul className="divide-y divide-blue-100">
                {matches.map((match) => <li key={match.id} className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900">{match.name}</p>
                    <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-800">{match.matchScore}% fit</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{match.department || match.designation || 'Faculty'}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{match.matchReasons.join(' · ')}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button onClick={() => follow('faculty', match.id, match.name)} aria-pressed={followedFacultyIds.has(match.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary-accent)] hover:text-[var(--color-secondary)]">{followedFacultyIds.has(match.id) ? <><UserRoundCheck size={13} /> Following</> : <><UserRoundPlus size={13} /> Follow</>}</button>
                    {match.email && <a href={`mailto:${match.email}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary-accent)] hover:text-[var(--color-secondary)]">Contact <ExternalLink size={12} /></a>}
                  </div>
                </li>)}
              </ul>
            </div>}
          </aside>
        </div>
      )}

      {section === 'experiences' && <VaultList loading={loading} empty="No published experiences yet.">{items.map((experience) => <article key={experience.id} className="border-b border-slate-200 py-5 first:pt-1"><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="text-lg font-bold">{experience.title}</h2><span className="text-xs text-slate-500">{experience.faculty?.name || experience.guideName || 'Student contributor'}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{experience.description}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">{experience.labName && <span>Lab: {experience.labName}</span>}{experience.duration && <span>Duration: {experience.duration}</span>}{experience.outcome && <span>Outcome: {experience.outcome}</span>}</div>{experience.keyLearnings && <p className="mt-2 text-sm text-slate-600"><strong>Key learnings:</strong> {experience.keyLearnings}</p>}<TagList areas={experience.researchAreas?.map((entry) => entry.researchArea) || []} onFollow={follow} followedAreaIds={followedAreaIds} /></article>)}</VaultList>}

      {section === 'discussions' && <VaultList loading={loading} empty="No discussions found.">{items.map((discussion) => <DiscussionItem key={discussion.id} discussion={discussion} currentUserId={user?.id} onReply={reply} onVote={vote} onAcceptAnswer={acceptAnswer} onFollow={follow} followedAreaIds={followedAreaIds} />)}</VaultList>}

      {section === 'resources' && <VaultList loading={loading} empty="No resources found.">{items.map((resource) => <article key={resource.id} className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 py-5 first:pt-1"><div><p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">{resource.resourceType?.replaceAll('_', ' ')}</p><h2 className="mt-1 text-lg font-bold">{resource.title}</h2>{resource.description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{resource.description}</p>}<TagList areas={resource.researchAreas?.map((entry) => entry.researchArea) || []} onFollow={follow} followedAreaIds={followedAreaIds} /></div><a href={resource.url || resource.filePath} target="_blank" rel="noreferrer" onClick={() => { researchVaultApi.trackResourceView(resource.id).catch(() => {}); if (resource.filePath) researchVaultApi.trackResourceDownload(resource.id).catch(() => {}); }} className="inline-flex shrink-0 items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-700 hover:text-emerald-800">Open <ExternalLink size={15} /></a></article>)}</VaultList>}

      {section === 'positions' && <VaultList loading={loading} empty="No open research positions right now.">{items.map((position) => <article key={position.id} className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 py-5 first:pt-1"><div><p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">{position.positionType?.replaceAll('_', ' ')}</p><h2 className="mt-1 text-lg font-bold">{position.title}</h2><p className="mt-1 text-sm text-slate-600">{position.faculty?.name}{position.faculty?.department ? ` · ${position.faculty.department}` : ''}</p>{position.description && <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-700">{position.description}</p>}{position.deadline && <p className="mt-2 text-xs text-slate-500">Apply by {new Date(position.deadline).toLocaleDateString()}</p>}</div>{position.applicationUrl && <a href={position.applicationUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 rounded-md bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900">Details <ExternalLink size={15} /></a>}</article>)}</VaultList>}

      {section === 'following' && <VaultList loading={loading} empty={followedFacultyIds.size || followedAreaIds.size ? 'No recent activity from the people and areas you follow.' : 'Follow a faculty member or research area to see new experiences, openings, discussions, and resources here.'}>{items.map((update, index) => <article key={update.id || `following-update-${index}`} className="border-b border-slate-200 py-5 first:pt-1"><div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-800">{String(update.type || 'update').replaceAll('_', ' ')}</span><time className="text-xs text-slate-500" dateTime={update.createdAt}>{update.createdAt ? new Date(update.createdAt).toLocaleDateString() : ''}</time></div><h2 className="mt-2 text-base font-bold text-slate-900">{update.title || 'Research update'}</h2>{update.source && <p className="mt-1 text-xs font-semibold text-[var(--color-primary-accent)]">{update.source}</p>}{update.detail && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{update.detail}</p>}</article>)}</VaultList>}

      {formOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="vault-form-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-md bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h2 id="vault-form-title" className="text-xl font-bold">{section === 'experiences' ? 'Share a research experience' : 'Ask the community'}</h2><button onClick={() => setFormOpen(false)} aria-label="Close" className="rounded p-2 text-slate-500 hover:bg-slate-100">×</button></div><form onSubmit={submitContent} className="mt-5 space-y-3"><input name="title" required placeholder={section === 'experiences' ? 'Experience title' : 'Question title'} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" />{section === 'experiences' && <><input name="labName" placeholder="Lab name" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /><input name="guideName" placeholder="Faculty guide" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /><input name="duration" placeholder="Duration" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /><input name="prerequisites" placeholder="Prerequisites" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /><input name="keyLearnings" placeholder="Key learnings" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /></>}<textarea name={section === 'experiences' ? 'description' : 'content'} required rows={5} placeholder={section === 'experiences' ? 'What did you work on and what should others know?' : 'Write your question or details. Markdown is supported.'} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" />{section === 'experiences' && <input name="outcome" placeholder="Outcome" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" />}<select name="researchAreaIds" defaultValue="" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="">Research area (optional)</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select>{section === 'experiences' && <select name="facultyId" defaultValue="" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="">Faculty member (optional)</option>{facultyOptions.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}</select>}<div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setFormOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button><button className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white">Submit</button></div></form></section></div>}

      {pendingUnfollow && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingUnfollow(null); }}><section role="alertdialog" aria-modal="true" aria-labelledby="unfollow-title" aria-describedby="unfollow-description" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">Research Vault</p><h2 id="unfollow-title" className="mt-1 text-xl font-bold text-slate-950">Unfollow {pendingUnfollow.name}?</h2></div><button type="button" aria-label="Close confirmation" onClick={() => setPendingUnfollow(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div><p id="unfollow-description" className="mt-3 text-sm leading-6 text-slate-600">Updates from {pendingUnfollow.kind === 'faculty' ? 'this faculty member' : 'this research area'} will no longer appear in your Following feed. You can follow again at any time.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setPendingUnfollow(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Keep following</button><button type="button" onClick={confirmUnfollow} className="rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800">Unfollow</button></div></section></div>}
    </div>
  );
}

function VaultList({ loading, empty, children }) {
  if (loading) return <div className="academic-card flex min-h-48 items-center justify-center rounded-3xl p-8 text-center text-sm text-slate-500">Loading Research Vault...</div>;
  if (!children || (Array.isArray(children) && children.length === 0)) return <div className="academic-card flex min-h-48 items-center justify-center rounded-3xl p-8 text-center text-sm text-slate-500">{empty}</div>;
  return <div className="space-y-4">{children}</div>;
}

function TagList({ areas, onFollow, followedAreaIds, compact = false }) {
  if (!areas?.length) return null;
  return <div className={`flex flex-wrap gap-1.5 ${compact ? '' : 'mt-3'}`}>{areas.map((area) => {
    const isFollowing = followedAreaIds?.has(area.id) || false;
    return <button key={area.id} onClick={() => onFollow('area', area.id, area.name)} aria-pressed={isFollowing} title={`${isFollowing ? 'Unfollow' : 'Follow'} ${area.name}`} className={`rounded-sm border px-2 ${compact ? 'py-0.5' : 'py-1'} text-[11px] font-semibold ${isFollowing ? 'border-blue-200 bg-blue-50 text-blue-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'}`}>{isFollowing && <Check size={11} className="mr-1 inline" />}{area.name}</button>;
  })}</div>;
}

const authorLabel = (author) => [author?.displayName || 'ACC student', author?.rollNo].filter(Boolean).join(' · ');

function DiscussionItem({ discussion, currentUserId, onReply, onVote, onAcceptAnswer, onFollow, followedAreaIds }) {
  const [replyText, setReplyText] = useState('');
  const isOwnDiscussion = discussion.uploadedBy?.id === currentUserId;
  const hasAcceptedAnswer = discussion.replies?.some((reply) => reply.isAccepted) || false;

  return (
    <article className={`border-b border-slate-200 py-5 first:pt-1 ${isOwnDiscussion ? '!bg-blue-50/70 border-l-4 border-l-blue-600 pl-4 ring-1 ring-blue-200' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold leading-snug text-slate-950">{discussion.title}</h2>
        {discussion.isResolved && <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-900"><Check size={12} /> Resolved</span>}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-left text-slate-700">{discussion.content}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className={`text-xs font-medium ${isOwnDiscussion ? 'text-blue-700' : 'text-slate-600'}`}>{authorLabel(discussion.uploadedBy)}{discussion.uploadedBy?.role === 'FACULTY' ? ' · Verified faculty' : ''}</p>
        <TagList areas={discussion.researchAreas?.map((entry) => entry.researchArea) || []} onFollow={onFollow} followedAreaIds={followedAreaIds} compact />
      </div>
      <div className="mt-3 flex items-center gap-4">
        <button onClick={() => onVote(discussion.id)} aria-pressed={discussion.hasVoted || false} className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${discussion.hasVoted ? 'text-[var(--color-secondary)]' : 'text-slate-600 hover:text-[var(--color-primary-accent)]'}`}><ThumbsUp size={14} fill={discussion.hasVoted ? 'currentColor' : 'none'} /> {discussion.voteCount ?? discussion._count?.votes ?? 0}</button>
        <span className="text-xs text-slate-500">{discussion._count?.replies || 0} replies</span>
      </div>
      {discussion.replies?.length > 0 && <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">{discussion.replies.map((entry) => {
        const isOwnReply = entry.uploadedBy?.id === currentUserId;
        return (
          <div key={entry.id} className={`w-[calc(100%-2rem)] rounded-xl border px-3 py-2 ${isOwnReply ? 'ml-auto border-blue-200 bg-blue-50/80 text-right' : 'mr-auto border-emerald-200 bg-emerald-50/40 text-left'}`}>
            {entry.isAccepted && <p className="mb-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-800"><CheckCircle2 size={12} /> Accepted answer</p>}
            <p className="text-sm text-slate-700">{entry.content}</p>
            <p className={`mt-1 text-[11px] font-medium ${isOwnReply ? 'text-blue-700' : 'text-slate-500'}`}>{authorLabel(entry.uploadedBy)}{entry.uploadedBy?.role === 'FACULTY' ? ' · Verified faculty' : ''}</p>
            {isOwnDiscussion && !hasAcceptedAnswer && <button type="button" onClick={() => onAcceptAnswer(discussion.id, entry.id)} className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary-accent)] hover:text-[var(--color-secondary)] ${isOwnReply ? 'justify-end' : ''}`}><CheckCircle2 size={13} /> Mark as answer</button>}
            {entry.replies?.map((child) => {
              const isOwnNestedReply = child.uploadedBy?.id === currentUserId;
              return <div key={child.id} className={`mt-2 w-[calc(100%-1.5rem)] rounded-lg border px-3 py-2 ${isOwnNestedReply ? 'ml-auto border-blue-200 bg-blue-50/80 text-right' : 'mr-auto border-emerald-200 bg-emerald-50/40 text-left'}`}><p className="text-sm text-slate-600">{child.content}</p><p className={`mt-1 text-[11px] font-medium ${isOwnNestedReply ? 'text-blue-700' : 'text-slate-500'}`}>{authorLabel(child.uploadedBy)}</p></div>;
            })}
          </div>
        );
      })}</div>}
      <form onSubmit={(event) => { event.preventDefault(); if (replyText.trim()) { onReply(discussion.id, replyText); setReplyText(''); } }} className="mt-3 flex gap-2">
        <input value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="Add a reply" className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <button aria-label="Send reply" className="rounded-md bg-[var(--color-secondary)] px-3 text-white transition-colors hover:bg-[var(--color-primary-accent)]"><Send size={15} /></button>
      </form>
    </article>
  );
}