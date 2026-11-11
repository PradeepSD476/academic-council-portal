// Whether the Jobs & Internships UI is open for this user ({ enabled, visibleToStudents, isCareerAdmin }).
// Fetched once per user per page load and shared by every caller (sidebar, tabs, pages).
import { useEffect, useState } from "react";
import { careersApi } from "../api/careersApi";

const CLOSED = { enabled: false, visibleToStudents: false, isCareerAdmin: false };
const cache = new Map(); // userId -> Promise<status>

function load(userId) {
  if (!cache.has(userId)) {
    cache.set(userId, careersApi.getStatus().catch(() => {
      cache.delete(userId); // fail closed; try again on the next mount
      return CLOSED;
    }));
  }
  return cache.get(userId);
}

export function useCareersStatus(userId) {
  const [state, setState] = useState({ userId: null, status: null });
  useEffect(() => {
    if (!userId) return undefined;
    let alive = true;
    load(userId).then((status) => { if (alive) setState({ userId, status }); });
    return () => { alive = false; };
  }, [userId]);
  const status = state.userId === userId ? state.status : null;
  return { ...(status ?? CLOSED), loading: Boolean(userId) && status === null };
}
