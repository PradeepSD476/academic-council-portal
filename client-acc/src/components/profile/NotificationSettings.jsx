import { useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { profileApi } from '../../api/profileApi';

const options = [
  { key: 'resourcesEnabled', label: 'Resource notifications', description: 'New resources shared for your courses.' },
  { key: 'careerVaultExperiencesEnabled', label: 'Career Vault experience notifications', description: 'New internship, placement, and startup experiences.' },
  { key: 'jobsInternshipsEnabled', label: 'Jobs and internships notifications', description: 'New openings and any saved-search email digests you subscribe to.' },
  { key: 'announcementsEnabled', label: 'Announcement notifications', description: 'Save your preference for future announcement emails. These emails are not available yet.' },
];

export default function NotificationSettings() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    profileApi.notificationSettings(controller.signal).then((data) => { if (!controller.signal.aborted) setSettings(data); }).catch(() => {
      if (!controller.signal.aborted) setError('Unable to load notification settings.');
    });
    return () => controller.abort();
  }, [retry]);

  async function toggle(key) {
    if (saving) return;
    const previous = settings;
    setSettings({ ...settings, [key]: !settings[key] });
    setSaving(key);
    try { setSettings(await profileApi.updateNotificationSettings({ [key]: !previous[key] })); }
    catch (err) { setSettings(previous); toast.error(err.response?.data?.message || 'Unable to save this preference. Please try again.'); }
    finally { setSaving(null); }
  }

  return (
    <section aria-labelledby="notification-settings-title" className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-8">
      <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-900" id="notification-settings-title"><Bell size={20} className="text-blue-600" />Settings</h2>
      <h3 className="mt-5 text-sm font-bold text-slate-800">Email notifications</h3>
      <p className="mb-5 mt-1 text-xs text-slate-500">Choose which portal updates arrive in your inbox. Changes save automatically.</p>
      {error ? <p role="alert" className="text-sm text-rose-700">{error} <button type="button" className="font-semibold underline" onClick={() => { setError(''); setRetry((value) => value + 1); }}>Retry</button></p> : !settings ? <p role="status" className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" />Loading settings…</p> : (
        <div className="divide-y divide-slate-100">{options.map(({ key, label, description }) => <div key={key} className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0">
          <div><p id={`${key}-label`} className="text-sm font-semibold text-slate-800">{label}</p><p id={`${key}-description`} className="mt-1 max-w-lg text-xs leading-relaxed text-slate-500">{description}</p></div>
          <button type="button" role="switch" aria-checked={settings[key]} aria-labelledby={`${key}-label`} aria-describedby={`${key}-description`} disabled={Boolean(saving)} onClick={() => toggle(key)} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-60 ${settings[key] ? 'bg-blue-600' : 'bg-slate-300'}`}><span className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform ${settings[key] ? 'translate-x-5' : 'translate-x-0.5'}`}>{saving === key && <Loader2 size={12} className="animate-spin text-blue-600" />}</span></button>
        </div>)}</div>
      )}
      <p role="status" aria-live="polite" className="mt-4 min-h-4 text-xs text-slate-500">{saving ? 'Saving preference…' : ''}</p>
    </section>
  );
}
