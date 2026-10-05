import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, BookOpenCheck, BriefcaseBusiness, CirclePlus, FlaskConical, Trash2, FileText, User, UsersRound, Image as ImageIcon, Link as LinkIcon, BookOpen, Globe, MapPin, Mail, Phone, Linkedin, GraduationCap, Info, Clock, MessageCircle, Eye, Download, AlertCircle, Activity, ChevronRight, Database, Calendar, CheckCircle2, Check, X, Building2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { researchVaultApi } from '../../api/researchVaultApi';
import { getFilePath } from '../../lib/getFilePath';
import { STATUS_COLORS } from './shared';

const tabs = [
  { id: 'analytics', label: 'Overview', icon: BarChart3 },
  { id: 'moderation', label: 'Experiences', icon: BookOpenCheck },
  { id: 'resource-queue', label: 'Pending Resources', icon: FileText },
  { id: 'faculty', label: 'Faculty', icon: FlaskConical },
  { id: 'resources', label: 'Resources', icon: BookOpenCheck },
  { id: 'positions', label: 'Open positions', icon: BriefcaseBusiness },
  { id: 'areas', label: 'Research areas', icon: FlaskConical },
  { id: 'custom-areas', label: 'Custom areas', icon: FlaskConical },
];

const getData = (response) => response.data?.data || [];

function FacultyForm({ areas, create }) {
  const [photoPreview, setPhotoPreview] = useState('');
  
  return (
    <div className="mb-10">
      <div className="mt-1.5 mb-8">
        <p className="text-[15px] leading-relaxed text-slate-500">Manage and organize faculty profiles, research information and professional links.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">Add Faculty</h3>
          <p className="text-xs text-slate-500 mt-1">Create a new faculty profile in the directory.</p>
        </div>

        <form onSubmit={(event) => {
            create(event, 'faculty');
            setPhotoPreview('');
          }} 
          onReset={() => setPhotoPreview('')}
          className="divide-y divide-slate-100"
        >
          {/* Basic Information */}
          <div className="p-6">
            <div className="mb-5 flex items-center gap-2 text-blue-600">
              <User size={18} />
              <h4 className="font-bold">Basic Information</h4>
            </div>
            
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Faculty Name <span className="text-rose-500">*</span></label>
                <input name="name" required placeholder="e.g. Dr. Jane Doe" className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Profile Slug <span className="text-rose-500">*</span></label>
                <input name="slug" required placeholder="e.g. jane-doe" className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Designation</label>
                <input name="designation" placeholder="e.g. Assistant Professor" className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Department</label>
                <input name="department" placeholder="e.g. Computer Science" className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={16} />
                  </div>
                  <input name="email" type="email" placeholder="jane.doe@university.edu" className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone size={16} />
                  </div>
                  <input name="phone" type="tel" placeholder="+1 (555) 000-0000" className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Office Location</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin size={16} />
                  </div>
                  <input name="officeLocation" placeholder="e.g. Room 404, CS Building" className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Research Area</label>
                <select name="researchAreaId" className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400">
                  <option value="">Select an area (optional)</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Profile Photo Area */}
          <div className="p-6 bg-slate-50/50">
            <div className="mb-5 flex items-center gap-2 text-blue-600">
              <ImageIcon size={18} />
              <h4 className="font-bold">Faculty Photo</h4>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-sm relative">
                  <User size={32} className="text-slate-300 absolute" />
                  {photoPreview && (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover relative z-10 transition-opacity duration-300" onError={(e) => { e.target.style.opacity = '0'; }} onLoad={(e) => { e.target.style.opacity = '1'; }} />
                  )}
                </div>
              </div>
              <div className="flex-1 w-full space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-700">Photo URL</label>
                <input name="photoURL" type="url" placeholder="https://example.com/photo.jpg" value={photoPreview} onChange={(e) => setPhotoPreview(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
                <p className="text-[11px] text-slate-500">Enter a publicly accessible image URL for the faculty profile.</p>
              </div>
            </div>
          </div>

          {/* Professional Profiles */}
          <div className="p-6">
            <div className="mb-5 flex items-center gap-2 text-blue-600">
              <LinkIcon size={18} />
              <h4 className="font-bold">Professional Profiles</h4>
            </div>
            
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Lab/Department Website</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Globe size={16} />
                  </div>
                  <input name="website" type="url" placeholder="https://..." className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Google Scholar</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap size={16} />
                  </div>
                  <input name="googleScholarUrl" type="url" placeholder="https://scholar.google.com/..." className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">LinkedIn</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Linkedin size={16} />
                  </div>
                  <input name="linkedinUrl" type="url" placeholder="https://linkedin.com/in/..." className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Personal Website</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Globe size={16} />
                  </div>
                  <input name="personalWebsiteUrl" type="url" placeholder="https://..." className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Academic Work */}
          <div className="p-6">
            <div className="mb-5 flex items-center gap-2 text-blue-600">
              <BookOpen size={18} />
              <h4 className="font-bold">Academic Work</h4>
            </div>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Biography</label>
                <p className="text-[11px] text-slate-500 mb-2">Tell visitors about the faculty member's background, research interests and academic work.</p>
                <textarea name="biography" placeholder="Enter biography here..." rows={4} className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400 resize-y" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Publications</label>
                <p className="text-[11px] text-slate-500 mb-2">Add publications, research papers or notable academic work (plain text).</p>
                <textarea name="publications" placeholder="List key publications..." rows={4} className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400 resize-y" />
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <button type="reset" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors">
              Cancel
            </button>
            <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              <CirclePlus size={16} /> 
              Add Faculty
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResearchVaultAdmin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [queue, setQueue] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [resources, setResources] = useState([]);
  const [positions, setPositions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [customAreasQueue, setCustomAreasQueue] = useState([]);
  const [resourceQueue, setResourceQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [stats, moderation, facultyResponse, resourcesResponse, positionsResponse, areasResponse, customAreasResponse, resourceModResponse] = await Promise.all([
        researchVaultApi.getAnalytics(),
        researchVaultApi.getModerationQueue(),
        researchVaultApi.getFaculty({ limit: 100 }),
        researchVaultApi.getResources({ limit: 100 }),
        researchVaultApi.getPositions(),
        researchVaultApi.getAreas(),
        researchVaultApi.getCustomAreasQueue(),
        researchVaultApi.getResourceModerationQueue()
      ]);
      setAnalytics(stats.data?.data || null);
      setQueue(getData(moderation));
      setFaculty(getData(facultyResponse));
      setResources(getData(resourcesResponse));
      setPositions(getData(positionsResponse));
      setAreas(getData(areasResponse));
      setCustomAreasQueue(getData(customAreasResponse));
      setResourceQueue(getData(resourceModResponse));
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
    if (values.positionsAvailable) values.positionsAvailable = Number(values.positionsAvailable);
    if (values.deadline) values.deadline = new Date(values.deadline).toISOString();
    else delete values.deadline;

    if (kind === 'resource') {
      const file = form.elements.file?.files[0];
      if (file) {
        toast.loading('Uploading file...', { id: 'upload' });
        const result = await getFilePath({ file, folder: 'research-vault' });
        if (!result?.filePath) {
          toast.error('File upload failed', { id: 'upload' });
          return;
        }
        values.filePath = result.filePath;
        values.fileSize = file.size;
        values.mimeType = file.type;
        toast.dismiss('upload');
      }
      delete values.file;
    }

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
    let reviewNote;
    if (status === 'REJECTED') {
      reviewNote = window.prompt("Reason for rejection (will be shown to author):");
      if (reviewNote === null) return;
    }
    try {
      await researchVaultApi.setExperienceStatus(experience.id, { status, reviewNote });
      toast.success(status === 'APPROVED' ? 'Experience approved.' : 'Experience rejected.');
      setQueue(q => q.filter(item => item.id !== experience.id));
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update this experience.');
    }
  };

  const moderateResource = async (resource, status) => {
    let reviewNote;
    if (status === 'REJECTED') {
      reviewNote = window.prompt("Reason for rejection:");
      if (reviewNote === null) return;
    }
    try {
      await researchVaultApi.setResourceStatus(resource.id, { status, reviewNote });
      toast.success(status === 'APPROVED' ? 'Resource approved.' : 'Resource rejected.');
      setResourceQueue(q => q.filter(item => item.id !== resource.id));
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update this resource.');
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

  const updateRecord = async (kind, id, payload) => {
    try {
      if (kind === 'position') await researchVaultApi.updatePosition(id, payload);
      toast.success('Record updated.');
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update record.');
    }
  };

  return (
    <div className="research-vault-theme mx-auto max-w-7xl space-y-6 pb-12 text-slate-900">
      <header className="border-b border-slate-200 pb-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Research Vault</p>
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-950"><FlaskConical size={28} className="text-blue-600" /> Administration</h1>
        <p className="mt-2 text-sm text-slate-600">Review contributions and maintain the research directory.</p>
      </header>

      <nav className="vault-tabs flex items-center gap-2 overflow-x-auto px-1 pb-2 pt-1 scrollbar-none" aria-label="Research administration sections">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button 
            key={id} 
            onClick={() => setTab(id)} 
            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-all duration-200 ${
              tab === id 
                ? '!bg-blue-600 !border-blue-600 !text-white shadow-md scale-[1.02]' 
                : 'border-slate-200 bg-white text-slate-500 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-blue-600'
            }`}
            style={tab === id ? { backgroundColor: '#2563EB', borderColor: '#2563EB', color: '#ffffff' } : {}}
          >
            <span className="sr-only">{label}</span>
            <Icon size={16} />
            <span>{label}</span>
            {id === 'moderation' && queue.length > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${tab === id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'}`}>
                {queue.length}
              </span>
            )}
            {id === 'resource-queue' && resourceQueue.length > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${tab === id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'}`}>
                {resourceQueue.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading vault records...</p> : <>
        {tab === 'analytics' && (
          <section className="animate-in fade-in duration-300">
            <div className="mb-6">
              <h2 className="text-[22px] font-bold tracking-tight text-slate-900">Overview</h2>
              <p className="mt-1 text-sm text-slate-500">Monitor Research Vault activity, content and engagement.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: 'Faculty', value: analytics?.facultyCount ?? 0, targetTab: 'faculty', icon: UsersRound, iconColor: 'text-blue-600', bg: 'bg-blue-50', desc: 'Total profiles' },
                { label: 'Published experiences', value: analytics?.experienceCount ?? 0, icon: BookOpen, iconColor: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Approved items' },
                { label: 'Awaiting review', value: analytics?.pendingExperiences ?? 0, targetTab: 'moderation', icon: Clock, iconColor: 'text-amber-600', bg: 'bg-amber-50', desc: 'Pending approval' },
                { label: 'Discussions', value: analytics?.discussionCount ?? 0, icon: MessageCircle, iconColor: 'text-purple-600', bg: 'bg-purple-50', desc: 'Active threads' },
                { label: 'Unanswered', value: analytics?.unansweredDiscussions ?? 0, icon: AlertCircle, iconColor: 'text-rose-600', bg: 'bg-rose-50', desc: 'Needs attention' },
              ].map(({ label, value, targetTab, icon: Icon, iconColor, bg, desc }) => (
                <div 
                  key={label} 
                  onClick={targetTab ? () => setTab(targetTab) : undefined} 
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md ${targetTab ? 'cursor-pointer hover:border-blue-300 hover:ring-1 hover:ring-blue-100' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-xs font-semibold text-slate-600">{label}</p>
                    <div className={`rounded-lg ${bg} p-2 transition-colors group-hover:bg-opacity-80`}>
                      <Icon size={16} className={iconColor} />
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-400">{desc}</p>
                  </div>
                  {targetTab && (
                    <div className="absolute inset-x-0 bottom-0 h-1 w-full bg-blue-600 opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                </div>
              ))}
            </div>

            {/* Main Dashboard Grid */}
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {/* Most Viewed Faculty */}
              <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
                  <h3 className="font-bold text-slate-900">Most Viewed Faculty</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Faculty profiles receiving the most engagement</p>
                </div>
                <div className="flex-1 divide-y divide-slate-100 p-0">
                  {analytics?.topFaculty?.length > 0 ? (
                    analytics.topFaculty.map((person) => (
                      <div key={person.id} className="group flex items-center justify-between p-4 transition-colors hover:bg-slate-50/80">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                            {person.photoURL ? (
                              <img src={person.photoURL} alt={person.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-slate-400">
                                {person.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{person.name}</p>
                            <p className="text-xs text-slate-500">{person.department || 'No department specified'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          <Eye size={12} className="text-slate-400" />
                          {person.profileViewCount} views
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-32 items-center justify-center p-6 text-center text-sm text-slate-500">
                      No faculty view data available
                    </div>
                  )}
                </div>
              </div>

              {/* Most Viewed Resources */}
              <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
                  <h3 className="font-bold text-slate-900">Most Viewed Resources</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Resources receiving the most engagement</p>
                </div>
                <div className="flex-1 divide-y divide-slate-100 p-0">
                  {analytics?.topResources?.length > 0 ? (
                    analytics.topResources.map((resource) => (
                      <div key={resource.id} className="group flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-slate-50/80">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <FileText size={16} />
                          </div>
                          <p className="truncate text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {resource.title}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 text-xs">
                          <span className="flex items-center gap-1.5 font-medium text-slate-600">
                            <Eye size={12} className="text-slate-400" /> {resource.viewCount} views
                          </span>
                          <span className="flex items-center gap-1.5 font-medium text-slate-600">
                            <Download size={12} className="text-slate-400" /> {resource.downloadCount}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-32 items-center justify-center p-6 text-center text-sm text-slate-500">
                      No resource view data available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Activity by Research Area */}
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
                <h3 className="font-bold text-slate-900">Activity by Research Area</h3>
                <p className="mt-0.5 text-xs text-slate-500">Understand content distribution across research areas.</p>
              </div>
              <div className="divide-y divide-slate-100">
                {analytics?.researchAreas?.length > 0 ? (
                  analytics.researchAreas.map((area) => (
                    <div key={area.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition-colors hover:bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                          <Activity size={14} />
                        </div>
                        <span className="font-bold text-slate-900">{area.name}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 border border-slate-100">
                          <UsersRound size={12} className="text-slate-400" />
                          <span className="text-xs font-semibold text-slate-700">{area._count.facultyProfiles} <span className="text-slate-400 font-medium">Faculty</span></span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 border border-slate-100">
                          <BookOpenCheck size={12} className="text-slate-400" />
                          <span className="text-xs font-semibold text-slate-700">{area._count.experiences} <span className="text-slate-400 font-medium">Exp.</span></span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 border border-slate-100">
                          <MessageCircle size={12} className="text-slate-400" />
                          <span className="text-xs font-semibold text-slate-700">{area._count.discussions} <span className="text-slate-400 font-medium">Disc.</span></span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 border border-slate-100">
                          <FileText size={12} className="text-slate-400" />
                          <span className="text-xs font-semibold text-slate-700">{area._count.resources} <span className="text-slate-400 font-medium">Res.</span></span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center p-8 text-sm text-slate-500">
                    No research area activity found.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {tab === 'moderation' && (
          <section className="animate-in fade-in duration-300">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Experience Moderation</h2>
                <p className="mt-1 text-sm text-slate-500">Review and approve student research experiences before they go live.</p>
              </div>
              {queue.length > 0 && (
                <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 border border-amber-200 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="text-xs font-bold text-amber-700">{queue.length} Awaiting Review</span>
                </div>
              )}
            </div>

            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 px-4 text-center mt-8">
                <div className="rounded-full bg-emerald-50 p-4 mb-4">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <h4 className="text-base font-bold text-slate-900">All caught up!</h4>
                <p className="mt-1 text-sm text-slate-500">The experience moderation queue is completely clear.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {queue.map((entry) => (
                  <article key={entry.id} className="group flex flex-col xl:flex-row gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                    <div onClick={() => navigate(`/admin/research-vault/experiences/${entry.id}`)} className="flex-1 min-w-0 cursor-pointer">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                          Pending
                        </span>
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                          <User size={12} /> {entry.uploadedBy?.displayName || 'Student'} {entry.uploadedBy?.rollNo ? `(${entry.uploadedBy.rollNo})` : ''}
                        </span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                          <Calendar size={12} /> {new Date(entry.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-900">{entry.title}</h3>
                      
                      {entry.summary && <p className="mt-2 text-sm font-semibold text-slate-700">{entry.summary}</p>}
                      <div className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-3 hover:line-clamp-none transition-all whitespace-pre-wrap">{entry.description}</div>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        {entry.experienceType && <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 border border-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"><Activity size={12} className="text-slate-400"/> {entry.experienceType.replace(/_/g, ' ')}</span>}
                        {entry.department && <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 border border-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"><Building2 size={12} className="text-slate-400"/> {entry.department}</span>}
                        {entry.labName && <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 border border-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"><FlaskConical size={12} className="text-slate-400"/> {entry.labName}</span>}
                        {(entry.faculty?.name || entry.externalGuideName) && <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 border border-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"><UsersRound size={12} className="text-slate-400"/> {entry.faculty?.name || entry.externalGuideName}</span>}
                        {entry.duration && <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 border border-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"><Clock size={12} className="text-slate-400"/> {entry.duration}</span>}
                        {entry.researchAreas?.length > 0 && entry.researchAreas.map((ra, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700"><Tag size={12} className="text-blue-400"/> {ra.researchArea?.name}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 shrink-0 xl:w-48 xl:pl-6 xl:border-l border-slate-100 justify-center">
                      <button onClick={() => moderate(entry, 'APPROVED')} className="flex items-center justify-center gap-2 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 shadow-sm">
                        <Check size={16} /> Approve
                      </button>
                      <button onClick={() => moderate(entry, 'REJECTED')} className="flex items-center justify-center gap-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50 hover:border-rose-200 shadow-sm">
                        <X size={16} /> Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'resource-queue' && (
          <section className="animate-in fade-in duration-300">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Resource Moderation</h2>
                <p className="mt-1 text-sm text-slate-500">Review and approve resources suggested by the community.</p>
              </div>
              {resourceQueue.length > 0 && (
                <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 border border-amber-200 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="text-xs font-bold text-amber-700">{resourceQueue.length} Pending</span>
                </div>
              )}
            </div>

            {resourceQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 px-4 text-center mt-8">
                <div className="rounded-full bg-emerald-50 p-4 mb-4">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <h4 className="text-base font-bold text-slate-900">All caught up!</h4>
                <p className="mt-1 text-sm text-slate-500">The resource moderation queue is completely clear.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {resourceQueue.map((entry) => (
                  <article key={entry.id} className="group flex flex-col xl:flex-row gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        if (entry.url) {
                          window.open(entry.url, '_blank', 'noopener,noreferrer');
                        } else if (entry.filePath) {
                          window.open(researchVaultApi.getResourceDownloadUrl(entry.id), '_blank', 'noopener,noreferrer');
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                          Pending
                        </span>
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                          <User size={12} /> {entry.uploadedBy?.displayName || 'Student'} {entry.uploadedBy?.rollNo ? `(${entry.uploadedBy.rollNo})` : ''}
                        </span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                          <Calendar size={12} /> {new Date(entry.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-900">{entry.title}</h3>
                      <div className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-3 hover:line-clamp-none transition-all whitespace-pre-wrap">{entry.description}</div>
                      
                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <FileText size={16} className="text-blue-500" /> {entry.resourceType}
                        </div>
                        
                        {(entry.url || entry.filePath) && <div className="hidden sm:block w-px h-5 bg-slate-200"></div>}
                        
                        {entry.url && (
                          <a href={entry.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline truncate">
                            <LinkIcon size={14} /> {entry.url}
                          </a>
                        )}
                        {entry.filePath && (
                          <a href={researchVaultApi.getResourceDownloadUrl(entry.id)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline">
                            <Download size={14} /> View attached file
                          </a>
                        )}
                      </div>

                      {(entry.researchAreas?.length > 0 || entry.customArea) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {entry.researchAreas?.map((ra, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
                              <Tag size={12} className="text-slate-400"/> {ra.researchArea?.name}
                            </span>
                          ))}
                          {entry.customArea && (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-700 shadow-sm">
                              <AlertCircle size={12} className="text-amber-500"/> Custom Area: {entry.customArea.name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 shrink-0 xl:w-48 xl:pl-6 xl:border-l border-slate-100 justify-center">
                      <button onClick={() => moderateResource(entry, 'APPROVED')} className="flex items-center justify-center gap-2 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 shadow-sm">
                        <Check size={16} /> Approve
                      </button>
                      <button onClick={() => moderateResource(entry, 'REJECTED')} className="flex items-center justify-center gap-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50 hover:border-rose-200 shadow-sm">
                        <X size={16} /> Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'faculty' && (
          <section>
            <div className="mb-6">
              <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Faculty Directory</h2>
            </div>
            
            <FacultyForm areas={areas} create={create} />
            
            <div className="mt-12">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UsersRound size={20} className="text-blue-600" />
                  Faculty Members
                </h3>
                <p className="text-sm text-slate-500 mt-1">Manage existing faculty profiles and directory listings.</p>
              </div>

              {faculty.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 px-4 text-center">
                  <div className="rounded-full bg-blue-50 p-4 mb-4">
                    <User size={32} className="text-blue-600" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">No faculty members yet</h4>
                  <p className="mt-1 text-sm text-slate-500 max-w-sm">Add your first faculty member using the form above to start building the directory.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {faculty.map((person) => (
                    <article key={person.id} className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                          {person.photoURL ? (
                            <img src={person.photoURL} alt={person.name} className="h-full w-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                          ) : null}
                          <span className="text-sm font-bold text-slate-400 uppercase" style={{ display: person.photoURL ? 'none' : 'flex' }}>
                            {person.name?.substring(0, 2) || 'FA'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 truncate" title={person.name}>{person.name}</h4>
                          <p className="mt-0.5 text-xs text-slate-500 truncate" title={person.department}>{person.department || 'No department specified'}</p>
                          {person.designation && (
                            <p className="mt-1 text-[11px] font-medium text-slate-400 truncate">{person.designation}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-5 flex items-center justify-end border-t border-slate-100 pt-3">
                        <button 
                          onClick={() => remove('faculty', person.id)}
                          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
                          aria-label={`Delete ${person.name}`}
                          title={`Delete ${person.name}`}
                        >
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {tab === 'resources' && (
          <section className="animate-in fade-in duration-300">
            <div className="mb-6">
              <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Resources</h2>
              <p className="mt-1 text-sm text-slate-500">Manage research materials, guides, datasets and other academic resources.</p>
            </div>
            
            {/* Add Resource Form */}
            <div className="mb-10">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <h3 className="text-base font-bold text-slate-900">Add Resource</h3>
                  <p className="text-xs text-slate-500 mt-1">Create a new resource for the Research Vault.</p>
                </div>
                
                <form onSubmit={(event) => create(event, 'resource')} className="divide-y divide-slate-100">
                  {/* Basic Information */}
                  <div className="p-6">
                    <div className="mb-5 flex items-center gap-2 text-blue-600">
                      <BookOpen size={18} />
                      <h4 className="font-bold">Basic Information</h4>
                    </div>
                    
                    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Resource Title <span className="text-rose-500">*</span></label>
                        <input name="title" required placeholder="e.g. How to write a Research Paper" className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Resource Type</label>
                        <select name="resourceType" className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400">
                          <option value="GUIDE">Guide</option>
                          <option value="DATASET">Dataset</option>
                          <option value="SOP_WRITING">SOP writing</option>
                          <option value="COLD_EMAILING">Cold-emailing professors</option>
                          <option value="PHD_APPLICATIONS">PhD applications</option>
                          <option value="GRANT_WRITING">Grant writing</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">Research Area</label>
                        <select name="researchAreaId" className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400">
                          <option value="">Select an area (optional)</option>
                          {areas.map((area) => (
                            <option key={area.id} value={area.id}>{area.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Resource Content */}
                  <div className="p-6 bg-slate-50/50">
                    <div className="mb-5 flex items-center gap-2 text-blue-600">
                      <LinkIcon size={18} />
                      <h4 className="font-bold">Resource Content</h4>
                    </div>
                    <p className="text-[13px] text-slate-500 mb-4">Provide the resource using an external URL or upload a file.</p>
                    
                    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">External URL</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Globe size={16} />
                          </div>
                          <input name="url" type="url" placeholder="https://..." className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Upload File</label>
                        <input name="file" type="file" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-blue-600 hover:file:bg-blue-100 cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="p-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Description</label>
                      <p className="text-[11px] text-slate-500 mb-2">Provide a short description of this resource.</p>
                      <textarea name="description" rows={3} placeholder="Enter description here..." className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400 resize-y" />
                    </div>
                  </div>

                  {/* Action Area */}
                  <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200">
                    <button type="reset" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
                      <CirclePlus size={16} /> 
                      Add Resource
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Resource Library List */}
            <div className="mt-12">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FileText size={20} className="text-blue-600" />
                    Resource Library
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Manage existing research materials and academic resources.</p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {resources.length} resources
                </div>
              </div>

              {resources.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 px-4 text-center">
                  <div className="rounded-full bg-blue-50 p-4 mb-4">
                    <BookOpen size={32} className="text-blue-600" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">No resources yet</h4>
                  <p className="mt-1 text-sm text-slate-500 max-w-sm">Add your first research resource to build the Research Vault.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                  {resources.map((resource) => (
                    <article key={resource.id} className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          {resource.resourceType === 'DATASET' ? <Activity size={18} /> : resource.resourceType === 'GUIDE' ? <BookOpen size={18} /> : <FileText size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 line-clamp-1" title={resource.title}>{resource.title}</h4>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                              {resource.resourceType.replace(/_/g, ' ')}
                            </span>
                            {(resource.url || resource.filePath) && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                {resource.url ? <LinkIcon size={10} /> : <Download size={10} />}
                                {resource.url ? 'External Link' : 'File Attached'}
                              </span>
                            )}
                          </div>
                          {resource.description && (
                            <p className="mt-2 text-xs text-slate-500 line-clamp-2">{resource.description}</p>
                          )}
                          {resource.researchAreas?.length > 0 && (
                            <p className="mt-2 text-[11px] font-medium text-slate-400 truncate">
                              Area: {resource.researchAreas.map(ra => ra.researchArea?.name).filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-5 flex items-center justify-end border-t border-slate-100 pt-3">
                        <button 
                          onClick={() => remove('resource', resource.id)}
                          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
                          aria-label={`Delete ${resource.title}`}
                          title={`Delete ${resource.title}`}
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {tab === 'positions' && (
          <section className="animate-in fade-in duration-300">
            {/* Page Header */}
            <div className="mb-6">
              <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Open Positions</h2>
              <p className="mt-1 text-sm text-slate-500">Manage research opportunities, internships and academic positions.</p>
            </div>

            {/* Summary Area */}
            <div className="mb-10">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm max-w-sm">
                <p className="text-sm font-semibold text-slate-500">Active Opportunities</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{positions.filter(p => p.status === 'OPEN').length}</p>
              </div>
            </div>

            {/* Add Position Form */}
            <div className="mb-10">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <h3 className="text-base font-bold text-slate-900">Add Open Position</h3>
                  <p className="text-xs text-slate-500 mt-1">Create a new research opportunity or academic position.</p>
                </div>
                
                <form onSubmit={(event) => create(event, 'position')} className="divide-y divide-slate-100">
                  {/* Position Details */}
                  <div className="p-6">
                    <div className="mb-5 flex items-center gap-2 text-blue-600">
                      <BriefcaseBusiness size={18} />
                      <div>
                        <h4 className="font-bold">Position Details</h4>
                        <p className="text-[11px] text-slate-500 font-normal">Define the role, availability and academic context.</p>
                      </div>
                    </div>
                    
                    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Position Title <span className="text-rose-500">*</span></label>
                        <input name="title" required placeholder="e.g. Summer Intern - Machine Learning" className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Position Type</label>
                        <select name="positionType" className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400">
                          <option value="SUMMER_RESEARCH">Summer research</option>
                          <option value="THESIS">Thesis slot</option>
                          <option value="READING_PROJECT">Reading project</option>
                          <option value="RA_SHIP">Research assistantship</option>
                          <option value="PHD_ASSIST">PhD assistant</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Linked Faculty</label>
                        <select name="facultyId" className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400">
                          <option value="">No linked faculty</option>
                          {faculty.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Research Area</label>
                        <select name="researchAreaId" className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400">
                          <option value="">Select an area (optional)</option>
                          {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
                        </select>
                      </div>


                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Application Deadline</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Calendar size={16} />
                          </div>
                          <input name="deadline" type="date" className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Status</label>
                        <select name="status" className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400">
                          <option value="OPEN">Open (Active)</option>
                          <option value="CLOSED">Closed (Early close)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Application Information */}
                  <div className="p-6 bg-slate-50/50">
                    <div className="mb-5 flex items-center gap-2 text-blue-600">
                      <FileText size={18} />
                      <div>
                        <h4 className="font-bold">Application Information</h4>
                        <p className="text-[11px] text-slate-500 font-normal">Provide applicants with instructions and eligibility details.</p>
                      </div>
                    </div>
                    
                    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Application URL</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <LinkIcon size={16} />
                          </div>
                          <input name="applicationUrl" type="url" placeholder="https://..." className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">How to Apply</label>
                        <input name="howToApply" placeholder="Short instructions or email" className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Description</label>
                        <textarea name="description" rows={3} placeholder="Provide a brief description of the role..." className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400 resize-y" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Eligibility</label>
                        <textarea name="eligibility" rows={3} placeholder="e.g. 2nd/3rd year undergraduates..." className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400 resize-y" />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">Requirements / Skills</label>
                        <p className="text-[11px] text-slate-500 mb-2">List required skills or qualifications, one per line (using '-').</p>
                        <textarea name="requirements" rows={3} placeholder="- Python&#10;- Machine Learning&#10;- Strong work ethic" className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400 resize-y" />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">Application Instructions</label>
                        <p className="text-[11px] text-slate-500 mb-2">Provide detailed instructions for applicants.</p>
                        <textarea name="applicationInstructions" rows={4} placeholder="Enter full instructions here..." className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400 resize-y" />
                      </div>
                    </div>
                  </div>

                  {/* Action Area */}
                  <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200">
                    <button type="reset" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
                      <CirclePlus size={16} /> 
                      Add Position
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Existing Positions List */}
            <div className="mt-12">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BriefcaseBusiness size={20} className="text-blue-600" />
                    Available Opportunities
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Manage current research opportunities and academic positions.</p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {positions.length} opportunities
                </div>
              </div>

              {positions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 px-4 text-center">
                  <div className="rounded-full bg-blue-50 p-4 mb-4">
                    <BriefcaseBusiness size={32} className="text-blue-600" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">No open positions</h4>
                  <p className="mt-1 text-sm text-slate-500 max-w-sm">Create your first research opportunity to start accepting applications.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {positions.map((position) => {
                    const isOpen = () => {
                      if (position.status !== 'OPEN') return false;
                      if (position.deadline && new Date(position.deadline) < new Date()) return false;
                      return true;
                    };
                    const openStatus = isOpen();

                    return (
                      <article key={position.id} className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-4">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${openStatus ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                              <BriefcaseBusiness size={24} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-[17px] font-bold text-slate-900 truncate" title={position.title}>{position.title}</h4>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                                  {position.positionType?.replace(/_/g, ' ')}
                                </span>
                                
                                <div className={`flex items-center gap-1.5 text-xs font-semibold ${openStatus ? 'text-blue-600' : 'text-slate-500'}`}>
                                  <div className={`h-2 w-2 rounded-full ${openStatus ? 'bg-blue-600' : 'bg-slate-400'}`}></div>
                                  {openStatus ? 'Open' : 'Closed'}
                                </div>

                                {position.deadline && (
                                  <div className="flex items-center gap-1 text-xs text-slate-500 ml-1">
                                    <Calendar size={12} />
                                    <span>Deadline: {new Date(position.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="mt-3 flex flex-wrap gap-4 text-[13px] text-slate-500">
                                {position.researchArea?.name && (
                                  <div className="flex items-center gap-1.5">
                                    <FlaskConical size={14} className="text-slate-400" />
                                    <span className="truncate max-w-[200px]">{position.researchArea.name}</span>
                                  </div>
                                )}
                                {position.faculty?.name && (
                                  <div className="flex items-center gap-1.5">
                                    <User size={14} className="text-slate-400" />
                                    <span className="truncate max-w-[200px]">{position.faculty.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions & Counters */}
                        <div className="flex flex-col sm:items-end gap-4 shrink-0 sm:pl-6 sm:border-l border-slate-100">
                          <div className="flex items-center gap-2 mt-auto">
                            <button 
                              onClick={() => {
                                if (position.status === 'OPEN') {
                                  if (window.confirm('Are you sure you want to close this position early? Students will no longer see it as active.')) {
                                    updateRecord('position', position.id, { status: 'CLOSED' });
                                  }
                                } else {
                                  updateRecord('position', position.id, { status: 'OPEN' });
                                }
                              }} 
                              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-slate-200 focus:outline-none"
                            >
                              {position.status === 'OPEN' ? 'Close Position' : 'Reopen'}
                            </button>
                            
                            <button 
                              onClick={() => remove('position', position.id)} 
                              title="Delete Position" 
                              className="flex items-center justify-center rounded-lg border border-transparent p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors focus:ring-2 focus:ring-rose-200 focus:outline-none"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
        {tab === 'areas' && (
          <section className="animate-in fade-in duration-300">
            {/* Page Header */}
            <div className="mb-6">
              <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Research Areas</h2>
              <p className="mt-1 text-sm text-slate-500">Organize and manage the research areas used across the Research Vault.</p>
            </div>

            {/* Add Research Area Form */}
            <div className="mb-10">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <h3 className="text-base font-bold text-slate-900">Add Research Area</h3>
                  <p className="text-xs text-slate-500 mt-1">Create a research category for organizing faculty, resources and academic opportunities.</p>
                </div>
                
                <form onSubmit={(event) => create(event, 'area')} className="divide-y divide-slate-100">
                  <div className="p-6">
                    <div className="mb-5 flex items-center gap-2 text-blue-600">
                      <FlaskConical size={18} />
                      <div>
                        <h4 className="font-bold">Basic Information</h4>
                        <p className="text-[11px] text-slate-500 font-normal">Define the name and description of the research area.</p>
                      </div>
                    </div>
                    
                    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Research Area Name <span className="text-rose-500">*</span></label>
                        <input name="name" required placeholder="e.g. Artificial Intelligence" className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Slug</label>
                        <input name="slug" placeholder="e.g. artificial-intelligence" className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
                        <p className="text-[11px] text-slate-500">Leave blank to generate automatically.</p>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">Description</label>
                        <textarea name="description" rows={3} placeholder="Provide a short explanation of this research area..." className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400 resize-y" />
                      </div>
                    </div>
                  </div>

                  {/* Action Area */}
                  <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200">
                    <button type="reset" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
                      <CirclePlus size={16} /> 
                      Add Research Area
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Research Areas List */}
            <div className="mt-12">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FlaskConical size={20} className="text-blue-600" />
                    Research Area Directory
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Manage the research taxonomy used across the Research Vault.</p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {areas.length} research areas
                </div>
              </div>

              {areas.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 px-4 text-center">
                  <div className="rounded-full bg-blue-50 p-4 mb-4">
                    <FlaskConical size={32} className="text-blue-600" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">No research areas yet</h4>
                  <p className="mt-1 text-sm text-slate-500 max-w-sm">Create your first research area to organize Research Vault content.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {areas.map((area) => (
                    <article key={area.id} className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <FlaskConical size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="text-base font-bold text-slate-900 truncate" title={area.name}>{area.name}</h4>
                              {area.slug && (
                                <p className="mt-0.5 text-[11px] font-medium text-slate-400 font-mono truncate" title={area.slug}>
                                  {area.slug}
                                </p>
                              )}
                            </div>
                            <button 
                              onClick={() => toast.error('Research areas used by existing records cannot be removed here.')} 
                              title="Delete research area" 
                              className="shrink-0 flex items-center justify-center rounded-lg border border-transparent p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors focus:ring-2 focus:ring-rose-200 focus:outline-none -mr-2"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          {area.description && (
                            <p className="mt-3 text-sm text-slate-600 line-clamp-2" title={area.description}>
                              {area.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
        {tab === 'custom-areas' && (
          <section className="animate-in fade-in duration-300">
            {/* Page Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Custom Area Requests</h2>
                <p className="mt-1 text-sm text-slate-500">Review and manage research areas requested by users for Research Vault resources.</p>
              </div>
              
              {customAreasQueue.length > 0 && (
                <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 border border-blue-100">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-blue-700">{customAreasQueue.length} Pending Requests</span>
                </div>
              )}
            </div>

            {/* Empty State */}
            {customAreasQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 px-4 text-center mt-10">
                <div className="rounded-full bg-blue-50 p-4 mb-4">
                  <FlaskConical size={32} className="text-blue-600" />
                </div>
                <h4 className="text-base font-bold text-slate-900">No custom area requests</h4>
                <p className="mt-1 text-sm text-slate-500 max-w-sm">There are no pending requests to review right now.</p>
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-4">
                {customAreasQueue.map((entry) => (
                  <CustomAreaRow key={entry.id} entry={entry} areas={areas} refresh={refresh} />
                ))}
              </div>
            )}
          </section>
        )}
      </>}
    </div>
  );
}

function ManagementSection({ title, records, onRemove, onUpdate, children }) {
  const isPositionOpen = (pos) => {
    if (pos.status !== 'OPEN') return false;
    if (pos.positionsFilled >= pos.positionsAvailable) return false;
    if (pos.deadline && new Date(pos.deadline) < new Date()) return false;
    return true;
  };

  return <section><h2 className="text-lg font-bold">{title}</h2>{children}<div className="divide-y divide-slate-200">{records.map((record) => <div key={record.id} className="flex items-start justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{record.name || record.title}</p><p className="mt-1 text-xs text-slate-500">{record.department || record.resourceType || record.positionType || record.faculty?.name || ''}</p>{record.positionsAvailable !== undefined && (<div className="mt-2 flex items-center gap-3 text-xs"><span className={`rounded-full px-2 py-0.5 font-semibold ${isPositionOpen(record) ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>{isPositionOpen(record) ? 'Open' : 'Closed'}</span><div className="flex items-center gap-1 rounded border border-slate-200 bg-white px-1 shadow-sm"><span className="text-slate-500 px-1">Filled:</span><button type="button" onClick={() => onUpdate && onUpdate(record.id, { positionsFilled: Math.max(0, record.positionsFilled - 1) })} disabled={record.positionsFilled <= 0 || !onUpdate} className="flex h-5 w-5 items-center justify-center rounded-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30">-</button><span className="min-w-[1.5rem] text-center font-medium text-slate-700">{record.positionsFilled}</span><span className="text-slate-400">/ {record.positionsAvailable}</span><button type="button" onClick={() => onUpdate && onUpdate(record.id, { positionsFilled: Math.min(record.positionsAvailable, record.positionsFilled + 1) })} disabled={record.positionsFilled >= record.positionsAvailable || !onUpdate} className="flex h-5 w-5 items-center justify-center rounded-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30">+</button></div></div>)}</div><div className="flex shrink-0 items-center gap-2">{record.positionsAvailable !== undefined && onUpdate && <button onClick={() => { if (record.status === 'OPEN') { if (window.confirm('Are you sure you want to close this position early? Students will no longer see it as active.')) { onUpdate(record.id, { status: 'CLOSED' }); } } else { onUpdate(record.id, { status: 'OPEN' }); } }} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">{record.status === 'OPEN' ? 'Close' : 'Reopen'}</button>}{onRemove && <button onClick={() => onRemove(record.id)} title="Remove record" className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={15} /></button>}</div></div>)}</div></section>;
}

function CustomAreaRow({ entry, areas, refresh }) {
  const [action, setAction] = useState('CREATE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  
  const handleApprove = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const areaId = fd.get('researchAreaId');
    researchVaultApi.moderateCustomArea(entry.id, { 
      status: 'APPROVED', 
      action, 
      researchAreaId: areaId ? Number(areaId) : null, 
      name: fd.get('name'), 
      slug: fd.get('slug') 
    })
    .then(() => { 
      toast.success('Request approved.'); 
      refresh(); 
    })
    .catch((err) => {
      toast.error(err.response?.data?.message || 'Approval failed.');
      setIsSubmitting(false);
    });
  };

  const handleReject = () => {
    setIsRejecting(true);
    researchVaultApi.moderateCustomArea(entry.id, { status: 'REJECTED' })
      .then(() => { 
        toast.success('Request rejected.'); 
        refresh(); 
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Rejection failed.');
        setIsRejecting(false);
      });
  };

  return (
    <article className="group relative rounded-xl border border-slate-200 bg-white p-0 shadow-sm transition-all hover:border-blue-200 hover:shadow-md overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        
        {/* Left Side: Request Information */}
        <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-slate-100 bg-white">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FlaskConical size={24} />
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Requested Area</span>
                <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                  PENDING
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 break-words">{entry.name}</h3>
              
              <div className="mt-4 rounded-lg bg-slate-50 border border-slate-100 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Requested For Resource</span>
                <div className="flex items-start gap-2">
                  <FileText size={16} className="text-blue-600 mt-0.5 shrink-0" />
                  <a href={entry.resource?.url || '#'} target="_blank" rel="noreferrer" className="text-sm font-semibold text-slate-700 hover:text-blue-600 hover:underline break-words line-clamp-2">
                    {entry.resource?.title || 'Unknown Resource'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side: Configuration & Actions */}
        <div className="w-full lg:w-[450px] shrink-0 bg-slate-50/50 flex flex-col justify-between">
          <form onSubmit={handleApprove} className="flex flex-col h-full">
            <div className="p-5 space-y-4 flex-1">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Database size={16} className="text-slate-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Area Configuration</h4>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Creation Type</label>
                <select name="action" value={action} onChange={(e) => setAction(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400">
                  <option value="CREATE">Create new research area</option>
                  <option value="MAP">Map to existing area</option>
                </select>
              </div>

              {action === 'CREATE' && (
                <div className="grid gap-3 sm:grid-cols-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-700">Area Name <span className="text-rose-500">*</span></label>
                    <input name="name" required placeholder="Name" defaultValue={entry.name} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-700">Slug</label>
                    <input name="slug" placeholder="Auto-generated" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400" />
                  </div>
                </div>
              )}

              {action === 'MAP' && (
                <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                  <label className="text-[11px] font-semibold text-slate-700">Select Existing Area <span className="text-rose-500">*</span></label>
                  <select name="researchAreaId" required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400">
                    <option value="">Choose an existing area...</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="bg-slate-100/80 px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-3 mt-auto">
              <button 
                type="button" 
                onClick={handleReject} 
                disabled={isSubmitting || isRejecting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:opacity-50"
              >
                {isRejecting ? 'Rejecting...' : 'Reject'}
              </button>
              
              <button 
                type="submit" 
                disabled={isSubmitting || isRejecting}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-70 flex items-center gap-2"
              >
                {isSubmitting ? 'Approving...' : 'Approve Request'}
              </button>
            </div>
          </form>
        </div>
        
      </div>
    </article>
  );
}