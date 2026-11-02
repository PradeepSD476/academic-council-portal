import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { careersApi } from "../../../api/careersApi";
import { LAST_VISIT_EVENT, lastVisitAt } from "../lib/tracking";

// "New for you" count on the student sidebar's "Jobs & Internships" item (P6-T2, F-21): openings
// published since the last visit to the jobs page that "Eligible for me" lets through. Nothing
// before a first visit; hidden at 0 or on error. One request per last-visit value and 5 minutes,
// shared by every copy of the badge on the page.
const TTL_MS = 5 * 60 * 1000;
let cache = { since: null, at: 0, value: null, inflight: null };

function load(since) {
  if (cache.since === since && cache.value !== null && Date.now() - cache.at < TTL_MS) return Promise.resolve(cache.value);
  if (cache.since !== since || !cache.inflight) {
    const inflight = careersApi.newPostingsCount(since)
      .then((d) => { if (cache.since === since) cache = { since, at: Date.now(), value: d.count, inflight: null }; return d.count; })
      .catch(() => { if (cache.since === since) cache = { ...cache, inflight: null }; return null; });
    cache = { since, at: 0, value: null, inflight };
  }
  return cache.inflight;
}

export default function NewJobsBadge() {
  const { pathname } = useLocation();
  const [count, setCount] = useState(null);

  // Re-read on every page change, and when the jobs page records a visit (that moves it to now).
  const [visit, setVisit] = useState(0);
  useEffect(() => {
    const onVisit = () => setVisit((v) => v + 1);
    window.addEventListener(LAST_VISIT_EVENT, onVisit);
    return () => window.removeEventListener(LAST_VISIT_EVENT, onVisit);
  }, []);

  useEffect(() => {
    const since = lastVisitAt();
    if (!since) {
      setCount(null);
      return undefined;
    }
    let alive = true;
    load(since).then((n) => { if (alive) setCount(n); });
    return () => { alive = false; };
  }, [pathname, visit]);

  if (!count) return null;
  return (
    <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-teal-600 text-white text-[10px] font-bold align-middle"
      aria-label={`${count} new for you since your last visit`} title="New for you since your last visit">
      {count > 99 ? "99+" : count}
    </span>
  );
}
