import { useCallback, useEffect, useState } from 'react';
import { BarChart3, BookOpenCheck, BriefcaseBusiness, CirclePlus, FlaskConical, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { researchVaultApi } from '../../api/researchVaultApi';

const tabs = [
  { id: 'analytics', label: 'Overview', icon: BarChart3 },
  { id: 'moderation', label: 'Experiences', icon: BookOpenCheck },
  { id: 'faculty', label: 'Faculty', icon: FlaskConical },
  { id: 'resources', label: 'Resources', icon: BookOpenCheck },
  { id: 'positions', label: 'Open positions', icon: BriefcaseBusiness },
  { id: 'areas', label: 'Research areas', icon: FlaskConical },
];

const getData = (response) => response.data?.data || [];

export default function ResearchVaultAdmin() {
  const [tab, setTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [queue, setQueue] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [resources, setResources] = useState([]);
  const [positions, setPositions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [stats, moderation, facultyResponse, resourcesResponse, positionsResponse, areasResponse] = await Promise.all([
        researchVaultApi.getAnalytics(),
        researchVaultApi.getModerationQueue(),
        researchVaultApi.getFaculty({ limit: 100 }),
        researchVaultApi.getResources({ limit: 100 }),
        researchVaultApi.getPositions(),
        researchVaultApi.getAreas(),
      ]);
      setAnalytics(stats.data?.data || null);
      setQueue(getData(moderation));
      setFaculty(getData(facultyResponse));
      setResources(getData(resourcesResponse));
      setPositions(getData(positionsResponse));
      setAreas(getData(areasResponse));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load Research Vault administration.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (event, kind) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    if (values.researchAreaId) values.researchAreaIds = [Number(values.researchAreaId)];
    delete values.researchAreaId;
    if (values.facultyId) values.facultyId = Number(values.facultyId);
    else if (kind === 'position') values.facultyId = null;
    if (values.deadline) values.deadline = new Date(values.deadline).toISOString();
    else delete values.deadline;
    try {
      if (kind === 'faculty') await researchVaultApi.createFaculty(values);
      if (kind === 'resource') await researchVaultApi.createResource(values);
      if (kind === 'position') await researchVaultApi.createPosition(values);
      if (kind === 'area') await researchVaultApi.createArea(values);
      form.reset();
      toast.success('Research Vault record created.');
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create this record.');
    }
  };

  const moderate = async (experience, status) => {
    try {
      if (status === 'REJECTED') await researchVaultApi.deleteExperience(experience.id);
      else await researchVaultApi.updateExperience(experience.id, { status });
      toast.success(status === 'PUBLISHED' ? 'Experience published.' : 'Experience rejected.');
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update this experience.');
    }
  };

  const remove = async (kind, id) => {
    if (!window.confirm('Remove this Research Vault record?')) return;
    try {
      if (kind === 'faculty') await researchVaultApi.deleteFaculty(id);
      if (kind === 'resource') await researchVaultApi.deleteResource(id);
      if (kind === 'position') await researchVaultApi.deletePosition(id);
      toast.success('Record removed.');
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not remove this record.');
    }
  };

  return (
    <div className="research-vault-theme mx-auto max-w-7xl space-y-6 pb-12 text-slate-900">
      <header className="border-b border-slate-200 pb-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Research Vault</p>
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-950"><FlaskConical size={28} className="text-emerald-700" /> Administration</h1>
        <p className="mt-2 text-sm text-slate-600">Review contributions and maintain the research directory.</p>
      </header>

      <nav className="vault-tabs flex items-center gap-2 overflow-x-auto px-1 pb-1 scrollbar-none" aria-label="Research administration sections">
        {tabs.map(({ id, label, icon }) => <button key={id} onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold ${tab === id ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}><span className="sr-only">{label}</span>{icon({ size: 16 })}<span>{label}</span>{id === 'moderation' && queue.length > 0 && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-900">{queue.length}</span>}</button>)}
      </nav>

      {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading vault records...</p> : <>
        {tab === 'analytics' && <section><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[
          ['Faculty', analytics?.facultyCount], ['Published experiences', analytics?.experienceCount], ['Awaiting review', analytics?.pendingExperiences], ['Discussions', analytics?.discussionCount], ['Unanswered', analytics?.unansweredDiscussions],
        ].map(([label, value]) => <div key={label} className="border-l-2 border-emerald-700 bg-white px-4 py-3"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-950">{value ?? 0}</p></div>)}</div><h2 className="mt-8 border-b border-slate-200 pb-2 text-lg font-bold">Most viewed resources</h2><div>{(analytics?.topResources || []).map((resource) => <div key={resource.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-200 py-3 text-sm"><span className="font-semibold">{resource.title}</span><span className="text-slate-500">{resource.viewCount} views · {resource.downloadCount} downloads</span></div>)}</div><h2 className="mt-8 border-b border-slate-200 pb-2 text-lg font-bold">Activity by research area</h2><div>{(analytics?.researchAreas || []).map((area) => <div key={area.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-200 py-3 text-sm"><span className="font-semibold">{area.name}</span><span className="text-slate-500">{area._count.facultyProfiles} faculty · {area._count.experiences} experiences · {area._count.discussions} discussions · {area._count.resources} resources</span></div>)}</div></section>}
        {tab === 'analytics' && <section><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[
          ['Faculty', analytics?.facultyCount], ['Published experiences', analytics?.experienceCount], ['Awaiting review', analytics?.pendingExperiences], ['Discussions', analytics?.discussionCount], ['Unanswered', analytics?.unansweredDiscussions],
        ].map(([label, value]) => <div key={label} className="border-l-2 border-emerald-700 bg-white px-4 py-3"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-950">{value ?? 0}</p></div>)}</div><h2 className="mt-8 border-b border-slate-200 pb-2 text-lg font-bold">Most viewed faculty</h2><div>{(analytics?.topFaculty || []).map((person) => <div key={person.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-200 py-3 text-sm"><span className="font-semibold">{person.name}<span className="ml-2 font-normal text-slate-500">{person.department}</span></span><span className="text-slate-500">{person.profileViewCount} views</span></div>)}</div><h2 className="mt-8 border-b border-slate-200 pb-2 text-lg font-bold">Most viewed resources</h2><div>{(analytics?.topResources || []).map((resource) => <div key={resource.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-200 py-3 text-sm"><span className="font-semibold">{resource.title}</span><span className="text-slate-500">{resource.viewCount} views · {resource.downloadCount} downloads</span></div>)}</div><h2 className="mt-8 border-b border-slate-200 pb-2 text-lg font-bold">Activity by research area</h2><div>{(analytics?.researchAreas || []).map((area) => <div key={area.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-200 py-3 text-sm"><span className="font-semibold">{area.name}</span><span className="text-slate-500">{area._count.facultyProfiles} faculty · {area._count.experiences} experiences · {area._count.discussions} discussions · {area._count.resources} resources</span></div>)}</div></section>}

        {tab === 'moderation' && <section><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Awaiting review</h2><span className="text-sm text-slate-500">{queue.length} submissions</span></div>{queue.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">The moderation queue is clear.</p> : queue.map((entry) => <article key={entry.id} className="border-b border-slate-200 py-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><h3 className="font-bold">{entry.title}</h3><p className="mt-1 text-xs text-slate-500">{entry.uploadedBy?.displayName || 'Student'} · {new Date(entry.createdAt).toLocaleDateString()}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{entry.description}</p><div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">{entry.labName && <span>Lab: {entry.labName}</span>}{entry.guideName && <span>Guide: {entry.guideName}</span>}{entry.duration && <span>Duration: {entry.duration}</span>}</div></div><div className="flex shrink-0 gap-2"><button onClick={() => moderate(entry, 'PUBLISHED')} className="rounded-md bg-emerald-800 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-900">Publish</button><button onClick={() => moderate(entry, 'REJECTED')} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-rose-400 hover:text-rose-700">Reject</button></div></div></article>)}</section>}

        {tab === 'faculty' && <ManagementSection title="Faculty directory" records={faculty} onRemove={(id) => remove('faculty', id)}><form onSubmit={(event) => create(event, 'faculty')} className="grid gap-3 border-b border-slate-200 py-4 sm:grid-cols-2"><input name="name" required placeholder="Faculty name" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none" /><input name="slug" required placeholder="Profile slug" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none" /><input name="designation" placeholder="Designation" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none" /><input name="department" placeholder="Department" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none" /><input name="email" type="email" placeholder="Email" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none" /><input name="website" type="url" placeholder="Website URL" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none" /><select name="researchAreaId" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"><option value="">Research area (optional)</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select><textarea name="biography" placeholder="Biography" rows={2} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none sm:col-span-2" /><textarea name="publications" placeholder="Publications" rows={2} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none sm:col-span-2" /><button className="inline-flex w-fit items-center gap-2 rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white"><CirclePlus size={16} /> Add faculty</button></form></ManagementSection>}

        {tab === 'resources' && <ManagementSection title="Curated resources" records={resources} onRemove={(id) => remove('resource', id)}><form onSubmit={(event) => create(event, 'resource')} className="grid gap-3 border-b border-slate-200 py-4 sm:grid-cols-2"><input name="title" required placeholder="Resource title" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none" /><select name="resourceType" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"><option value="GUIDE">Guide</option><option value="SOP_WRITING">SOP writing</option><option value="COLD_EMAILING">Cold-emailing professors</option><option value="PHD_APPLICATIONS">PhD applications</option><option value="GRANT_WRITING">Grant writing</option><option value="OTHER">Other</option></select><input name="url" type="url" placeholder="External URL" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none" /><input name="filePath" placeholder="Stored file path" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none" /><select name="researchAreaId" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"><option value="">Research area (optional)</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select><textarea name="description" rows={2} placeholder="Description" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none sm:col-span-2" /><button className="inline-flex w-fit items-center gap-2 rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white"><CirclePlus size={16} /> Add resource</button></form></ManagementSection>}

        {tab === 'positions' && <ManagementSection title="Open positions" records={positions} onRemove={(id) => remove('position', id)}><form onSubmit={(event) => create(event, 'position')} className="grid gap-3 border-b border-slate-200 py-4 sm:grid-cols-2"><input name="title" required placeholder="Position title" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none" /><select name="positionType" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"><option value="RA">Research assistantship</option><option value="SUMMER">Summer research</option><option value="THESIS">Thesis slot</option><option value="OTHER">Other</option></select><select name="facultyId" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"><option value="">No linked faculty</option>{faculty.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select><input name="deadline" type="date" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none" /><input name="applicationUrl" type="url" placeholder="Application URL" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none" /><textarea name="description" rows={2} placeholder="Description and eligibility" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none" /><button className="inline-flex w-fit items-center gap-2 rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white"><CirclePlus size={16} /> Add position</button></form></ManagementSection>}
        {tab === 'positions' && <ManagementSection title="Open positions" records={positions} onRemove={(id) => remove('position', id)}><form onSubmit={(event) => create(event, 'position')} className="grid gap-3 border-b border-slate-200 py-4 sm:grid-cols-2"><input name="title" required placeholder="Position title" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none" /><select name="positionType" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"><option value="RA">Research assistantship</option><option value="SUMMER">Summer research</option><option value="THESIS">Thesis slot</option><option value="OTHER">Other</option></select><select name="facultyId" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"><option value="">No linked faculty</option>{faculty.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select><input name="deadline" type="date" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none" /><input name="applicationUrl" type="url" placeholder="Application URL" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none" /><textarea name="description" rows={2} placeholder="Description and eligibility" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none" /><button className="inline-flex w-fit items-center gap-2 rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white"><CirclePlus size={16} /> Add position</button></form></ManagementSection>}
        {tab === 'areas' && <ManagementSection title="Research area taxonomy" records={areas} onRemove={() => toast.error('Research areas used by existing records cannot be removed here.')}><form onSubmit={(event) => create(event, 'area')} className="grid gap-3 border-b border-slate-200 py-4 sm:grid-cols-2"><input name="name" required placeholder="Research area name" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none" /><input name="slug" placeholder="Slug (generated if blank)" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none" /><textarea name="description" rows={2} placeholder="Description" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none sm:col-span-2" /><button className="inline-flex w-fit items-center gap-2 rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white"><CirclePlus size={16} /> Add research area</button></form></ManagementSection>}
      </>}
    </div>
  );
}

function ManagementSection({ title, records, onRemove, children }) {
  return <section><h2 className="text-lg font-bold">{title}</h2>{children}<div className="divide-y divide-slate-200">{records.map((record) => <div key={record.id} className="flex items-start justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{record.name || record.title}</p><p className="mt-1 text-xs text-slate-500">{record.department || record.resourceType || record.positionType || record.faculty?.name || ''}</p></div>{onRemove && <button onClick={() => onRemove(record.id)} title="Remove record" className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={15} /></button>}</div>)}</div></section>;
}