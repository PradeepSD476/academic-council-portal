import { useEffect, useState } from "react";
import { careersAdminApi } from "../../../../api/careersApi";

// Count badge on the admin sidebar's "Jobs Review" item (P5-T6, F-16): postings waiting for review
// (pending + flagged). One shared request per minute for the whole page; hidden at 0 or on error.
const TTL_MS = 60 * 1000;
let cache = { at: 0, value: null, inflight: null };

function load() {
  if (Date.now() - cache.at < TTL_MS && cache.value !== null) return Promise.resolve(cache.value);
  if (!cache.inflight) {
    cache.inflight = careersAdminApi.reviewCounts()
      .then((c) => { cache = { at: Date.now(), value: c.waiting, inflight: null }; return c.waiting; })
      .catch(() => { cache = { ...cache, inflight: null }; return null; });
  }
  return cache.inflight;
}

export default function ReviewCountBadge() {
  const [count, setCount] = useState(cache.value);

  useEffect(() => {
    let alive = true;
    const refresh = () => load().then((n) => { if (alive) setCount(n); });
    refresh();
    const timer = setInterval(refresh, TTL_MS);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  if (!count) return null;
  return (
    <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[var(--color-secondary)] text-white text-[10px] font-bold align-middle" aria-label={`${count} waiting for review`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}
