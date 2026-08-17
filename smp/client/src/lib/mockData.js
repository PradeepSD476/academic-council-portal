// ─────────────────────────────────────────────
// mockData.js  –  localStorage-backed mock DB
// for meetings, MOMs, feedback, and attendance
// ─────────────────────────────────────────────

const KEYS = {
  MEETINGS:  'smp_meetings',
  MOMS:      'smp_moms',
  FEEDBACK:  'smp_feedback',
  RESOURCES: 'smp_resources',
};

// ── helpers ──────────────────────────────────
const read  = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const write = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const uid   = () => Math.random().toString(36).slice(2, 10);

// ── Seed initial data so bypass users see content ──
export function seedIfEmpty() {
  if (read(KEYS.MEETINGS).length === 0) {
    const base = new Date();
    const future1 = new Date(base); future1.setDate(base.getDate() + 3);
    const future2 = new Date(base); future2.setDate(base.getDate() + 10);
    const past1   = new Date(base); past1.setDate(base.getDate() - 7);
    const past2   = new Date(base); past2.setDate(base.getDate() - 14);

    write(KEYS.MEETINGS, [
      {
        id: 'mtg-001', groupId: 'mock-group',
        title: 'Kickoff & Goal Setting',
        date: past2.toISOString().split('T')[0],
        time: '16:00', location: 'Library Room 2B', agenda: 'Introduction, setting semester goals, sharing resources.',
        createdAt: past2.toISOString(), status: 'completed',
      },
      {
        id: 'mtg-002', groupId: 'mock-group',
        title: 'Mid-Semester Check-in',
        date: past1.toISOString().split('T')[0],
        time: '17:00', location: 'Online – Google Meet', agenda: 'Review progress, discuss internship prep, Q&A.',
        createdAt: past1.toISOString(), status: 'completed',
      },
      {
        id: 'mtg-003', groupId: 'mock-group',
        title: 'Exam Strategy Workshop',
        date: future1.toISOString().split('T')[0],
        time: '15:00', location: 'Academic Block Room 301', agenda: 'Tips for end-sem exams, study planning, stress management.',
        createdAt: base.toISOString(), status: 'upcoming',
      },
      {
        id: 'mtg-004', groupId: 'mock-group',
        title: 'Project Review & Feedback',
        date: future2.toISOString().split('T')[0],
        time: '16:30', location: 'LT-2', agenda: 'Review mini-projects, mentor feedback, next steps.',
        createdAt: base.toISOString(), status: 'upcoming',
      },
    ]);
  }

  if (read(KEYS.MOMS).length === 0) {
    write(KEYS.MOMS, [
      {
        id: 'mom-001', meetingId: 'mtg-001', groupId: 'mock-group',
        summary: 'All mentees introduced themselves. Semester goals were discussed. Mentor shared a resource list for core subjects.',
        actionItems: 'Everyone to complete the goals form by next week.',
        attendance: { 'mentee-1': true, 'mentee-2': true, 'mentee-3': false },
        attendanceNames: { 'mentee-1': 'Rahul Sharma', 'mentee-2': 'Priya Singh', 'mentee-3': 'Arjun Mehta' },
        submittedAt: new Date(Date.now() - 13 * 24 * 3600 * 1000).toISOString(),
        resources: ['https://drive.google.com/example-resource-list'],
      },
      {
        id: 'mom-002', meetingId: 'mtg-002', groupId: 'mock-group',
        summary: 'Reviewed mid-semester progress. All mentees are on track. Discussed internship preparation timelines and resume tips.',
        actionItems: '1. Prepare resume draft by next meeting. 2. Apply to at least 3 companies on Internshala.',
        attendance: { 'mentee-1': true, 'mentee-2': false, 'mentee-3': true },
        attendanceNames: { 'mentee-1': 'Rahul Sharma', 'mentee-2': 'Priya Singh', 'mentee-3': 'Arjun Mehta' },
        submittedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
        resources: [],
      },
    ]);
  }

  if (read(KEYS.FEEDBACK).length === 0) {
    write(KEYS.FEEDBACK, [
      {
        id: 'fb-001', groupId: 'mock-group', menteeId: 'mentee-1',
        menteeName: 'Rahul Sharma', rating: 5,
        comment: 'Very helpful and always available for queries. Excellent guidance on internship preparation!',
        submittedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
      },
    ]);
  }

  if (read(KEYS.RESOURCES).length === 0) {
    write(KEYS.RESOURCES, [
      { id: 'res-001', groupId: 'mock-group', title: 'Core CS Subject Resources', url: 'https://drive.google.com/example', addedAt: new Date().toISOString() },
      { id: 'res-002', groupId: 'mock-group', title: 'Internship Prep Guide 2026', url: 'https://drive.google.com/example2', addedAt: new Date().toISOString() },
    ]);
  }
}

// ── MEETINGS ──────────────────────────────────
export const meetingsApi = {
  getAll: (groupId = 'mock-group') =>
    read(KEYS.MEETINGS)
      .filter(m => m.groupId === groupId)
      .sort((a, b) => new Date(a.date) - new Date(b.date)),

  getUpcoming: (groupId = 'mock-group') =>
    meetingsApi.getAll(groupId).filter(m => new Date(m.date + 'T' + m.time) >= new Date()),

  getPast: (groupId = 'mock-group') =>
    meetingsApi.getAll(groupId).filter(m => new Date(m.date + 'T' + m.time) < new Date()),

  create: (data) => {
    const meetings = read(KEYS.MEETINGS);
    const newMeeting = { id: `mtg-${uid()}`, groupId: 'mock-group', status: 'upcoming', createdAt: new Date().toISOString(), ...data };
    write(KEYS.MEETINGS, [...meetings, newMeeting]);
    return newMeeting;
  },

  delete: (id) => write(KEYS.MEETINGS, read(KEYS.MEETINGS).filter(m => m.id !== id)),

  getById: (id) => read(KEYS.MEETINGS).find(m => m.id === id) || null,
};

// ── MOMs (Minutes of Meeting) ─────────────────
export const momsApi = {
  getAll: (groupId = 'mock-group') =>
    read(KEYS.MOMS)
      .filter(m => m.groupId === groupId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),

  getByMeeting: (meetingId) => read(KEYS.MOMS).find(m => m.meetingId === meetingId) || null,

  create: (data) => {
    const moms = read(KEYS.MOMS).filter(m => m.meetingId !== data.meetingId); // replace if exists
    const newMom = { id: `mom-${uid()}`, groupId: 'mock-group', submittedAt: new Date().toISOString(), ...data };
    write(KEYS.MOMS, [...moms, newMom]);
    return newMom;
  },
};

// ── FEEDBACK ──────────────────────────────────
export const feedbackApi = {
  getAll: (groupId = 'mock-group') =>
    read(KEYS.FEEDBACK)
      .filter(f => f.groupId === groupId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),

  hasMenteeSubmitted: (menteeId) => !!read(KEYS.FEEDBACK).find(f => f.menteeId === menteeId),

  submit: (data) => {
    const existing = read(KEYS.FEEDBACK).filter(f => f.menteeId !== data.menteeId);
    const entry = { id: `fb-${uid()}`, groupId: 'mock-group', submittedAt: new Date().toISOString(), ...data };
    write(KEYS.FEEDBACK, [...existing, entry]);
    return entry;
  },
};

// ── RESOURCES ─────────────────────────────────
export const resourcesApi = {
  getAll: (groupId = 'mock-group') =>
    read(KEYS.RESOURCES).filter(r => r.groupId === groupId),

  add: (data) => {
    const resources = read(KEYS.RESOURCES);
    const entry = { id: `res-${uid()}`, groupId: 'mock-group', addedAt: new Date().toISOString(), ...data };
    write(KEYS.RESOURCES, [...resources, entry]);
    return entry;
  },

  delete: (id) => write(KEYS.RESOURCES, read(KEYS.RESOURCES).filter(r => r.id !== id)),
};

// ── MOCK GROUP DATA ───────────────────────────
export const mockGroupData = {
  groupName: 'Group Alpha – 2026',
  mentor: { id: 'mentor-1', name: 'Karan Verma', email: 'karan.verma@iitp.ac.in', rollNumber: '22BCS001' },
  coMentors: [{ id: 'comentor-1', name: 'Sneha Patel', email: 'sneha.p@iitp.ac.in', rollNumber: '23BCS012' }],
  mentees: [
    { id: 'mentee-1', name: 'Rahul Sharma', email: 'rahul.s@iitp.ac.in', rollNumber: '24BCS101' },
    { id: 'mentee-2', name: 'Priya Singh', email: 'priya.s@iitp.ac.in', rollNumber: '24BCS102' },
    { id: 'mentee-3', name: 'Arjun Mehta', email: 'arjun.m@iitp.ac.in', rollNumber: '24BCS103' },
  ],
};

// ── date formatting helpers ───────────────────
export const fmt = {
  date: (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  time: (t) => { // "15:00" → "3:00 PM"
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  },
  relDate: (iso) => {
    const diff = Math.round((new Date(iso) - new Date()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff > 0) return `In ${diff} days`;
    return `${Math.abs(diff)} days ago`;
  },
};
