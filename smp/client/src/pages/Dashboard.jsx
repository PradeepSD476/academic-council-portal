import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/toast';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, RefreshCw, Mail, User, Users,
  Calendar, FileText, Star, ChevronRight,
  AlertTriangle, Sparkles, BookOpen, CheckCircle2, XCircle,
  Send, Menu, X
} from 'lucide-react';
import { fmt } from '../lib/mockData';
import ProfileTab from '../components/ProfileTab';
import ProfileModal from '../components/ProfileModal';

// ── helpers ──────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'md', gradient = 'from-primary to-primary-container', src }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const sizes = { sm: 'w-9 h-9 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-lg' };

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

// ── Tab 1: Group Info ─────────────────────────────────────────────────────────
function GroupTab({ group, user, onMemberClick }) {
  const gradients = {
    mentor: 'from-primary to-primary-container',
    comentor: 'from-tertiary to-tertiary-container',
    mentee: 'from-blue-500 to-indigo-500',
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Mentor card */}
      {group?.mentor && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => onMemberClick(group.mentor)}
          className="relative cursor-pointer rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 overflow-hidden hover:border-primary/30 transition-all duration-200 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary-container to-transparent" />
          <div className="flex items-center gap-5 mb-5">
            <Avatar name={group.mentor.name} src={group.mentor.profilePicUrl} gradient={gradients.mentor} size="lg" />
            <div>
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Your Mentor</span>
              <h3 className="font-bold text-on-surface text-xl">{group.mentor.name}</h3>
              <p className="text-on-surface-variant text-sm font-mono mt-1">{group.mentor.rollNumber}</p>
            </div>
          </div>
          <a href={`mailto:${group.mentor.email}`}
            onClick={(e) => e.stopPropagation()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-on-primary-fixed-variant text-on-primary transition-colors duration-200 font-semibold text-sm shadow-sm hover:shadow active:scale-[0.99]">
            <Mail className="w-4 h-4" /> Email Mentor <ChevronRight className="w-4 h-4" />
          </a>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Co-Mentors */}
        {group?.coMentors?.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Co-Mentors</h3>
            <SectionCard className="divide-y divide-outline-variant/20">
              {group.coMentors.map(co => (
                <div key={co.id}
                  onClick={() => onMemberClick(co)}
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-surface-container-low transition-colors duration-150"
                >
                  <Avatar name={co.name} src={co.profilePicUrl} gradient={gradients.comentor} size="sm" />
                  <div className="flex-1">
                    <span className="font-semibold text-on-surface text-sm">{co.name}</span>
                    <br /><span className="text-xs text-on-surface-variant font-mono">{co.rollNumber}</span>
                  </div>
                  <a href={`mailto:${co.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-container transition-all duration-150"
                  ><Mail className="w-4 h-4" /></a>
                </div>
              ))}
            </SectionCard>
          </div>
        )}

        {/* Fellow Mentees */}
        {group?.mentees?.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Fellow Mentees</h3>
            <SectionCard className="divide-y divide-outline-variant/20">
              {group.mentees.map(m => (
                <div key={m.id}
                  onClick={() => onMemberClick(m)}
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-surface-container-low transition-colors duration-150"
                >
                  <Avatar name={m.name} src={m.profilePicUrl} gradient={gradients.mentee} size="sm" />
                  <div className="flex-1">
                    <span className="font-semibold text-on-surface text-sm">{m.name}</span>
                    {m.id === user?.id && <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container">You</span>}
                    <br /><span className="text-xs text-on-surface-variant font-mono">{m.rollNumber}</span>
                  </div>
                  {m.id !== user?.id && (
                    <a href={`mailto:${m.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-container transition-all duration-150"
                    ><Mail className="w-4 h-4" /></a>
                  )}
                </div>
              ))}
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 2: Meetings ───────────────────────────────────────────────────────────
function MeetingsTab({ meetings }) {
  const upcoming = meetings.filter(m => new Date(m.date) >= new Date());
  const past = meetings.filter(m => new Date(m.date) < new Date());

  const MeetingCard = ({ m, isPast }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 transition-all duration-150 ${isPast ? 'border-outline-variant/20 bg-surface-container-lowest opacity-75' : 'border-outline-variant/30 bg-surface-container-lowest shadow-sm hover:shadow'}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h4 className="font-semibold text-on-surface text-base mb-1">{m.title}</h4>
          <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant font-medium">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{fmt.date(m.date)}</span>
            {m.location && <span className="flex items-center gap-1.5 text-primary">📍 {m.location}</span>}
          </div>
        </div>
        <span className={`text-[10px] font-bold px-3 py-1 rounded-full flex-shrink-0 ${isPast ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary-container text-on-primary-container'}`}>
          {isPast ? 'Completed' : fmt.relDate(m.date)}
        </span>
      </div>
      {m.agenda && (
        <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/20">
          <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-widest mb-2">Agenda</p>
          <p className="text-sm text-on-surface leading-relaxed">{m.agenda}</p>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-8 max-w-3xl">
      {upcoming.length === 0 && past.length === 0 && (
        <SectionCard className="p-12 text-center border-dashed">
          <Calendar className="w-10 h-10 text-outline mx-auto mb-4" />
          <p className="text-on-surface font-semibold">No meetings scheduled yet.</p>
          <p className="text-on-surface-variant text-sm mt-1">Your mentor will schedule meetings here.</p>
        </SectionCard>
      )}
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Upcoming ({upcoming.length})</h3>
          <div className="space-y-4">{upcoming.map(m => <MeetingCard key={m.id} m={m} />)}</div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Past Meetings ({past.length})</h3>
          <div className="space-y-4">{past.map(m => <MeetingCard key={m.id} m={m} isPast />)}</div>
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Feedback ───────────────────────────────────────────────────────────
function FeedbackTab({ user, group, isFeedbackOpen }) {
  const toast = useToast();
  const seniors = [];
  if (group?.mentor) seniors.push({ ...group.mentor, roleTitle: 'Mentor' });
  if (group?.coMentors) {
    group.coMentors.forEach(cm => seniors.push({ ...cm, roleTitle: 'Co-Mentor' }));
  }

  const [selectedSeniorId, setSelectedSeniorId] = useState(seniors[0]?.id || '');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submittedSeniorIds, setSubmittedSeniorIds] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (group?.id) {
      api.get(`/feedback/my-submissions?groupId=${group.id}`).then(res => {
        if (res.data.submittedToUserIds) {
          setSubmittedSeniorIds(res.data.submittedToUserIds);
          const unsubmitted = seniors.find(s => !res.data.submittedToUserIds.includes(s.id));
          if (unsubmitted) setSelectedSeniorId(unsubmitted.id);
        }
      }).catch(err => console.error(err));
    }
  }, [group?.id]);

  const selectedSenior = seniors.find(s => s.id === selectedSeniorId) || seniors[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !selectedSenior) return;
    setSaving(true);
    try {
       await api.post('/feedback', { toUserId: selectedSenior.id, groupId: group?.id, rating, comments: comment });
       setSubmittedSeniorIds(prev => [...prev, selectedSenior.id]);
       toast({ title: `Feedback for ${selectedSenior.name} submitted!`, variant: 'success' });
       // reset rating & comment
       setRating(0);
       setComment('');
       // select next unsubmitted senior if any
       const nextUnsubmitted = seniors.find(s => !submittedSeniorIds.includes(s.id) && s.id !== selectedSenior.id);
       if (nextUnsubmitted) {
         setSelectedSeniorId(nextUnsubmitted.id);
       }
    } catch(err) {
       console.error(err);
       toast({ title: err.response?.data?.message || 'Error submitting feedback', variant: 'error' });
    } finally {
       setSaving(false);
    }
  };

  const allSubmitted = seniors.length > 0 && seniors.every(s => submittedSeniorIds.includes(s.id));

  if (allSubmitted) {
    return (
      <SectionCard className="p-12 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="font-bold text-on-surface text-xl mb-2">All Feedback Submitted!</h3>
        <p className="text-on-surface-variant text-sm">Thank you for evaluating your Mentor and Co-Mentors. Your feedback will help improve future sessions anonymously.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard className="p-8 max-w-2xl mx-auto">
      <h3 className="font-bold text-on-surface text-lg mb-2 flex items-center gap-2">
        <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Senior Feedback
      </h3>
      <p className="text-on-surface-variant text-sm mb-6">Your feedback is anonymous and helps improve mentorship for everyone.</p>
      
      {!isFeedbackOpen ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold flex items-center justify-center">
          Feedback is currently closed.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Senior Selector */}
          <div>
            <label className="text-sm font-semibold text-on-surface block mb-3">Select Senior to Evaluate *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {seniors.map(s => {
                const isSubmitted = submittedSeniorIds.includes(s.id);
                const isSelected = selectedSeniorId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => { setSelectedSeniorId(s.id); setRating(0); }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      isSubmitted
                        ? 'bg-surface-container-high border-outline-variant/30 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'bg-primary-container/30 border-primary text-primary shadow-sm'
                        : 'bg-surface border-outline-variant/40 hover:border-primary/50'
                    }`}
                  >
                    <Avatar name={s.name} size="sm" src={s.profilePicUrl} />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm text-on-surface block truncate">{s.name}</span>
                      <span className="text-xs text-on-surface-variant font-mono">{s.roleTitle}</span>
                    </div>
                    {isSubmitted && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedSenior && !submittedSeniorIds.includes(selectedSenior.id) && (
            <>
              <div>
                <label className="text-sm font-semibold text-on-surface block mb-3">
                  Rating for {selectedSenior.name} ({selectedSenior.roleTitle}) *
                </label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button"
                      onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(s)}
                      className={`text-4xl transition-all duration-150 hover:scale-110 ${s <= (hover || rating) ? 'text-amber-400 drop-shadow-sm' : 'text-outline-variant hover:text-outline'}`}
                    >★</button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-amber-600 font-semibold mt-2">
                    {['', 'Needs Improvement', 'Fair', 'Good', 'Very Good', 'Excellent!'][rating]}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Comments (Optional)</label>
                <textarea rows={4} value={comment} onChange={e => setComment(e.target.value)}
                  placeholder={`Share your experience with ${selectedSenior.name}...`}
                  className="bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                />
              </div>

              <button type="submit" disabled={saving || !rating}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-on-primary-fixed-variant text-on-primary transition-colors duration-200 font-semibold text-sm px-8 py-3.5 rounded-xl shadow-sm hover:shadow disabled:opacity-50 active:scale-[0.98]">
                {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
                  : <><Send className="w-4 h-4" /> Submit Feedback for {selectedSenior.name}</>}
              </button>
            </>
          )}
        </form>
      )}
    </SectionCard>
  );
}

// ── Tab 4: Reports & Resources ────────────────────────────────────────────────
function ReportsTab({ meetings, user }) {
  const moms = meetings.filter(m => m.momUrl);
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Meeting Reports ({moms.length})</h3>
        {moms.length === 0 ? (
          <SectionCard className="p-12 text-center border-dashed">
            <BookOpen className="w-10 h-10 text-outline mx-auto mb-4" />
            <p className="text-on-surface font-semibold">No meeting reports yet.</p>
            <p className="text-on-surface-variant text-sm mt-1">Your mentor will post minutes after each meeting.</p>
          </SectionCard>
        ) : (
          <div className="space-y-4">
            {moms.map(mom => {
              const mtg = mom;
              const isOpen = expanded === mom.id;
              const myId = user?.id;
              const myStatus = mtg.attendeeIds?.includes(myId);
              return (
                <SectionCard key={mom.id} className="overflow-hidden">
                  <button className="w-full flex items-center gap-4 p-5 hover:bg-surface-container-low transition-colors text-left" onClick={() => setExpanded(isOpen ? null : mom.id)}>
                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-on-surface text-base mb-1">{mtg?.title || 'Meeting'}</div>
                      <div className="text-sm text-on-surface-variant">{mtg ? fmt.date(mtg.date) : ''}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {myStatus != null && (
                        <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
                          myStatus ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-error-container text-on-error-container border-error/20'
                        }`}>
                          {myStatus ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {myStatus ? 'Present' : 'Absent'}
                        </span>
                      )}
                      <ChevronRight className={`w-5 h-5 text-on-surface-variant transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-6 pt-2 border-t border-outline-variant/20 bg-surface-container-lowest">
                          <div>
                            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-2 mt-4">Minutes / Summary</p>
                            <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">{mom.momUrl}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </SectionCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
const MENTEE_TABS = [
  { id: 'group',    label: 'My Group',   icon: Users },
  { id: 'meetings', label: 'Meetings',   icon: Calendar },
  { id: 'reports',  label: 'Reports',    icon: FileText },
  { id: 'feedback', label: 'Feedback',   icon: Star },
  { id: 'profile',  label: 'Profile',    icon: User },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [isAllocated, setIsAllocated] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [tab, setTab] = useState('group');
  const [selectedMember, setSelectedMember] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isBypass = !!localStorage.getItem('bypassUser');

  useEffect(() => {
    const checkAllocation = async () => {
      // Bypass mode: use mock data
      if (isBypass && user?.smpRole === 'MENTEE') {
        const mockGroupData = {}; // Keeping placeholder for bypass
        setGroup(mockGroupData);
        setIsAllocated(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const statusRes = await api.get('/user/status');
        setIsFeedbackOpen(statusRes.data.isFeedbackOpen);
        if (!statusRes.data.isAllocationComplete) { navigate('/waiting-room'); return; }
        if (user?.smpRole === 'UNASSIGNED') { setIsAllocated(false); setLoading(false); return; }
        const res = await api.get('/user/group');
        setGroup(res.data);
        if (res.data?.id) {
          const mRes = await api.get(`/meeting/group/${res.data.id}`);
          setMeetings(mRes.data.meetings || []);
        }
        setIsAllocated(true);
      } catch {
        setIsAllocated(false);
      } finally {
        setLoading(false);
      }
    };
    checkAllocation();
  }, [user, navigate, isBypass]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-surface text-on-surface gap-4">
        <div className="w-16 h-16 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center shadow-sm">
          <RefreshCw className="h-7 w-7 animate-spin text-primary" />
        </div>
        <span className="text-sm text-on-surface-variant font-medium tracking-wide">Loading your dashboard...</span>
      </div>
    );
  }

  const roleLabel = user?.smpRole === 'MENTOR' ? 'Mentor' : user?.smpRole === 'CO_MENTOR' ? 'Co-Mentor' : 'Mentee';
  const roleColor = user?.smpRole === 'MENTOR' ? 'text-primary' : user?.smpRole === 'CO_MENTOR' ? 'text-tertiary' : 'text-emerald-600';
  const upcomingCount = meetings.filter(m => new Date(m.date) >= new Date()).length;

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
          {MENTEE_TABS.filter(t => t.id !== 'feedback' || isFeedbackOpen).map(t => {
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
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer - Next Session Widget */}
        <div className="p-6 border-t border-outline-variant/20">
          <div className="bg-primary-container/30 rounded-2xl p-4 border border-primary-container/50">
            <p className="text-xs font-bold text-on-primary-container mb-1 tracking-widest uppercase">Next Session</p>
            {upcomingCount > 0 ? (
              <p className="text-sm font-semibold text-primary">{fmt.date(meetings.find(m => new Date(m.date) >= new Date())?.date)}</p>
            ) : (
              <p className="text-sm font-medium text-on-surface-variant">No upcoming meetings</p>
            )}
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
              <h1 className="text-on-surface font-semibold text-xl">Student Workspace</h1>
            </div>
            <div className="sm:hidden text-on-surface font-semibold text-lg">Student Workspace</div>
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
          {!isAllocated ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-error-container border border-error/20 flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-error" />
              </div>
              <h2 className="text-3xl font-bold text-on-surface mb-4 tracking-tight">Not Allocated</h2>
              <p className="text-on-surface-variant leading-relaxed text-base">You were not allocated to a group this time. We appreciate your interest in the SMP!</p>
              <button onClick={logout} className="mt-8 flex items-center gap-2 text-sm font-semibold text-on-surface border border-outline-variant px-6 py-3 rounded-xl hover:bg-surface-container-low transition-all duration-200">
                <LogOut className="w-4 h-4" /> Exit Portal
              </button>
            </motion.div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Welcome Section */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-xs font-bold uppercase tracking-widest mb-4">
                  <Sparkles className="w-3.5 h-3.5" /> Group Allocated
                </div>
                <h2 className="text-4xl lg:text-5xl font-bold text-on-surface tracking-tight mb-2">
                  Hey, {user?.name?.split(' ')[0]}! 👋
                </h2>
                <p className="text-on-surface-variant text-base">
                  You're in <span className="text-on-surface font-semibold">{group?.groupName}</span> · {upcomingCount} upcoming meeting{upcomingCount !== 1 ? 's' : ''}
                </p>
              </motion.div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  {tab === 'group'    && <GroupTab group={group} user={user} onMemberClick={setSelectedMember} />}
                  {tab === 'meetings' && <MeetingsTab meetings={meetings} />}
                  {tab === 'reports'  && <ReportsTab meetings={meetings} user={user} />}
                  {tab === 'feedback' && <FeedbackTab user={user} group={group} isFeedbackOpen={isFeedbackOpen} />}
                  {tab === 'profile'  && (
                    <div className="max-w-4xl">
                      <ProfileTab />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
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
