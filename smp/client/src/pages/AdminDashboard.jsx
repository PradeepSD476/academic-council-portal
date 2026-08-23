import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/toast';
import api from '../lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Shared animation variants
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } };
const staggerList = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const tabPanel = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
};
const modalVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 30 } },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.18 } },
};

// Animated number hook
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return value;
}

// ─── Small Reusable Primitives ───────────────────────────────────────────────

function SidebarLink({ icon, label, active, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-left transition-colors duration-200 group relative overflow-hidden ${
        active
          ? 'bg-[#0047ab] text-white font-semibold shadow-md shadow-[#0047ab]/25'
          : 'text-[#434653] hover:bg-[#e2ebf9] hover:text-[#001946]'
      }`}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 bg-[#0047ab] rounded-xl"
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        />
      )}
      <span className={`material-symbols-outlined text-[22px] relative z-10 transition-transform duration-200 ${active ? 'text-white' : 'group-hover:scale-110 text-[#00327d]'}`}>{icon}</span>
      <span className="text-[13px] tracking-wide font-medium relative z-10">{label}</span>
      {active && <motion.div layoutId="sidebar-accent" className="ml-auto w-1.5 h-5 rounded-full bg-white relative z-10" transition={{ type: 'spring', stiffness: 400, damping: 35 }} />}
    </motion.button>
  );
}

function Card({ children, className = '', animate = false }) {
  if (animate) {
    return (
      <motion.div
        variants={fadeUp}
        whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0,50,125,0.12)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_4px_20px_rgba(0,50,125,0.05)] border border-[#d2e0f8] ${className}`}
      >
        {children}
      </motion.div>
    );
  }
  return (
    <div className={`bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_4px_20px_rgba(0,50,125,0.05)] border border-[#d2e0f8] ${className}`}>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, id }) {
  return (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
      <input id={id} type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-14 h-8 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]" />
    </label>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="flex items-center gap-3 bg-surface-container-low border border-outline-variant/40 rounded-full px-5 py-2.5 w-full sm:w-80">
      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">search</span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="bg-transparent border-none outline-none text-sm text-on-surface placeholder:text-outline w-full"
      />
    </div>
  );
}

function Badge({ children, variant = 'blue' }) {
  const colors = {
    blue: 'bg-[#e2ebf9] text-[#00327d] border border-[#b8d1f7]',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    yellow: 'bg-amber-50 text-amber-800 border border-amber-200',
    gray: 'bg-slate-100 text-slate-700 border border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${colors[variant]}`}>
      {children}
    </span>
  );
}

function PageHeader({ breadcrumb, title, description, action }) {
  return (
    <motion.header
      variants={staggerList}
      initial="hidden"
      animate="show"
      className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pt-2 pb-2"
    >
      <motion.div variants={fadeUp} className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#0047ab] uppercase tracking-widest">Administration</span>
          <span className="text-slate-300 text-xs">•</span>
          <span className="text-[11px] font-semibold text-[#5e656c] uppercase tracking-widest">{breadcrumb}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#001946] leading-none mt-1">{title}</h1>
        {description && <p className="text-sm text-[#5e656c] max-w-2xl mt-1.5 leading-relaxed font-normal">{description}</p>}
      </motion.div>
      {action && <motion.div variants={fadeUp} className="shrink-0">{action}</motion.div>}
    </motion.header>
  );
}

function PaginationControls({ meta, setPage }) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between w-full pt-4">
      <span className="text-sm text-on-surface-variant">Total: {meta.total}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={meta.page <= 1}
          className="p-2 rounded-xl border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm text-on-surface px-2">Page {meta.page} of {meta.totalPages}</span>
        <button
          onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
          disabled={meta.page >= meta.totalPages}
          className="p-2 rounded-xl border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('config');
  const [loading, setLoading] = useState(true);

  const [config, setConfig] = useState(null);

  const [groupsData, setGroupsData] = useState({ data: [], meta: { total: 0, page: 1, totalPages: 1 } });
  const [allGroups, setAllGroups] = useState([]);
  const [groupsPage, setGroupsPage] = useState(1);
  const [groupsSearch, setGroupsSearch] = useState('');

  const [usersData, setUsersData] = useState({ data: [], meta: { total: 0, page: 1, totalPages: 1 } });
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');

  const [unassignedData, setUnassignedData] = useState({ data: [], meta: { total: 0, page: 1, totalPages: 1 } });
  const [unassignedPage, setUnassignedPage] = useState(1);
  const [unassignedSearch, setUnassignedSearch] = useState('');

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [moveUserTarget, setMoveUserTarget] = useState(null);
  const [newGroupForm, setNewGroupForm] = useState({ groupName: '', academicYear: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({ subject: '', message: '' });
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmationInput, setResetConfirmationInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchConfig = async () => { try { const res = await api.get('/admin/config'); setConfig(res.data); } catch (err) {} };
  const fetchGroups = async () => { try { const res = await api.get(`/admin/groups?page=${groupsPage}&search=${groupsSearch}`); if (res.data.data) { setGroupsData(res.data); } else { setGroupsData({ data: res.data, meta: { total: res.data.length, page: 1, totalPages: 1 } }); } } catch (err) {} };
  const fetchUsers = async () => { try { const res = await api.get(`/admin/users?page=${usersPage}&search=${usersSearch}`); if (res.data.data) setUsersData(res.data); } catch (err) {} };
  const fetchUnassigned = async () => { try { const res = await api.get(`/admin/users/unassigned?page=${unassignedPage}&search=${unassignedSearch}`); if (res.data.data) setUnassignedData(res.data); } catch (err) {} };
  const fetchAllGroups = async () => { try { const res = await api.get('/admin/groups?limit=10000'); if (res.data.data) setAllGroups(res.data.data); } catch (err) {} };

  const fetchAllInitial = async () => {
    setLoading(true);
    await Promise.all([fetchConfig(), fetchGroups(), fetchUsers(), fetchUnassigned(), fetchAllGroups()]);
    setLoading(false);
  };

  useEffect(() => { fetchAllInitial(); }, []);
  useEffect(() => { if (!loading && activeTab === 'groups') fetchGroups(); }, [groupsPage, groupsSearch, activeTab]);
  useEffect(() => { if (!loading && activeTab === 'users') fetchUsers(); }, [usersPage, usersSearch, activeTab]);
  useEffect(() => { if (!loading && activeTab === 'unassigned') fetchUnassigned(); }, [unassignedPage, unassignedSearch, activeTab]);

  const handleConfigUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/admin/config', config);
      setConfig(res.data.config);
      toast({ title: 'Configuration updated successfully', variant: 'success' });
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Failed to update config', variant: 'error' });
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Delete this group? All assigned users will be marked as UNASSIGNED.')) return;
    try {
      await api.delete('/admin/groups/' + groupId);
      toast({ title: 'Group deleted successfully', variant: 'success' });
      if (selectedGroup?.id === groupId) setSelectedGroup(null);
      fetchGroups(); fetchUnassigned(); fetchAllGroups();
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Error deleting group', variant: 'error' });
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/admin/groups', newGroupForm);
      toast({ title: 'Group created successfully', variant: 'success' });
      setShowCreateGroup(false);
      setNewGroupForm({ groupName: '', academicYear: config?.currentAcademicYear || '' });
      fetchGroups(); fetchAllGroups();
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Error creating group', variant: 'error' });
    } finally { setIsSubmitting(false); }
  };

  const handleMoveUser = async (e) => {
    e.preventDefault();
    if (!moveUserTarget?.user || !moveUserTarget?.groupId || !moveUserTarget?.role) {
      return toast({ title: 'Please select all required fields', variant: 'error' });
    }
    setIsSubmitting(true);
    try {
      await api.post('/admin/groups/move', { userId: moveUserTarget.user.id, targetGroupId: moveUserTarget.groupId, targetRole: moveUserTarget.role });
      toast({ title: 'User assigned successfully', variant: 'success' });
      setMoveUserTarget(null);
      if (selectedGroup) {
         const updated = await api.get(`/admin/groups/${selectedGroup.id}`);
         setSelectedGroup(updated.data);
      }
      fetchGroups(); fetchUsers(); fetchUnassigned();
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Error moving user', variant: 'error' });
    } finally { setIsSubmitting(false); }
  };

  const handleRemoveUserFromGroup = async (userId, groupId) => {
    if (!window.confirm('Are you sure you want to remove this user from the group?')) return;
    try {
      await api.post('/admin/groups/remove-user', { userId, groupId });
      toast({ title: 'User removed successfully', variant: 'success' });
      if (selectedGroup) {
         const updated = await api.get(`/admin/groups/${selectedGroup.id}`);
         setSelectedGroup(updated.data);
      }
      fetchGroups(); fetchUsers(); fetchUnassigned();
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Error removing user', variant: 'error' });
    }
  };

  const handleReset = async () => {
    if (resetConfirmationInput.trim().toUpperCase() !== 'RESET DATABASE') {
      return toast({
        title: 'Confirmation phrase mismatch',
        description: 'Please type "RESET DATABASE" exactly as requested.',
        variant: 'error',
      });
    }
    setIsResetting(true);
    try {
      await api.post('/admin/reset');
      toast({
        title: 'Database Reset Successful',
        description: 'All non-admin users, groups, allocations, and responses have been cleared.',
        variant: 'success',
      });
      setShowResetModal(false);
      setResetConfirmationInput('');
      fetchAllInitial();
    } catch (err) {
      toast({
        title: 'Error resetting database',
        description: err.response?.data?.message || 'Server error',
        variant: 'error',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.subject.trim() || !announcementForm.message.trim()) {
      return toast({ title: 'Subject and message are required', variant: 'error' });
    }
    setIsSendingAnnouncement(true);
    try {
      const res = await api.post('/admin/announcements', announcementForm);
      toast({ title: 'Announcement sent', description: `${res.data.recipientCount} recipients notified`, variant: 'success' });
      setAnnouncementForm({ subject: '', message: '' });
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Error sending announcement', variant: 'error' });
    } finally { setIsSendingAnnouncement(false); }
  };

  const getUserGroupName = (u) => {
    if (u.mentorGroups?.length > 0) return u.mentorGroups.map(g => g.groupName).join(', ');
    if (u.coMentorGroups?.length > 0) return u.coMentorGroups[0].groupName;
    if (u.menteeGroups?.length > 0) return u.menteeGroups[0].groupName;
    return 'None';
  };

  const handleExportCSV = async (endpoint, defaultFilename) => {
    setIsExporting(true);
    try {
      const res = await api.get(endpoint, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', defaultFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast({ title: 'Export Successful', description: `Downloaded ${defaultFilename}`, variant: 'success' });
    } catch (err) {
      console.error('Export error:', err);
      toast({ title: 'Export Failed', description: err.response?.data?.message || 'Error generating export file', variant: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-surface">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary"
            />
            <div className="absolute inset-3 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[16px]">settings</span>
            </div>
          </div>
          <p className="text-sm text-on-surface-variant font-medium">Loading admin portal...</p>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { key: 'config', icon: 'settings', label: 'Configuration' },
    { key: 'announcements', icon: 'campaign', label: 'Announcements' },
    { key: 'analytics', icon: 'analytics', label: 'Observability' },
    { key: 'groups', icon: 'groups', label: 'Groups' },
    { key: 'users', icon: 'person_search', label: 'Users' },
    { key: 'unassigned', icon: 'pending_actions', label: 'Unassigned' },
  ];
  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Fixed Left Sidebar (Cool Light Blue Theme) ── */}
      <aside className={`fixed left-0 top-0 h-full w-72 bg-[#f0f4fb] z-50 flex flex-col shadow-[4px_0_24px_rgba(0,50,125,0.06)] border-r border-[#d5e2f7] transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand Header */}
        <div className="px-7 h-20 flex items-center gap-3 border-b border-[#d5e2f7] bg-gradient-to-r from-[#00327d] to-[#0047ab] text-white">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-inner">
            <span className="text-white font-black text-[11px] tracking-wider">SMP</span>
          </div>
          <div>
            <div className="text-sm font-extrabold tracking-tight">IIT Patna</div>
            <div className="text-[11px] text-white/80 font-medium">Admin Portal</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 mt-6 space-y-1.5">
          {navItems.map(item => (
            <SidebarLink
              key={item.key}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.key}
              onClick={() => {
                setActiveTab(item.key);
                setIsMobileMenuOpen(false);
              }}
            />
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-[#d5e2f7] bg-[#e6eeea]/30">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 border border-[#d5e2f7]">
            <div className="w-9 h-9 rounded-full bg-[#00327d] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[#001946] truncate">{user?.name || 'Admin'}</div>
              <div className="text-[11px] text-[#434653] truncate">{user?.email}</div>
            </div>
            <button onClick={logout} title="Logout" className="p-1.5 rounded-lg text-[#434653] hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Content Area ── */}
      <div className="pl-0 md:pl-72 transition-all duration-300">
        {/* Fixed Top Header (Clean Minimal Glass Bar) */}
        <header className="fixed top-0 left-0 md:left-72 right-0 h-16 bg-white/70 backdrop-blur-md z-40 flex items-center justify-between px-4 md:px-10 border-b border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-300">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-[#001946] hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <AnimatePresence mode="wait">
              <motion.h2
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="text-sm font-bold text-[#001946] capitalize tracking-wide"
              >
                {navItems.find(n => n.key === activeTab)?.label}
              </motion.h2>
            </AnimatePresence>
            <p className="text-[11px] text-[#0047ab] font-medium">{new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-9 h-9 rounded-full bg-slate-100/80 border border-slate-200/80 flex items-center justify-center text-[#00327d] hover:bg-[#0047ab] hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[18px]">notifications</span>
            </motion.button>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-20 md:pt-16 px-4 md:px-10 py-6 md:py-8 min-h-screen relative">
          {/* Ambient Background Gradients */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[70%] bg-blue-300/20 blur-[140px] rounded-full mix-blend-multiply"></div>
            <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[70%] bg-amber-200/30 blur-[140px] rounded-full mix-blend-multiply"></div>
            <div className="absolute bottom-[10%] left-[20%] w-[50%] h-[50%] bg-indigo-200/10 blur-[140px] rounded-full mix-blend-multiply"></div>
          </div>
          <div className="relative z-10 max-w-[1280px] mx-auto">
            <AnimatePresence mode="wait">
            {activeTab === 'analytics' && (
              <motion.div key="analytics" variants={tabPanel} initial="hidden" animate="show" exit="exit">
                <AnalyticsTab />
              </motion.div>
            )}
            {activeTab === 'config' && (
              <motion.div key="config" variants={tabPanel} initial="hidden" animate="show" exit="exit">
                <PageHeader
                  breadcrumb="System Configs"
                  title="Portal Configuration"
                  description="Manage academic cycles, registration states, and system lifecycle operations."
                  action={
                    <button
                      form="config-form"
                      type="submit"
                      className="h-12 px-8 flex items-center gap-2 rounded-full bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container shadow-[0_8px_16px_rgba(0,50,125,0.2)] transition-all hover:-translate-y-0.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      Save Changes
                    </button>
                  }
                />
                <form id="config-form" onSubmit={handleConfigUpdate}>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Primary Configs */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                      {/* Academic Cycle Card */}
                      <Card className="p-8">
                        <div className="flex items-center gap-4 border-b border-outline-variant/30 pb-6 mb-8">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                          </div>
                          <div>
                            <h2 className="text-base font-semibold text-on-surface">Academic Cycle</h2>
                            <p className="text-xs text-on-surface-variant mt-0.5">Define the current operational timeline</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="flex flex-col gap-2">
                            <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold ml-1">Active Academic Year</label>
                            <div className="relative group">
                              <input
                                type="text"
                                value={config.currentAcademicYear}
                                onChange={e => setConfig({ ...config, currentAcademicYear: e.target.value })}
                                className="w-full bg-surface-container-low text-on-surface text-base px-5 py-4 rounded-xl border-none outline-none transition-all duration-300 focus:bg-surface focus:shadow-[0_0_0_2px_rgba(0,50,125,0.8)] hover:bg-surface-container-high"
                              />
                              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px] pointer-events-none">edit</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold ml-1">Batch Prefixes (Y1 / Y2 / Y3)</label>
                            <div className="flex gap-3">
                              {[
                                { key: 'firstYearBatchPrefix', label: 'Y1' },
                                { key: 'secondYearBatchPrefix', label: 'Y2' },
                                { key: 'thirdYearBatchPrefix', label: 'Y3' },
                              ].map(({ key, label }) => (
                                <div key={key} className="flex-1 bg-surface-container-low rounded-xl px-3 py-3 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-surface-container-high transition-colors">
                                  <span className="text-[10px] text-on-surface-variant mb-1 font-semibold">{label}</span>
                                  <input
                                    type="text"
                                    value={config[key]}
                                    onChange={e => setConfig({ ...config, [key]: e.target.value })}
                                    className="w-full bg-transparent border-none outline-none text-center text-base font-semibold text-primary"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* Phase Control Card */}
                      <Card className="p-8">
                        <div className="flex items-center gap-4 border-b border-outline-variant/30 pb-6 mb-8">
                          <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                            <span className="material-symbols-outlined text-[20px]">toggle_on</span>
                          </div>
                          <div>
                            <h2 className="text-base font-semibold text-on-surface">Phase Control</h2>
                            <p className="text-xs text-on-surface-variant mt-0.5">Manage platform availability windows</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {[
                            { key: 'isRegistrationOpen', icon: 'how_to_reg', label: 'Registration Open', desc: 'Allow new mentors and mentees to sign up', color: 'bg-primary/10 text-primary' },
                            { key: 'isAllocationComplete', icon: 'account_tree', label: 'Allocation Complete', desc: 'Lock all current mentor-mentee pairings', color: 'bg-outline-variant/20 text-on-surface-variant' },
                            { key: 'isFeedbackOpen', icon: 'reviews', label: 'Feedback Open', desc: 'Enable end-of-year survey collection', color: 'bg-primary/10 text-primary' },
                          ].map(({ key, icon, label, desc, color }, i, arr) => (
                            <React.Fragment key={key}>
                              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-container-low transition-colors group">
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${color}`}>
                                    <span className="material-symbols-outlined">{icon}</span>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-on-surface">{label}</div>
                                    <div className="text-xs text-on-surface-variant mt-0.5">{desc}</div>
                                  </div>
                                </div>
                                <Toggle
                                  id={key}
                                  checked={config[key]}
                                  onChange={e => setConfig({ ...config, [key]: e.target.checked })}
                                />
                              </div>
                              {i < arr.length - 1 && <div className="h-px w-full bg-outline-variant/20" />}
                            </React.Fragment>
                          ))}
                        </div>
                      </Card>

                      {/* Student Access Control Card */}
                      <Card className="p-8">
                        <div className="flex items-center gap-4 border-b border-outline-variant/30 pb-6 mb-8">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                          </div>
                          <div>
                            <h2 className="text-base font-semibold text-on-surface">Student Access Control</h2>
                            <p className="text-xs text-on-surface-variant mt-0.5">Control login & registration access per batch/year</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {[
                            { key: 'allowFirstYearLogin', icon: 'looks_one', label: 'Allow First-Year Access', desc: `Enable login & signup for 1st year (Prefix: ${config.firstYearBatchPrefix})`, color: 'bg-primary/10 text-primary' },
                            { key: 'allowSecondYearLogin', icon: 'looks_two', label: 'Allow Second-Year Access', desc: `Enable login & signup for 2nd year (Prefix: ${config.secondYearBatchPrefix})`, color: 'bg-primary/10 text-primary' },
                            { key: 'allowThirdYearLogin', icon: 'looks_3', label: 'Allow Third-Year Access', desc: `Enable login & signup for 3rd year (Prefix: ${config.thirdYearBatchPrefix})`, color: 'bg-primary/10 text-primary' },
                          ].map(({ key, icon, label, desc, color }, i, arr) => (
                            <React.Fragment key={key}>
                              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-container-low transition-colors group">
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${color}`}>
                                    <span className="material-symbols-outlined">{icon}</span>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-on-surface">{label}</div>
                                    <div className="text-xs text-on-surface-variant mt-0.5">{desc}</div>
                                  </div>
                                </div>
                                <Toggle
                                  id={key}
                                  checked={config[key] ?? true}
                                  onChange={e => setConfig({ ...config, [key]: e.target.checked })}
                                />
                              </div>
                              {i < arr.length - 1 && <div className="h-px w-full bg-outline-variant/20" />}
                            </React.Fragment>
                          ))}
                        </div>
                      </Card>
                    </div>

                    {/* Right Column: Platform Overview & System Status */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                      {/* Stats Widget */}
                      <div className="bg-primary text-on-primary rounded-3xl p-6 shadow-lg relative overflow-hidden" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 12px 24px rgba(0,50,125,0.2)' }}>
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                        <div className="absolute -right-6 -bottom-6 opacity-20 rotate-12">
                          <span className="material-symbols-outlined text-[100px]">analytics</span>
                        </div>
                        <p className="text-[11px] tracking-widest uppercase opacity-80 font-semibold mb-4 relative z-10">Platform Overview</p>
                        <div className="flex items-end gap-2 relative z-10 mb-4">
                          <AnimatedCount value={usersData.meta.total} className="text-5xl font-bold leading-none" />
                          <span className="text-base opacity-80 mb-1">users</span>
                        </div>
                        <div className="flex flex-col gap-2 relative z-10">
                          <div className="flex justify-between text-[11px] opacity-80">
                            <span>Groups</span>
                            <span>{groupsData.meta.total}</span>
                          </div>
                          <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (groupsData.meta.total / Math.max(1, usersData.meta.total)) * 100 * 5)}%` }}
                              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                              className="h-full bg-white rounded-full"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Official Data Exports Card */}
                      <div className="bg-surface rounded-3xl p-6 border border-outline-variant/30 flex flex-col gap-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[18px]">file_download</span>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-on-surface">Data Exports</h3>
                            <p className="text-[11px] text-on-surface-variant">Official tables & spreadsheets</p>
                          </div>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          Download master sheets formatted for official institute administration and reporting.
                        </p>
                        
                        <div className="space-y-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleExportCSV('/admin/export/groups?format=roster', `smp_official_groups_roster_${config?.currentAcademicYear || 'latest'}.csv`)}
                            disabled={isExporting}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 text-left transition-colors group text-xs font-semibold text-on-surface"
                          >
                            <span className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-primary">table_chart</span>
                              Official Groups Roster
                            </span>
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:translate-x-0.5 transition-transform">download</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleExportCSV('/admin/export/users', `smp_all_users_${config?.currentAcademicYear || 'latest'}.csv`)}
                            disabled={isExporting}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 text-left transition-colors group text-xs font-semibold text-on-surface"
                          >
                            <span className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-tertiary">group</span>
                              All Registered Users
                            </span>
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:translate-x-0.5 transition-transform">download</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExportCSV('/admin/export/groups?format=members', `smp_group_members_mapping_${config?.currentAcademicYear || 'latest'}.csv`)}
                            disabled={isExporting}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 text-left transition-colors group text-xs font-semibold text-on-surface"
                          >
                            <span className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-emerald-600">view_list</span>
                              Member-by-Row Table
                            </span>
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:translate-x-0.5 transition-transform">download</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>

                {/* ── BOTTOM: GITHUB-STYLE DANGER ZONE ── */}
                <div className="mt-12 pt-8 border-t border-error/20">
                  <div className="bg-error/[0.03] border-2 border-error/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-error via-rose-500 to-error" />
                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-error/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-error/10 border border-error/25 flex items-center justify-center text-error shrink-0">
                          <span className="material-symbols-outlined text-[24px]">warning</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="text-lg font-bold text-error">Danger Zone</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-error/15 text-error border border-error/30">
                              Destructive Action
                            </span>
                          </div>
                          <p className="text-sm text-on-surface-variant mt-1.5 max-w-2xl leading-relaxed">
                            Permanently wipe all student records, allocations, groups, questionnaire responses, meetings, and feedback for the current academic cycle. Admin credentials will remain intact.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setResetConfirmationInput('');
                          setShowResetModal(true);
                        }}
                        className="shrink-0 h-12 px-6 flex items-center justify-center gap-2 rounded-xl bg-error/10 hover:bg-error text-error hover:text-on-error font-semibold text-sm border border-error/30 hover:border-error transition-all duration-200 shadow-sm hover:shadow-error/20 hover:shadow-lg"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                        Reset Database...
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── GITHUB-STYLE RESET DATABASE MODAL ── */}
                {showResetModal && (
                  <Modal
                    onClose={() => {
                      if (!isResetting) {
                        setShowResetModal(false);
                        setResetConfirmationInput('');
                      }
                    }}
                    title="Reset Platform Database"
                  >
                    <div className="p-6 sm:p-8 space-y-6">
                      {/* Warning Notice */}
                      <div className="p-4 rounded-2xl bg-error/10 border border-error/30 flex items-start gap-3.5 text-error">
                        <span className="material-symbols-outlined text-[24px] mt-0.5 shrink-0">emergency_home</span>
                        <div className="text-xs sm:text-sm leading-relaxed">
                          <strong className="block text-error font-bold mb-1">Warning: This action is permanent and cannot be undone.</strong>
                          This will immediately delete all <span className="font-semibold underline">students, groups, allocations, questionnaire responses, meeting records, and feedback</span>.
                        </div>
                      </div>

                      {/* Confirmation Prompt */}
                      <div className="space-y-3">
                        <label className="block text-xs sm:text-sm text-on-surface leading-relaxed">
                          Please type <strong className="font-mono bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant/40 text-error select-all">RESET DATABASE</strong> below to confirm:
                        </label>
                        <input
                          type="text"
                          value={resetConfirmationInput}
                          onChange={(e) => setResetConfirmationInput(e.target.value)}
                          placeholder="RESET DATABASE"
                          disabled={isResetting}
                          autoFocus
                          className="w-full bg-surface-container-low text-on-surface font-mono text-sm px-4 py-3.5 rounded-xl border border-outline-variant/50 focus:outline-none focus:border-error focus:ring-2 focus:ring-error/20 transition-all placeholder:text-outline-variant uppercase"
                        />
                      </div>

                      {/* Modal Actions */}
                      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowResetModal(false);
                            setResetConfirmationInput('');
                          }}
                          disabled={isResetting}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-outline-variant/40 text-on-surface-variant font-medium text-sm hover:bg-surface-container-low transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleReset}
                          disabled={resetConfirmationInput.trim().toUpperCase() !== 'RESET DATABASE' || isResetting}
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-error text-on-error font-semibold text-sm hover:bg-error/90 disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-error/20"
                        >
                          {isResetting ? (
                            <>
                              <span className="w-4 h-4 border-2 border-on-error/30 border-t-on-error rounded-full animate-spin" />
                              Resetting Database...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                              I understand, delete all data
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </Modal>
                )}
              </motion.div>
            )}

            {/* ── ANNOUNCEMENTS TAB ── */}
            {activeTab === 'announcements' && (
              <motion.div key="announcements" variants={tabPanel} initial="hidden" animate="show" exit="exit">
                <PageHeader
                  breadcrumb="Communications"
                  title="Broadcast Announcement"
                  description="Send a bulk email to every active participant in the mentorship program."
                />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-2 p-8">
                    <form onSubmit={handleSendAnnouncement} className="space-y-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold ml-1">Subject Line</label>
                        <input
                          type="text"
                          value={announcementForm.subject}
                          onChange={e => setAnnouncementForm({ ...announcementForm, subject: e.target.value })}
                          placeholder="e.g. Orientation schedule update"
                          className="w-full bg-surface-container-low text-on-surface px-5 py-4 rounded-xl outline-none transition-all duration-300 focus:bg-surface focus:shadow-[0_0_0_2px_rgba(0,50,125,0.8)] hover:bg-surface-container-high text-base"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold ml-1">Message Body</label>
                        <textarea
                          value={announcementForm.message}
                          onChange={e => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                          placeholder="Write the announcement message here..."
                          rows={10}
                          className="w-full bg-surface-container-low text-on-surface px-5 py-4 rounded-xl outline-none transition-all duration-300 focus:bg-surface focus:shadow-[0_0_0_2px_rgba(0,50,125,0.8)] hover:bg-surface-container-high text-base resize-y"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSendingAnnouncement}
                        className="h-12 px-8 flex items-center gap-2 rounded-full bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container shadow-[0_8px_16px_rgba(0,50,125,0.2)] transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
                      >
                        {isSendingAnnouncement ? (
                          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</>
                        ) : (
                          <><span className="material-symbols-outlined text-[18px]">send</span>Send Announcement</>
                        )}
                      </button>
                    </form>
                  </Card>

                  <div className="flex flex-col gap-6">
                    <Card className="p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[18px]">info</span>
                        </div>
                        <h3 className="text-sm font-semibold text-on-surface">Delivery Notes</h3>
                      </div>
                      <div className="space-y-3 text-sm text-on-surface-variant">
                        <p>Messages are emailed to all users except admins.</p>
                        <p>BCC delivery is used to avoid exposing recipient addresses.</p>
                        <p>Use short, actionable subjects for better engagement.</p>
                      </div>
                    </Card>
                    <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="material-symbols-outlined text-primary text-[20px]">group</span>
                        <h3 className="text-sm font-semibold text-primary">Recipients</h3>
                      </div>
                      <div className="text-3xl font-bold text-on-surface">{usersData.meta.total}</div>
                      <div className="text-xs text-on-surface-variant mt-1">registered participants</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── GROUPS TAB ── */}
            {activeTab === 'groups' && (
              <motion.div key="groups" variants={tabPanel} initial="hidden" animate="show" exit="exit">
                <PageHeader
                  breadcrumb="Groups"
                  title="Mentorship Groups"
                  description="View, manage, and export all mentor-mentee group allocations."
                  action={
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleExportCSV('/admin/export/groups?format=roster', `smp_groups_roster_${config?.currentAcademicYear || 'latest'}.csv`)}
                        disabled={isExporting}
                        className="h-11 px-4 flex items-center gap-2 rounded-xl border border-outline-variant/60 bg-surface hover:bg-surface-container-high text-on-surface font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
                        title="Download Official Institute Table with Lead Mentors, Co-Mentors, and Mentees (Name & Roll)"
                      >
                        <span className="material-symbols-outlined text-[18px] text-primary">table_chart</span>
                        Export Official Roster
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleExportCSV('/admin/export/groups?format=members', `smp_group_members_${config?.currentAcademicYear || 'latest'}.csv`)}
                        disabled={isExporting}
                        className="h-11 px-4 flex items-center gap-2 rounded-xl border border-outline-variant/60 bg-surface hover:bg-surface-container-high text-on-surface font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
                        title="Download Row-by-Row Member Assignment List"
                      >
                        <span className="material-symbols-outlined text-[18px] text-tertiary">download</span>
                        Export Members List
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowCreateGroup(true)}
                        className="h-11 px-5 flex items-center gap-2 rounded-xl bg-primary text-on-primary font-semibold text-xs shadow-[0_8px_16px_rgba(0,50,125,0.2)]"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Create Group
                      </motion.button>
                    </div>
                  }
                />
                <div className="mb-6">
                  <SearchBar
                    value={groupsSearch}
                    onChange={e => { setGroupsSearch(e.target.value); setGroupsPage(1); }}
                    placeholder="Search groups..."
                  />
                </div>

                {groupsData.data.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[48px] mb-3 opacity-30">group_off</span>
                    <p className="text-sm">No groups found.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={staggerList}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  >
                    {groupsData.data.map(group => (
                      <Card key={group.id} animate className="p-6 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-5">
                          <div>
                            <h3 className="text-base font-bold text-on-surface">{group.groupName}</h3>
                            <Badge variant="blue">{group.mentees?.length || 0} Mentees</Badge>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <span className="material-symbols-outlined text-[20px]">groups</span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm mb-5 flex-1">
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Mentor</span>
                            <span className="text-on-surface font-medium truncate max-w-[140px]">{group.mentor?.name || '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Co-Mentors</span>
                            <span className="text-on-surface font-medium truncate max-w-[140px]">{group.coMentors?.map(c => c.name).join(', ') || '—'}</span>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedGroup(group)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border border-outline-variant/50 text-sm font-medium text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors mt-auto"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          View Details
                        </motion.button>
                      </Card>
                    ))}
                  </motion.div>
                )}
                <PaginationControls meta={groupsData.meta} setPage={setGroupsPage} />
              </motion.div>
            )}

            {/* ── USERS TAB ── */}
            {activeTab === 'users' && (
              <motion.div key="users" variants={tabPanel} initial="hidden" animate="show" exit="exit">
                <PageHeader
                  breadcrumb="Users"
                  title="User Directory"
                  description="Search, inspect, and export all registered participants."
                  action={
                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleExportCSV('/admin/export/users', `smp_all_users_${config?.currentAcademicYear || 'latest'}.csv`)}
                      disabled={isExporting}
                      className="h-11 px-5 flex items-center gap-2 rounded-xl border border-outline-variant/60 bg-surface hover:bg-surface-container-high text-on-surface font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
                      title="Download Master Sheet of All Users (Roll, Name, Role, Group, Questionnaire status)"
                    >
                      <span className="material-symbols-outlined text-[18px] text-primary">download</span>
                      Export Users CSV
                    </motion.button>
                  }
                />
                <Card className="overflow-hidden">
                  <div className="p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <SearchBar
                      value={usersSearch}
                      onChange={e => { setUsersSearch(e.target.value); setUsersPage(1); }}
                      placeholder="Search by name, email, roll..."
                    />
                    <span className="text-sm text-on-surface-variant">{usersData.meta.total} total</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#e8f1fd] text-[#00327d] border-b border-[#c5dafa]">
                        <tr>
                          <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider">Name</th>
                          <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider">Roll No.</th>
                          <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider">Role</th>
                          <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider">Group</th>
                          <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {usersData.data.map((u, i) => (
                          <motion.tr
                            key={u.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.25 }}
                            className="hover:bg-surface-container-low/60 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium text-on-surface">{u.name}</td>
                            <td className="px-6 py-4 text-on-surface-variant font-mono text-xs">{u.rollNumber}</td>
                            <td className="px-6 py-4"><Badge variant="blue">{u.smpRole}</Badge></td>
                            <td className="px-6 py-4 text-on-surface-variant text-xs">{getUserGroupName(u)}</td>
                            <td className="px-6 py-4">
                              {u.response ? <Badge variant="green">Onboarded</Badge> : <Badge variant="yellow">Pending</Badge>}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setSelectedUser(u)}
                                className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                              </motion.button>
                            </td>
                          </motion.tr>
                        ))}
                        {usersData.data.length === 0 && (
                          <tr><td colSpan="6" className="px-6 py-16 text-center text-on-surface-variant">No users found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-4 border-t border-outline-variant/20">
                    <PaginationControls meta={usersData.meta} setPage={setUsersPage} />
                  </div>
                </Card>
              </motion.div>
            )}

            {/* ── UNASSIGNED TAB ── */}
            {activeTab === 'unassigned' && (
              <motion.div key="unassigned" variants={tabPanel} initial="hidden" animate="show" exit="exit">
                <PageHeader
                  breadcrumb="Unassigned"
                  title="Unassigned Participants"
                  description={`${unassignedData.meta.total} registered users waiting to be placed in a group.`}
                />
                <Card className="overflow-hidden">
                  <div className="p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <SearchBar
                      value={unassignedSearch}
                      onChange={e => { setUnassignedSearch(e.target.value); setUnassignedPage(1); }}
                      placeholder="Search unassigned users..."
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#e8f1fd] text-[#00327d] border-b border-[#c5dafa]">
                        <tr>
                          <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider">Name</th>
                          <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider">Roll No.</th>
                          <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {unassignedData.data.map((u, i) => {
                          let expectedRole = 'MENTEE';
                          if (config?.thirdYearBatchPrefix && u.rollNumber.startsWith(config.thirdYearBatchPrefix)) expectedRole = 'MENTOR';
                          else if (config?.secondYearBatchPrefix && u.rollNumber.startsWith(config.secondYearBatchPrefix)) expectedRole = 'CO_MENTOR';
                          return (
                            <motion.tr
                              key={u.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04, duration: 0.25 }}
                              className="hover:bg-surface-container-low/60 transition-colors"
                            >
                              <td className="px-6 py-4 font-medium text-on-surface">{u.name}</td>
                              <td className="px-6 py-4 text-on-surface-variant font-mono text-xs">{u.rollNumber}</td>
                              <td className="px-6 py-4">
                                {u.response ? <Badge variant="green">Onboarded</Badge> : <Badge variant="yellow">Pending</Badge>}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <motion.button
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => setMoveUserTarget({ user: u, role: expectedRole, groupId: '' })}
                                  className="px-4 py-2 rounded-full bg-[#00327d] text-white text-xs font-semibold hover:bg-[#0047ab] transition-all duration-200 shadow-sm"
                                >
                                  Assign
                                </motion.button>
                              </td>
                            </motion.tr>
                          );
                        })}
                        {unassignedData.data.length === 0 && (
                          <tr><td colSpan="4" className="px-6 py-16 text-center text-on-surface-variant">
                            <span className="material-symbols-outlined text-[40px] block mb-2 opacity-30">check_circle</span>
                            All users are assigned!
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-4 border-t border-outline-variant/20">
                    <PaginationControls meta={unassignedData.meta} setPage={setUnassignedPage} />
                  </div>
                </Card>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ── MODALS ── */}

      {/* Group Detail Modal */}
      {selectedGroup && (
        <Modal onClose={() => setSelectedGroup(null)} title={selectedGroup.groupName} wide>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-on-surface flex-1">{selectedGroup.groupName}</h2>
            <button
              onClick={() => handleDeleteGroup(selectedGroup.id)}
              className="px-4 py-2 rounded-xl border border-error/40 text-error text-xs font-semibold hover:bg-error/5 transition-colors"
            >
              Delete Group
            </button>
          </div>
          <div className="space-y-6">
            {[
              { label: 'Mentor', color: 'text-on-surface', members: selectedGroup.mentor ? [selectedGroup.mentor] : [], role: 'MENTOR' },
              { label: 'Co-Mentors', color: 'text-primary', members: selectedGroup.coMentors || [], role: 'CO_MENTOR' },
              { label: 'Mentees', color: 'text-green-600', members: selectedGroup.mentees || [], role: 'MENTEE' },
            ].map(({ label, color, members, role }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider ${color}`}>{label}</h3>
                  {role === 'MENTOR' && (
                    <button
                      onClick={() => setMoveUserTarget({ user: selectedGroup.mentor || { name: 'New Mentor', id: '' }, role: 'MENTOR', groupId: selectedGroup.id, isAssignMentorMode: true })}
                      className="text-xs font-bold text-primary hover:text-primary-container transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      {selectedGroup.mentor ? 'Change Mentor' : '+ Assign Mentor'}
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {members.length > 0 ? members.map(m => (
                    <div key={m.id} className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl">
                      <div>
                        <div className="font-medium text-sm text-on-surface">{m.name}</div>
                        <div className="text-xs text-on-surface-variant">{m.rollNumber}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setMoveUserTarget({ user: m, role, groupId: '' }); }}
                          className="px-3 py-1.5 rounded-full border border-outline-variant/50 text-xs font-medium text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                        >
                          Move
                        </button>
                        <button
                          onClick={() => handleRemoveUserFromGroup(m.id, selectedGroup.id)}
                          className="px-2 py-1.5 rounded-full border border-outline-variant/50 text-xs font-medium text-error hover:bg-error hover:text-white transition-colors flex items-center justify-center"
                          title="Remove from group"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="p-4 rounded-xl border border-dashed border-outline-variant/30 text-center">
                      <p className="text-sm text-on-surface-variant mb-2">No mentor assigned to this group yet.</p>
                      <button
                        onClick={() => setMoveUserTarget({ user: { name: 'Select Mentor', id: '' }, role: 'MENTOR', groupId: selectedGroup.id, isAssignMentorMode: true })}
                        className="px-4 py-2 rounded-full bg-primary text-on-primary font-bold text-xs hover:bg-primary-container transition-colors"
                      >
                        + Assign Mentor to Group
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <Modal onClose={() => setSelectedUser(null)} title="User Profile">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary-container/40 flex items-center justify-center text-primary font-bold text-lg">
              {selectedUser.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">{selectedUser.name}</h3>
              <p className="text-sm text-on-surface-variant">{selectedUser.rollNumber} · {selectedUser.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="blue">{selectedUser.smpRole}</Badge>
                <Badge variant="gray">{getUserGroupName(selectedUser)}</Badge>
              </div>
            </div>
          </div>
          {selectedUser.response && (
            <div className="space-y-4 pt-4 border-t border-outline-variant/20">
              <div>
                <h4 className="text-xs text-on-surface-variant mb-1">Branch</h4>
                <p className="text-sm bg-surface-container-low px-4 py-2.5 rounded-xl">{selectedUser.response.branch}</p>
              </div>
              <div>
                <h4 className="text-xs text-on-surface-variant mb-2">Tech Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.response.techInterests.map(i => <Badge key={i} variant="blue">{i}</Badge>)}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Assign User Modal */}
      {moveUserTarget && (
        <Modal onClose={() => setMoveUserTarget(null)} title={moveUserTarget.isAssignMentorMode ? `Assign Mentor to Group` : `Assign ${moveUserTarget.user?.name}`}>
          <form onSubmit={handleMoveUser} className="space-y-5">
            {moveUserTarget.isAssignMentorMode ? (
              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Select Mentor User</label>
                <select
                  value={moveUserTarget.user?.id || ''}
                  onChange={e => {
                    const selectedU = usersData.data.find(u => u.id === e.target.value) || { id: e.target.value, name: 'Selected User' };
                    setMoveUserTarget({ ...moveUserTarget, user: selectedU });
                  }}
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3.5 text-on-surface outline-none text-sm"
                  required
                >
                  <option value="" disabled>Select a mentor...</option>
                  {usersData.data
                    .filter(u => u.smpRole === 'MENTOR' || (config?.thirdYearBatchPrefix && u.rollNumber.startsWith(config.thirdYearBatchPrefix)))
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.rollNumber}) — {getUserGroupName(u) === 'None' ? 'Unassigned' : `Assigned: ${getUserGroupName(u)}`}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Role</label>
                <select
                  value={moveUserTarget.role}
                  onChange={e => setMoveUserTarget({ ...moveUserTarget, role: e.target.value })}
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3.5 text-on-surface outline-none text-sm"
                >
                  <option value="MENTOR">Mentor</option>
                  <option value="CO_MENTOR">Co-Mentor</option>
                  <option value="MENTEE">Mentee</option>
                </select>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Target Group</label>
              <select
                value={moveUserTarget.groupId}
                onChange={e => setMoveUserTarget({ ...moveUserTarget, groupId: e.target.value })}
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3.5 text-on-surface outline-none text-sm"
                required
              >
                <option value="" disabled>Select a group...</option>
                {allGroups.map(g => <option key={g.id} value={g.id}>{g.groupName}</option>)}
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-full bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container shadow-[0_8px_16px_rgba(0,50,125,0.2)] transition-all disabled:opacity-60 disabled:pointer-events-none"
            >
              {isSubmitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : 'Confirm Assignment'}
            </button>
          </form>
        </Modal>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <Modal onClose={() => setShowCreateGroup(false)} title="Create New Group">
          <form onSubmit={handleCreateGroup} className="space-y-5">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Group Name</label>
              <input
                type="text"
                value={newGroupForm.groupName}
                onChange={e => setNewGroupForm({ ...newGroupForm, groupName: e.target.value })}
                placeholder="e.g. SMP-Group-A"
                className="w-full bg-surface-container-low rounded-xl px-5 py-4 text-on-surface outline-none text-sm focus:shadow-[0_0_0_2px_rgba(0,50,125,0.5)] transition-all"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Academic Year</label>
              <input
                type="text"
                value={newGroupForm.academicYear}
                onChange={e => setNewGroupForm({ ...newGroupForm, academicYear: e.target.value })}
                placeholder="e.g. 2026-2027"
                className="w-full bg-surface-container-low rounded-xl px-5 py-4 text-on-surface outline-none text-sm focus:shadow-[0_0_0_2px_rgba(0,50,125,0.5)] transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-full bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container shadow-[0_8px_16px_rgba(0,50,125,0.2)] transition-all disabled:opacity-60 disabled:pointer-events-none"
            >
              {isSubmitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</> : <><span className="material-symbols-outlined text-[18px]">add</span>Create Group</>}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── AnimatedCount Helper ──────────────────────────────────────────────────────
function AnimatedCount({ value, className }) {
  const count = useCountUp(value || 0);
  return <span className={className}>{value ? count : '–'}</span>;
}

// ─── Modal Wrapper ────────────────────────────────────────────────────────────
function Modal({ children, onClose, title, wide = false }) {
  return (
    <AnimatePresence>
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/20 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] flex flex-col bg-surface rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden`}
        >
          <div className="flex items-center justify-between px-8 py-5 border-b border-outline-variant/20">
            <h2 className="text-lg font-bold text-on-surface">{title}</h2>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              onClick={onClose}
              className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </motion.button>
          </div>
          <div className="p-8 overflow-y-auto flex-1">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Analytics & Observability Tab ───────────────────────────────────────────
function AnalyticsPaginationControls({ page, totalPages, totalCount, limit = 10, onPageChange }) {
  if (!totalCount || totalCount === 0) return null;
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-outline-variant/20 text-xs font-semibold text-on-surface-variant">
      <div>
        Showing <span className="font-bold text-on-surface">{startItem}</span> to <span className="font-bold text-on-surface">{endItem}</span> of <span className="font-bold text-on-surface">{totalCount}</span> entries
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3.5 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <span className="px-2">Page <span className="font-bold text-on-surface">{page}</span> of {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3.5 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const toast = useToast();
  const [subTab, setSubTab] = useState('groups'); // 'groups' | 'users' | 'feedback'
  const [loading, setLoading] = useState(false);

  // Group stats state
  const [groups, setGroups] = useState([]);
  const [groupPage, setGroupPage] = useState(1);
  const [groupTotalPages, setGroupTotalPages] = useState(1);
  const [groupTotalCount, setGroupTotalCount] = useState(0);
  const [groupSortBy, setGroupSortBy] = useState('meetings');
  const [groupOrder, setGroupOrder] = useState('desc');
  const [groupSearch, setGroupSearch] = useState('');
  const [selectedGroupModal, setSelectedGroupModal] = useState(null);

  // User attendance state
  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTotalCount, setUserTotalCount] = useState(0);
  const [userFilter, setUserFilter] = useState('all'); // 'all' | 'absent' | 'low_attendance'
  const [userSearch, setUserSearch] = useState('');
  const [userSortBy, setUserSortBy] = useState('absent');
  const [userOrder, setUserOrder] = useState('desc');

  // Feedback state
  const [feedback, setFeedback] = useState([]);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackTotalPages, setFeedbackTotalPages] = useState(1);
  const [feedbackTotalCount, setFeedbackTotalCount] = useState(0);
  const [badOnly, setBadOnly] = useState(false);
  const [feedbackSearch, setFeedbackSearch] = useState('');

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/analytics/groups?page=${groupPage}&limit=10&search=${encodeURIComponent(groupSearch)}&sortBy=${groupSortBy}&order=${groupOrder}`);
      setGroups(res.data.groups || []);
      setGroupTotalPages(res.data.totalPages || 1);
      setGroupTotalCount(res.data.totalCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/analytics/users?page=${userPage}&limit=10&filter=${userFilter}&search=${encodeURIComponent(userSearch)}&sortBy=${userSortBy}&order=${userOrder}`);
      setUsers(res.data.users || []);
      setUserTotalPages(res.data.totalPages || 1);
      setUserTotalCount(res.data.totalCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/analytics/feedback?page=${feedbackPage}&limit=10&badOnly=${badOnly}&search=${encodeURIComponent(feedbackSearch)}`);
      setFeedback(res.data.feedback || []);
      setFeedbackTotalPages(res.data.totalPages || 1);
      setFeedbackTotalCount(res.data.totalCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'groups') fetchGroups();
    else if (subTab === 'users') fetchUsers();
    else if (subTab === 'feedback') fetchFeedback();
  }, [subTab, groupPage, groupSearch, groupSortBy, groupOrder, userPage, userFilter, userSearch, userSortBy, userOrder, feedbackPage, badOnly, feedbackSearch]);

  const handleRenewFeedback = async () => {
    if (!window.confirm('Are you sure you want to renew the feedback process? This will clear all existing feedback submissions so mentees can evaluate their seniors again.')) return;
    try {
      const res = await api.post('/admin/feedback/renew');
      toast({ title: res.data.message || 'Feedback process renewed', variant: 'success' });
      setFeedbackPage(1);
      fetchFeedback();
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Error renewing feedback process', variant: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Analytics"
        title="SMP Observability Dashboard"
        description="Monitor group activity, student attendance metrics, and inspect all senior feedback non-anonymously."
      />

      {/* Sub-Navigation Tabs - Responsive Scroll/Wrap */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-surface-container-low rounded-2xl border border-outline-variant/30 w-full sm:w-fit overflow-x-auto">
        {[
          { key: 'groups', label: 'Group Meetings & Metrics', icon: 'groups' },
          { key: 'users', label: 'Student Attendance Logs', icon: 'how_to_reg' },
          { key: 'feedback', label: 'Feedback Inspector', icon: 'rate_review' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl font-semibold text-xs transition-all whitespace-nowrap flex-shrink-0 ${
              subTab === t.key
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="p-12 text-center text-on-surface-variant">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          Loading analytics data...
        </div>
      )}

      {/* ── 1. GROUP METRICS ── */}
      {!loading && subTab === 'groups' && (
        <Card className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="w-full sm:w-80">
              <SearchBar value={groupSearch} onChange={e => { setGroupSearch(e.target.value); setGroupPage(1); }} placeholder="Search group name..." />
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <span className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">Sort By Meetings:</span>
              <button
                onClick={() => {
                  setGroupSortBy('meetings');
                  setGroupOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
                  setGroupPage(1);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">sort</span>
                {groupOrder === 'desc' ? 'Most (Desc)' : 'Fewest (Asc)'}
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="pb-3">Group</th>
                  <th className="pb-3">Mentor</th>
                  <th className="pb-3">Co-Mentors</th>
                  <th className="pb-3">Mentees</th>
                  <th className="pb-3 text-center">Total Meetings</th>
                  <th className="pb-3 text-center">MoMs Uploaded</th>
                  <th className="pb-3 text-center">Avg Attendance</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-on-surface-variant">No groups found.</td>
                  </tr>
                ) : (
                  groups.map(g => (
                    <tr key={g.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-4 font-bold text-on-surface">{g.groupName}</td>
                      <td className="py-4 text-on-surface-variant">{g.mentor ? g.mentor.name : <span className="italic text-outline">Unassigned</span>}</td>
                      <td className="py-4 font-semibold text-tertiary">{g.coMentorCount}</td>
                      <td className="py-4 font-semibold text-primary">{g.menteeCount}</td>
                      <td className="py-4 text-center font-bold text-on-surface text-base">{g.meetingCount}</td>
                      <td className="py-4 text-center">
                        <Badge variant={g.momCount === g.meetingCount && g.meetingCount > 0 ? 'green' : 'yellow'}>
                          {g.momCount} / {g.meetingCount}
                        </Badge>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`font-bold ${g.avgAttendancePercentage >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {g.avgAttendancePercentage}%
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => setSelectedGroupModal(g)}
                          className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container font-semibold text-xs hover:bg-primary/20 transition-colors"
                        >
                          View Meetings
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Grid View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {groups.length === 0 ? (
              <div className="py-8 text-center text-on-surface-variant text-sm">No groups found.</div>
            ) : (
              groups.map(g => (
                <div key={g.id} className="p-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-on-surface text-base">{g.groupName}</h4>
                      <p className="text-xs text-on-surface-variant">Mentor: {g.mentor ? g.mentor.name : 'Unassigned'}</p>
                    </div>
                    <Badge variant={g.momCount === g.meetingCount && g.meetingCount > 0 ? 'green' : 'yellow'}>
                      MoM: {g.momCount}/{g.meetingCount}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 bg-surface-container-low rounded-xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-on-surface-variant block font-semibold uppercase">Meetings</span>
                      <span className="font-bold text-on-surface text-sm">{g.meetingCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-on-surface-variant block font-semibold uppercase">Attendance</span>
                      <span className={`font-bold text-sm ${g.avgAttendancePercentage >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {g.avgAttendancePercentage}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-on-surface-variant block font-semibold uppercase">Members</span>
                      <span className="font-bold text-on-surface text-sm">{g.totalMembers}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedGroupModal(g)}
                    className="w-full py-2 rounded-xl bg-primary-container text-on-primary-container font-semibold text-xs hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span> View Meetings ({g.meetingCount})
                  </button>
                </div>
              ))
            )}
          </div>

          <AnalyticsPaginationControls
            page={groupPage}
            totalPages={groupTotalPages}
            totalCount={groupTotalCount}
            limit={10}
            onPageChange={p => setGroupPage(p)}
          />
        </Card>
      )}

      {/* ── 2. STUDENT ATTENDANCE LOGS ── */}
      {!loading && subTab === 'users' && (
        <Card className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="w-full sm:w-80">
              <SearchBar value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1); }} placeholder="Search name or roll number..." />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <select
                value={userFilter}
                onChange={e => { setUserFilter(e.target.value); setUserPage(1); }}
                className="bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-2.5 text-xs font-semibold text-on-surface outline-none w-full sm:w-auto"
              >
                <option value="all">All Users</option>
                <option value="absent">Users with Absences (Absent ≥ 1)</option>
                <option value="low_attendance">Low Attendance (&lt; 75%)</option>
              </select>
              <button
                onClick={() => {
                  setUserOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
                  setUserPage(1);
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-[16px]">sort</span>
                Sort Absent ({userOrder.toUpperCase()})
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="pb-3">Student Name</th>
                  <th className="pb-3">Roll Number</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Assigned Group</th>
                  <th className="pb-3 text-center">Group Meetings</th>
                  <th className="pb-3 text-center">Attended</th>
                  <th className="pb-3 text-center">Absent</th>
                  <th className="pb-3 text-center">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-on-surface-variant">No matching user records.</td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-4 font-bold text-on-surface">{u.name}</td>
                      <td className="py-4 text-on-surface-variant font-mono">{u.rollNumber}</td>
                      <td className="py-4"><Badge variant="blue">{u.smpRole}</Badge></td>
                      <td className="py-4 text-on-surface-variant">{u.groupName}</td>
                      <td className="py-4 text-center font-medium">{u.totalGroupMeetings}</td>
                      <td className="py-4 text-center font-semibold text-emerald-600">
                        {u.isHostMentor ? <span className="text-xs text-on-surface-variant font-normal">N/A (Host)</span> : u.meetingsAttended}
                      </td>
                      <td className="py-4 text-center">
                        <span className={`font-bold ${u.meetingsAbsent > 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                          {u.isHostMentor ? 0 : u.meetingsAbsent}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`font-bold px-2.5 py-1 rounded-full text-xs ${
                          u.isHostMentor ? 'bg-primary-container text-on-primary-container' : u.attendancePercentage >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {u.isHostMentor ? 'Host' : `${u.attendancePercentage}%`}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards Grid View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {users.length === 0 ? (
              <div className="py-8 text-center text-on-surface-variant text-sm">No matching user records.</div>
            ) : (
              users.map(u => (
                <div key={u.id} className="p-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-on-surface text-base">{u.name}</h4>
                      <p className="text-xs text-on-surface-variant font-mono">{u.rollNumber} · {u.groupName}</p>
                    </div>
                    <Badge variant="blue">{u.smpRole}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 bg-surface-container-low rounded-xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-on-surface-variant block font-semibold uppercase">Attended</span>
                      <span className="font-bold text-emerald-600 text-sm">
                        {u.isHostMentor ? 'Host' : `${u.meetingsAttended} / ${u.totalGroupMeetings}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-on-surface-variant block font-semibold uppercase">Absent</span>
                      <span className={`font-bold text-sm ${!u.isHostMentor && u.meetingsAbsent > 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                        {u.isHostMentor ? 0 : u.meetingsAbsent}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-on-surface-variant block font-semibold uppercase">Rate</span>
                      <span className={`font-bold text-xs px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        u.isHostMentor ? 'bg-primary-container text-on-primary-container' : u.attendancePercentage >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {u.isHostMentor ? 'Host' : `${u.attendancePercentage}%`}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <AnalyticsPaginationControls
            page={userPage}
            totalPages={userTotalPages}
            totalCount={userTotalCount}
            limit={10}
            onPageChange={p => setUserPage(p)}
          />
        </Card>
      )}

      {/* ── 3. FEEDBACK INSPECTOR ── */}
      {!loading && subTab === 'feedback' && (
        <Card className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="w-full sm:w-80">
              <SearchBar value={feedbackSearch} onChange={e => { setFeedbackSearch(e.target.value); setFeedbackPage(1); }} placeholder="Search feedback text, sender, senior..." />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <label className="flex items-center justify-center gap-2 cursor-pointer bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors w-full sm:w-auto">
                <input
                  type="checkbox"
                  checked={badOnly}
                  onChange={e => { setBadOnly(e.target.checked); setFeedbackPage(1); }}
                  className="rounded text-error focus:ring-error accent-error"
                />
                Filter Bad Feedback Only (Rating ≤ 2 ★)
              </label>
              <button
                onClick={handleRenewFeedback}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition-all w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Renew / Clear Feedback Cycle
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {feedback.length === 0 ? (
              <div className="p-8 sm:p-12 text-center border-dashed border border-outline-variant/30 rounded-2xl text-on-surface-variant text-sm">
                No feedback items found matching current filters.
              </div>
            ) : (
              feedback.map(f => (
                <div key={f.id} className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  f.rating <= 2 ? 'border-red-300 bg-red-50/40' : 'border-outline-variant/30 bg-surface-container-lowest'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="flex gap-0.5 text-amber-400 text-lg">
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s} className={s <= f.rating ? 'text-amber-400' : 'text-outline-variant'}>★</span>
                        ))}
                      </div>
                      <Badge variant={f.rating <= 2 ? 'yellow' : 'green'}>{f.rating} / 5 Stars</Badge>
                      <Badge variant="gray">{f.group?.groupName || 'Group'}</Badge>
                    </div>
                    <span className="text-xs text-on-surface-variant font-mono">{new Date(f.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3 p-3 sm:p-3.5 bg-surface-container-low rounded-xl text-xs">
                    <div>
                      <span className="text-on-surface-variant block font-bold uppercase tracking-wider text-[10px]">Submitted By (Mentee)</span>
                      <span className="font-semibold text-on-surface">{f.fromUser?.name || 'Unknown'}</span>
                      <span className="text-on-surface-variant font-mono ml-1.5">({f.fromUser?.rollNumber})</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block font-bold uppercase tracking-wider text-[10px]">Target Senior ({f.toUser?.smpRole})</span>
                      <span className="font-semibold text-on-surface">{f.toUser?.name || 'Unknown'}</span>
                      <span className="text-on-surface-variant font-mono ml-1.5">({f.toUser?.rollNumber})</span>
                    </div>
                  </div>

                  {f.comments ? (
                    <p className="text-xs sm:text-sm text-on-surface leading-relaxed italic border-l-2 border-primary/40 pl-3 py-1 mt-2">
                      "{f.comments}"
                    </p>
                  ) : (
                    <p className="text-xs text-on-surface-variant italic">No comments provided.</p>
                  )}
                </div>
              ))
            )}
          </div>

          <AnalyticsPaginationControls
            page={feedbackPage}
            totalPages={feedbackTotalPages}
            totalCount={feedbackTotalCount}
            limit={10}
            onPageChange={p => setFeedbackPage(p)}
          />
        </Card>
      )}

      {/* Group Details Modal - Fully Responsive */}
      {selectedGroupModal && (
        <Modal onClose={() => setSelectedGroupModal(null)} title={`${selectedGroupModal.groupName} - Meeting Logs`} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center p-3.5 sm:p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-primary">{selectedGroupModal.meetingCount}</div>
                <div className="text-[11px] sm:text-xs text-on-surface-variant font-semibold">Total Meetings</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-emerald-600">{selectedGroupModal.momCount}</div>
                <div className="text-[11px] sm:text-xs text-on-surface-variant font-semibold">MoMs Completed</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-tertiary">{selectedGroupModal.avgAttendancePercentage}%</div>
                <div className="text-[11px] sm:text-xs text-on-surface-variant font-semibold">Avg Attendance</div>
              </div>
            </div>

            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest pt-2">Meetings List</h4>
            {selectedGroupModal.meetings.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-6">No meetings logged yet for this group.</p>
            ) : (
              <div className="space-y-3">
                {selectedGroupModal.meetings.map(m => (
                  <div key={m.id} className="p-4 rounded-xl border border-outline-variant/30 bg-surface">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                      <div>
                        <h5 className="font-bold text-on-surface text-sm">{m.title}</h5>
                        <p className="text-xs text-on-surface-variant font-mono">{new Date(m.date).toLocaleString()}</p>
                      </div>
                      <Badge variant={m.momUrl ? 'green' : 'yellow'}>{m.momUrl ? 'MoM Uploaded' : 'Pending MoM'}</Badge>
                    </div>
                    {m.description && <p className="text-xs text-on-surface-variant leading-relaxed mb-2">{m.description}</p>}
                    {m.momUrl && (
                      <a href={m.momUrl.startsWith('http') ? m.momUrl : `//${m.momUrl}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                        📄 View MoM Link
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
