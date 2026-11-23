import { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, UserRound, Mail, Hash, GraduationCap, BookOpen, Loader2, ArrowUpRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthContext from '../../context/auth/authContext';
import { profileApi } from '../../api/profileApi';
import UserAvatar from '../../components/profile/UserAvatar';
import NotificationSettings from '../../components/profile/NotificationSettings';

export function ProfileForm({ profile, onSaved }) {
  const [name, setName] = useState(profile.displayName || '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const input = useRef(null);
  const hasChanges = name.trim() !== (profile.displayName || '') || Boolean(file) || removePhoto;

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  function choosePhoto(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      toast.error('Choose a JPEG, PNG, or WebP photo.'); event.target.value = ''; return;
    }
    if (selected.size === 0 || selected.size > 5 * 1024 * 1024) {
      toast.error('Choose a nonempty photo up to 5 MB.'); event.target.value = ''; return;
    }
    setFile(selected); setPreview(URL.createObjectURL(selected)); setRemovePhoto(false);
  }

  function cancel() {
    setName(profile.displayName || ''); setFile(null); setPreview(null); setRemovePhoto(false);
    if (input.current) input.current.value = '';
  }

  async function save(event) {
    event.preventDefault();
    if (!name.trim()) { toast.error('Please enter your name.'); return; }
    setSaving(true);
    try {
      const updates = { displayName: name.trim() };
      if (file) updates.photoURL = await profileApi.upload(file);
      else if (removePhoto) updates.photoURL = null;
      const updated = await profileApi.update(updates);
      onSaved(updated);
      toast.success('Profile updated successfully.');
    } catch (err) { toast.error(err.response?.data?.message || err.message || 'Unable to save your profile.'); }
    finally { setSaving(false); }
  }

  const displayedPhoto = removePhoto ? null : file ? preview : profile.photoURL;
  return (
    <form onSubmit={save} className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-8">
      <fieldset disabled={saving} className="min-w-0 space-y-7 disabled:opacity-75">
        <div className="flex flex-col items-center gap-5 border-b border-slate-100 pb-7 sm:flex-row">
          <UserAvatar user={profile} src={displayedPhoto} className="h-28 w-28 rounded-3xl text-3xl" />
          <div className="text-center sm:text-left">
            <h2 className="font-bold text-slate-900">Profile photo <span className="font-normal text-slate-400">(optional)</span></h2>
            <p className="mb-3 mt-1 text-xs text-slate-500">JPEG, PNG, or WebP · Up to 5 MB</p>
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} className="sr-only" aria-label="Choose profile photo" />
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <button type="button" onClick={() => input.current?.click()} className="academic-btn-outline inline-flex items-center gap-2 text-xs"><Camera size={15} />{displayedPhoto ? 'Change photo' : 'Add photo'}</button>
              {(displayedPhoto || file) && <button type="button" onClick={() => { setFile(null); setPreview(null); setRemovePhoto(Boolean(profile.photoURL)); if (input.current) input.current.value = ''; }} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"><Trash2 size={14} />Remove</button>}
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="profile-name" className="mb-2 block text-sm font-semibold text-slate-700">Name</label>
          <input id="profile-name" type="text" autoComplete="name" value={name} maxLength={100} required onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          <p className="mt-2 text-xs text-slate-500">You can update your name and photo. Your academic details are read-only.</p>
        </div>
        <dl className="grid gap-5 sm:grid-cols-2">
          <ProfileDetail icon={Hash} label="Roll number" value={profile.rollNo} />
          <ProfileDetail icon={Mail} label="Email address" value={profile.email} />
          <ProfileDetail icon={GraduationCap} label="Branch" value={profile.branchName} />
        </dl>
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6">
          <button type="button" disabled={!hasChanges} onClick={cancel} className="academic-btn-outline disabled:cursor-not-allowed disabled:opacity-40">Cancel</button>
          <button type="submit" disabled={!hasChanges || !name.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40">{saving && <Loader2 size={16} className="animate-spin" />} {saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </fieldset>
    </form>
  );
}

function ProfileDetail({ icon, label, value }) {
  const Icon = icon;
  return <div className="min-w-0 rounded-xl bg-slate-50 p-4"><dt className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-500"><Icon size={14} />{label}</dt><dd className="break-words text-sm font-semibold text-slate-800">{value || 'Not available'}</dd></div>;
}

export default function MyProfile() {
  const { user, updateUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState('');
  const [revision, setRevision] = useState(0);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    profileApi.me(controller.signal).then((data) => { setProfile(data); updateUser(data); }).catch((err) => {
      if (!controller.signal.aborted) setProfileError(err.response?.data?.message || 'Unable to load your profile. Please try again.');
    });
    profileApi.courses(controller.signal).then(setCourses).catch(() => {
      if (!controller.signal.aborted) setCoursesError('Unable to load your courses.');
    }).finally(() => { if (!controller.signal.aborted) setCoursesLoading(false); });
    return () => controller.abort();
  }, [user.id, updateUser, retry]);

  function retryLoad() { setProfileError(''); setCoursesError(''); setCoursesLoading(true); setRetry((value) => value + 1); }
  function saved(updated) { setProfile(updated); updateUser(updated); setRevision((value) => value + 1); }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <header><div className="mb-2 flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><UserRound size={24} /></div><h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">My Profile</h1></div><p className="text-sm text-slate-500">Your personal details and current courses, in one place.</p></header>
      {profileError ? <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-700">{profileError}<button type="button" onClick={retryLoad} className="ml-3 font-bold underline">Retry</button></div> : profile ? <ProfileForm key={revision} profile={profile} onSaved={saved} /> : <div role="status" className="flex min-h-64 items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 className="animate-spin text-blue-600" />Loading profile…</div>}
      <NotificationSettings />
      <section className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-8" aria-labelledby="profile-courses-title">
        <h2 id="profile-courses-title" className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-900"><BookOpen size={20} className="text-blue-600" />Current courses</h2>
        <p className="mb-5 text-xs text-slate-500">Courses shown in My Courses for your branch, programme, and academic year.</p>
        {coursesLoading ? <p role="status" className="text-sm text-slate-500">Loading courses…</p> : coursesError ? <p role="alert" className="text-sm text-rose-700">{coursesError} <button type="button" onClick={retryLoad} className="font-semibold underline">Retry</button></p> : courses.length ? <div className="grid gap-3 sm:grid-cols-2">{courses.map((course) => <Link key={course.id} to={`/dashboard/courses/${course.id}`} className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/40"><div className="min-w-0"><p className="text-xs font-bold text-blue-700">{course.courseCode}</p><p className="mt-1 text-sm font-semibold text-slate-800">{course.name}</p></div><ArrowUpRight size={17} className="shrink-0 text-slate-400 group-hover:text-blue-600" /></Link>)}</div> : <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No current courses are available for your profile.</p>}
      </section>
    </div>
  );
}
