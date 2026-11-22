import { useState } from 'react';

export default function UserAvatar({ user, src = user?.photoURL, className = 'h-10 w-10 rounded-xl', onClick }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const hasPhoto = Boolean(src && src !== failedSrc);
  const name = user?.displayName || user?.email || 'User';
  const styles = `inline-flex shrink-0 items-center justify-center overflow-hidden border border-blue-100 bg-blue-50 text-blue-700 font-bold ${className}`;
  const content = hasPhoto
    ? <img src={src} alt={`${name}'s profile photo`} className="h-full w-full object-cover" onError={() => setFailedSrc(src)} />
    : <span aria-hidden="true">{(user?.displayName || 'User').charAt(0).toUpperCase()}</span>;

  return onClick && user?.photoURL ? (
    <button type="button" onClick={onClick} aria-label={`View ${name}'s profile photo`} className={`${styles} cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`}>
      {content}
    </button>
  ) : <span className={styles} role="img" aria-label={`${name}'s avatar`}>{content}</span>;
}
