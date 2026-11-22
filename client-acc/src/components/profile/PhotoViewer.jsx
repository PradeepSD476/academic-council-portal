import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, ImageOff } from 'lucide-react';
import { profileApi } from '../../api/profileApi';

export default function PhotoViewer({ user, onClose }) {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const dialog = useRef(null);
  const close = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    profileApi.photo(user.id, controller.signal).then((url) => {
      setPhoto(url);
      if (!url) setError('No profile photo is available.');
    }).catch((err) => {
      if (!controller.signal.aborted) setError(err.response?.data?.message || 'Unable to load this photo.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [user.id]);

  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    close.current?.focus();
    const keydown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'Tab') {
        const buttons = dialog.current?.querySelectorAll('button, [href], input, [tabindex="0"]');
        const first = buttons?.[0]; const last = buttons?.[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', keydown);
      previous?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div data-lenis-prevent className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="photo-viewer-title" className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="photo-viewer-title" className="min-w-0 truncate text-base font-bold text-slate-900">{user.displayName || 'Profile photo'}</h2>
          <button ref={close} type="button" aria-label="Close photo" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"><X size={20} /></button>
        </div>
        <div className="flex min-h-56 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
          {loading ? <Loader2 className="animate-spin text-blue-600" aria-label="Loading photo" /> : error ? (
            <div role="status" className="p-6 text-center text-sm text-slate-500"><ImageOff className="mx-auto mb-3" />{error}</div>
          ) : <img src={photo} alt={`${user.displayName || 'User'}'s profile photo`} className="max-h-[65vh] w-full object-contain" onError={() => setError('This photo could not be loaded. Please close and try again.')} />}
        </div>
      </div>
    </div>, document.body,
  );
}
