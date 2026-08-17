import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Users, CalendarPlus, FileText, Clock, Plus, Trash2,
  CheckCircle2, Link2, Star, User, Menu, X, ChevronRight
} from 'lucide-react';
import { fmt } from '../lib/mockData';
import api from '../lib/api';
import ProfileTab from '../components/ProfileTab';
import ProfileModal from '../components/ProfileModal';

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ name, size = 'md', gradient = 'from-primary to-primary-container', src }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const sizes = { sm: 'w-9 h-9 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-14 h-14 text-lg' };

  if (src) {
    return (
      <div className={`${sizes[size]} rounded-full overflow-hidden flex-shrink-0 shadow-sm border border-outline-variant/20`}>
        <img src={src} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white flex-shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}

function SectionCard({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ── Tab 1: My Group ───────────────────────────────────────────────────────────
function GroupTab({ group, onMemberClick }) {
  const gradients = {
    mentor: 'from-primary to-primary-container',
    comentor: 'from-tertiary to-tertiary-container',
    mentee: 'from-blue-500 to-indigo-500',
  };
  const allMembers = [
    ...(group.coMentors || []).map(m => ({ ...m, role: 'comentor' })),
    ...(group.mentees || []).map(m => ({ ...m, role: 'mentee' })),
  ];
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Co-Mentors', value: group.coMentors?.length || 0, color: 'text-tertiary' },
          { label: 'Mentees', value: group.mentees?.length || 0, color: 'text-primary' },
          { label: 'Total Members', value: (group.coMentors?.length || 0) + (group.mentees?.length || 0), color: 'text-on-surface' },
        ].map(s => (
          <SectionCard key={s.label} className="p-6 text-center">
            <div className={`text-4xl font-bold ${s.color} mb-2`}>{s.value}</div>
            <div className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">{s.label}</div>
          </SectionCard>
        ))}
      </div>
      
      <div>
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Group Members</h3>
        <SectionCard className="divide-y divide-outline-variant/20">
          {allMembers.map((m, i) => (
            <div key={m.id}
              onClick={() => onMemberClick({ ...m, smpRole: m.role === 'mentee' ? 'MENTEE' : 'CO_MENTOR' })}
              className="flex items-center gap-4 p-4 cursor-pointer hover:bg-surface-container-low transition-colors duration-150"
            >
              <Avatar name={m.name} src={m.profilePicUrl} gradient={gradients[m.role]} />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-on-surface text-sm block">{m.name}</span>
                <span className="text-xs text-on-surface-variant font-mono mt-0.5">{m.rollNumber}</span>
              </div>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                m.role === 'mentee'
                  ? 'bg-primary-container text-on-primary-container border-primary-container'
                  : 'bg-tertiary-container text-on-tertiary-container border-tertiary-container'
                }`}>
                {m.role === 'mentee' ? 'Mentee' : 'Co-Mentor'}
              </span>
              <a href={`mailto:${m.email}`}
                onClick={(e) => e.stopPropagation()}
                className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-container transition-all duration-150"
              >
                <FileText className="w-4 h-4 hidden" /> {/* Placeholder just in case */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </a>
            </div>
          ))}
        </SectionCard>
      </div>
    </div>
  );
}

// ── Tab 2: Schedule Meeting ───────────────────────────────────────────────────
function ScheduleTab({ groupId, meetings, setMeetings, onScheduled }) {
  const [form, setForm] = useState({ title: '', date: '', time: '', location: '', agenda: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date) return;
    setSaving(true);
    try {
      const meetingDate = form.time ? new Date(form.date + 'T' + form.time) : new Date(form.date);
      await api.post('/meeting', {
        groupId,
        title: form.title,
        description: form.agenda + (form.location ? '\nLocation: ' + form.location : ''),
        date: meetingDate.toISOString()
      });
      setForm({ title: '', date: '', time: '', location: '', agenda: '' });
      onScheduled?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const upcoming = meetings.filter(m => new Date(m.date) >= new Date());
  const past = meetings.filter(m => new Date(m.date) < new Date());

  const inputClass = "w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none";

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Schedule form */}
      <SectionCard className="p-8">
        <h3 className="font-bold text-on-surface text-lg mb-6 flex items-center gap-2">
          <CalendarPlus className="w-5 h-5 text-primary" /> Schedule a New Meeting
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <FormField label="Meeting Title *">
              <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Mid-Semester Check-in" className={inputClass} />
            </FormField>
            <FormField label="Location">
              <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                placeholder="Room no. / Online" className={inputClass} />
            </FormField>
            <FormField label="Date *">
              <input required type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]} className={inputClass} />
            </FormField>
            <FormField label="Time *">
              <input required type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                className={inputClass} />
            </FormField>
          </div>
          <FormField label="Agenda">
            <textarea rows={3} value={form.agenda} onChange={e => setForm(p => ({ ...p, agenda: e.target.value }))}
              placeholder="Topics to cover in this meeting..." className={`${inputClass} resize-none`} />
          </FormField>
          <button type="submit" disabled={saving}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-on-primary-fixed-variant text-on-primary transition-colors duration-200 font-semibold text-sm px-8 py-3.5 rounded-xl shadow-sm hover:shadow disabled:opacity-50 active:scale-[0.98]">
            {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Scheduling...</>
              : <><Plus className="w-4 h-4" /> Schedule Meeting</>}
          </button>
        </form>
      </SectionCard>

      {/* Upcoming meetings */}
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Upcoming ({upcoming.length})</h3>
          <div className="space-y-3">
            {upcoming.map(m => <MeetingRow key={m.id} meeting={m} />)}
          </div>
        </div>
      )}

      {/* Past meetings */}
      {past.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4 mt-8">Past Meetings ({past.length})</h3>
          <div className="space-y-3 opacity-80">
            {past.map(m => <MeetingRow key={m.id} meeting={m} past />)}
          </div>
        </div>
      )}
    </div>
  );
}

function MeetingRow({ meeting: m, onDelete, past }) {
  return (
    <div className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-150 ${past ? 'border-outline-variant/20 bg-surface-container-lowest' : 'border-outline-variant/30 bg-surface-container-lowest shadow-sm hover:shadow'}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${past ? 'bg-surface-container text-on-surface-variant' : 'bg-primary-container text-on-primary-container'}`}>
        <CalendarPlus className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-on-surface text-base truncate mb-1">{m.title}</div>
        <div className="text-sm text-on-surface-variant">{fmt.date(m.date)} · {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${past ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary-container text-on-primary-container'}`}>
        {past ? 'Past' : fmt.relDate(m.date)}
      </span>
      {onDelete && !past && (
        <button onClick={onDelete} className="w-9 h-9 rounded-xl text-on-surface-variant hover:text-error hover:bg-error-container flex items-center justify-center transition-all duration-150">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ── Tab 3: Submit MOM ─────────────────────────────────────────────────────────
function MOMTab({ group, meetings, onUpdated }) {
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [momUrl, setMomUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [attendance, setAttendance] = useState({});

  const pastMeetings = meetings.filter(m => new Date(m.date) < new Date() && !m.momUrl);

  const allMembers = [
    ...(group.coMentors || []).map(m => ({ ...m, role: 'co-mentor' })),
    ...(group.mentees || []).map(m => ({ ...m, role: 'mentee' })),
  ];

  useEffect(() => {
    if (selectedMeeting) {
      const mtg = pastMeetings.find(m => m.id === selectedMeeting);
      const initialAttendance = {};
      allMembers.forEach(m => {
        initialAttendance[m.id] = mtg?.attendeeIds?.includes(m.id) ?? false;
      });
      setAttendance(initialAttendance);
    }
  }, [selectedMeeting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMeeting || !momUrl) return;
    setSaving(true);
    try {
      await api.put(`/meeting/${selectedMeeting}/mom`, { momUrl });

      const presentIds = Object.keys(attendance).filter(id => attendance[id]);
      await api.put(`/meeting/${selectedMeeting}/attendance`, { attendeeIds: presentIds });

      setSelectedMeeting('');
      setMomUrl('');
      setAttendance({});
      onUpdated?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none";

  return (
    <div className="space-y-6 max-w-3xl">
      <SectionCard className="p-8">
        <h3 className="font-bold text-on-surface text-lg mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> Submit Minutes of Meeting
        </h3>
        {pastMeetings.length === 0 ? (
          <div className="p-12 text-center border-dashed rounded-2xl border border-outline-variant/30">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
            <p className="text-on-surface font-semibold">All caught up!</p>
            <p className="text-on-surface-variant text-sm mt-1">No pending past meetings need a MOM.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <FormField label="Select Past Meeting *">
                <select required value={selectedMeeting} onChange={e => setSelectedMeeting(e.target.value)} className={inputClass}>
                  <option value="" disabled>Select a meeting...</option>
                  {pastMeetings.map(m => (
                    <option key={m.id} value={m.id}>{m.title} - {fmt.date(m.date)}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="MOM Document URL / Summary *">
                <input required value={momUrl} onChange={e => setMomUrl(e.target.value)}
                  placeholder="Google Docs link or brief summary..." className={inputClass} />
              </FormField>
            </div>

            {selectedMeeting && (
              <div className="border-t border-outline-variant/20 pt-6">
                <h4 className="text-sm font-semibold text-on-surface mb-4">Attendance Checklist</h4>
                <div className="space-y-3">
                  {allMembers.map(m => (
                    <label key={m.id} className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-outline-variant/30 cursor-pointer hover:border-primary/50 transition-colors">
                      <input type="checkbox" checked={attendance[m.id] || false} onChange={() => setAttendance(p => ({ ...p, [m.id]: !p[m.id] }))} 
                        className="w-5 h-5 rounded border-outline-variant/50 text-primary focus:ring-primary accent-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-on-surface truncate">{m.name}</div>
                        <div className="text-xs text-on-surface-variant mt-0.5 font-mono">{m.rollNumber} • {m.role}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${attendance[m.id] ? 'bg-emerald-50 text-emerald-700' : 'bg-error-container text-on-error-container'}`}>
                        {attendance[m.id] ? 'Present' : 'Absent'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-semibold text-sm px-8 py-3.5 rounded-xl shadow-sm hover:shadow disabled:opacity-50 active:scale-[0.98] transition-all duration-200">
              {saving ? 'Submitting...' : 'Submit MOM & Attendance'}
            </button>
          </form>
        )}
      </SectionCard>
    </div>
  );
}

// ── Tab 4: History ────────────────────────────────────────────────────────────
function HistoryTab({ meetings }) {
  const pastMeetings = meetings.filter(m => new Date(m.date) < new Date());

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Past Meetings ({pastMeetings.length})</h3>
        {pastMeetings.length === 0 ? (
          <SectionCard className="p-12 text-center border-dashed">
            <Clock className="w-10 h-10 text-outline mx-auto mb-4" />
            <p className="text-on-surface font-semibold">No past meetings found.</p>
          </SectionCard>
        ) : (
          <div className="space-y-4">
            {pastMeetings.map(mtg => (
              <SectionCard key={mtg.id} className="p-5">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-on-surface text-base mb-1">{mtg.title}</div>
                    <div className="text-sm text-on-surface-variant mb-3">{fmt.date(mtg.date)}</div>
                    {mtg.momUrl ? (
                      <a href={mtg.momUrl.startsWith('http') ? mtg.momUrl : `//${mtg.momUrl}`} target="_blank" rel="noreferrer" 
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors">
                        <Link2 className="w-4 h-4" /> View MOM
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600">
                        <Clock className="w-4 h-4" /> Pending MOM
                      </span>
                    )}
                  </div>
                </div>
              </SectionCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 5: Feedback ───────────────────────────────────────────────────────────
function FeedbackTab({ mentorId }) {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/feedback/mentor/${mentorId}`).then(res => {
      setFeedbackList(res.data.feedback);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [mentorId]);

  if (loading) return <div className="p-8 text-center text-on-surface-variant font-medium">Loading feedback...</div>;

  const averageRating = feedbackList.length ? (feedbackList.reduce((acc, f) => acc + f.rating, 0) / feedbackList.length).toFixed(1) : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SectionCard className="p-6 text-center">
          <div className="text-4xl font-bold text-amber-500 mb-2">{averageRating} / 5.0</div>
          <div className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Avg Rating</div>
        </SectionCard>
        <SectionCard className="p-6 text-center">
          <div className="text-4xl font-bold text-primary mb-2">{feedbackList.length}</div>
          <div className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Total Reviews</div>
        </SectionCard>
      </div>

      <div className="space-y-4 pt-2">
        {feedbackList.length === 0 ? (
          <SectionCard className="p-12 text-center border-dashed">
            <Star className="w-10 h-10 text-outline mx-auto mb-4" />
            <p className="text-on-surface font-semibold">No feedback received yet.</p>
          </SectionCard>
        ) : (
          feedbackList.map(f => (
            <SectionCard key={f.id} className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-5 h-5 ${s <= f.rating ? 'text-amber-400 fill-amber-400' : 'text-outline-variant'}`} />
                  ))}
                </div>
                <span className="text-sm text-on-surface-variant ml-auto font-medium">{fmt.date(f.createdAt)}</span>
              </div>
              {f.comments ? (
                <p className="text-base text-on-surface leading-relaxed italic">"{f.comments}"</p>
              ) : (
                <p className="text-sm text-on-surface-variant italic">No comments provided.</p>
              )}
            </SectionCard>
          ))
        )}
      </div>
    </div>
  );
}

// ── Form helper ───────────────────────────────────────────────────────────────
function FormField({ label, children }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="text-sm font-semibold text-on-surface">{label}</label>}
      {children}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'group', label: 'My Group', icon: Users },
  { id: 'schedule', label: 'Schedule', icon: CalendarPlus },
  { id: 'mom', label: 'Submit MOM', icon: FileText },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'feedback', label: 'Feedback', icon: Star },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function MentorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('group');
  const [selectedMember, setSelectedMember] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [group, setGroup] = useState(null);
  const [allGroups, setAllGroups] = useState([]);
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const statusRes = await api.get('/user/status');
      if (!statusRes.data.isAllocationComplete) {
        navigate('/waiting-room');
        return;
      }
      const gRes = await api.get('/user/group');
      const fetchedGroups = gRes.data.groups || (gRes.data?.id ? [gRes.data] : []);
      setAllGroups(fetchedGroups);
      
      const initialGroup = fetchedGroups[0] || gRes.data;
      setGroup(initialGroup);
      if (initialGroup?.id) {
        const mRes = await api.get(`/meeting/group/${initialGroup.id}`);
        setMeetings(mRes.data.meetings || []);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403 || err.response?.data?.isAllocationComplete === false) {
        navigate('/waiting-room');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchGroup = async (index) => {
    if (index < 0 || index >= allGroups.length) return;
    setSelectedGroupIdx(index);
    const targetGroup = allGroups[index];
    setGroup(targetGroup);
    if (targetGroup?.id) {
      try {
        const mRes = await api.get(`/meeting/group/${targetGroup.id}`);
        setMeetings(mRes.data.meetings || []);
      } catch (err) {
        console.error("Error fetching meetings for group:", err);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const upcomingCount = meetings.filter(m => new Date(m.date) >= new Date()).length;

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-surface text-on-surface gap-4">
        <div className="w-16 h-16 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center shadow-sm">
          <div className="h-7 w-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <span className="text-sm text-on-surface-variant font-medium tracking-wide">Loading your dashboard...</span>
      </div>
    );
  }

  if (!group) return <div className="min-h-screen bg-surface flex items-center justify-center text-on-surface">No group assigned.</div>;

  const roleLabel = user?.smpRole === 'MENTOR' ? 'Mentor' : 'Co-Mentor';
  const roleColor = user?.smpRole === 'MENTOR' ? 'text-primary' : 'text-tertiary';

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface flex relative overflow-hidden">
      {/* Ambient Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[70%] bg-blue-300/20 blur-[140px] rounded-full mix-blend-multiply"></div>
        <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[70%] bg-amber-200/30 blur-[140px] rounded-full mix-blend-multiply"></div>
        <div className="absolute bottom-[10%] left-[20%] w-[50%] h-[50%] bg-indigo-200/10 blur-[140px] rounded-full mix-blend-multiply"></div>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col shadow-sm border-r border-outline-variant/30 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-8 h-20 flex items-center justify-between lg:justify-start gap-3 border-b border-outline-variant/20 lg:border-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
              <span className="font-bold text-xs">SMP</span>
            </div>
            <span className="font-semibold text-lg tracking-tight text-primary">MENTOR.GRID</span>
          </div>
          <button className="lg:hidden text-on-surface-variant" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 mt-6 space-y-1.5 overflow-y-auto">
          {TABS.map(t => {
            const isActive = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group font-semibold text-sm ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <Icon className={`w-5 h-5 mr-4 transition-transform group-hover:scale-110 ${isActive ? 'text-on-primary-container' : 'text-on-surface-variant'}`} />
                {t.label}
                {t.id === 'schedule' && upcomingCount > 0 && (
                  <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-primary/20 text-on-primary-container' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                    {upcomingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-outline-variant/20">
          <div className="bg-primary-container/30 rounded-2xl p-4 border border-primary-container/50">
            <p className="text-xs font-bold text-on-primary-container mb-1 tracking-widest uppercase">Your Group</p>
            <p className="text-sm font-semibold text-primary truncate">{group.groupName}</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-20 bg-surface/80 backdrop-blur-xl z-30 px-6 lg:px-10 flex items-center justify-between border-b border-outline-variant/20">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-on-surface-variant hover:text-on-surface" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Portal</p>
              <h1 className="text-on-surface font-semibold text-xl">Mentor Workspace</h1>
            </div>
            <div className="sm:hidden text-on-surface font-semibold text-lg">Mentor Workspace</div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-full hover:bg-surface-container-high cursor-pointer transition-colors">
              <div className="text-right">
                <p className="text-sm font-semibold text-on-surface">{user?.name}</p>
                <p className="text-[11px] text-on-surface-variant">{roleLabel}</p>
              </div>
              <Avatar name={user?.name} size="sm" src={user?.profilePicUrl} gradient="from-primary to-tertiary" />
            </div>
            <div className="h-8 w-px bg-outline-variant/50 hidden sm:block"></div>
            <button onClick={logout} className="p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-full transition-colors group">
              <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 w-full pt-28 pb-6 px-6 lg:pt-28 lg:pb-10 lg:px-10">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Welcome Section */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-4xl lg:text-5xl font-bold text-on-surface tracking-tight mb-3">
                Welcome, {user?.name?.split(' ')[0]} 👋
              </h2>
              <p className="text-on-surface-variant text-base">
                You have <span className="text-primary font-semibold">{upcomingCount} upcoming meeting{upcomingCount !== 1 ? 's' : ''}</span> and{' '}
                <span className="text-tertiary font-semibold">{group.mentees.length} mentees</span> in your current group.
              </p>
            </motion.div>

            {/* Multi-Group Switcher (If Mentor Manages 2 Groups) */}
            {allGroups.length > 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-primary/10 via-surface-container-low to-tertiary/10 border-2 border-primary/20 rounded-3xl shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md shrink-0">
                    <span className="material-symbols-outlined text-[22px]">groups</span>
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-primary uppercase tracking-widest block">Multi-Group Managed ({allGroups.length} Groups Assigned)</span>
                    <span className="text-sm font-bold text-on-surface">Currently Viewing: {group.groupName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  {allGroups.map((g, idx) => (
                    <button
                      key={g.id}
                      onClick={() => handleSwitchGroup(idx)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                        selectedGroupIdx === idx
                          ? 'bg-primary text-on-primary shadow-md ring-4 ring-primary/20 scale-105'
                          : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{selectedGroupIdx === idx ? 'check_circle' : 'group'}</span>
                      {g.groupName}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {tab === 'group' && <GroupTab group={group} onMemberClick={setSelectedMember} />}
                {tab === 'schedule' && <ScheduleTab groupId={group.id} meetings={meetings} setMeetings={setMeetings} onScheduled={fetchData} />}
                {tab === 'mom' && <MOMTab group={group} meetings={meetings} onUpdated={fetchData} />}
                {tab === 'history' && <HistoryTab meetings={meetings} />}
                {tab === 'feedback' && <FeedbackTab mentorId={user.id} />}
                {tab === 'profile' && (
                  <div className="max-w-4xl">
                    <ProfileTab />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Member Details Profile Modal */}
      {selectedMember && (
        <ProfileModal
          user={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
