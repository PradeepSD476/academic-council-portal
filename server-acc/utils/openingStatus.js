// Computed status for faculty openings. The stored `status` column is the
// admin's explicit switch (e.g. manual early close); the OPEN/CLOSED a student
// sees is always computed on read from three inputs:
//   explicit closed  OR  filled >= available  OR  deadline < today  => CLOSED
// The user-facing list must never show a closed/filled/expired opening as open.

export const OPENING_STATUSES = ['OPEN', 'CLOSED'];

// Shared with the "Find a research match" project-type filter. If a new
// category is needed (e.g. a PhD-assistantship role), extend this list rather
// than introducing a second, differently-named enum.
export const POSITION_TYPES = ['SUMMER_RESEARCH', 'THESIS', 'READING_PROJECT', 'RA_SHIP', 'PHD_ASSIST'];

export const isOpenOpening = (opening, now = new Date()) => {
  if (!opening) return false;
  if ((opening.status || 'OPEN') === 'CLOSED') return false;
  const available = Number.isFinite(opening.positionsAvailable) ? opening.positionsAvailable : 1;
  const filled = Number.isFinite(opening.positionsFilled) ? opening.positionsFilled : 0;
  if (filled >= available) return false;
  // The column is `deadline` on ResearchOpenPosition; applicationDeadline is
  // accepted so the helper also works on plain objects mapped from either name.
  const deadline = opening.applicationDeadline || opening.deadline;
  if (deadline && new Date(deadline).getTime() < now.getTime()) return false;
  return true;
};

export const openingComputedStatus = (opening, now = new Date()) =>
  isOpenOpening(opening, now) ? 'OPEN' : 'CLOSED';

// Label helpers for the UI. Relative label when the deadline is within a week.
export const deadlineLabel = (opening, now = new Date()) => {
  const raw = opening?.applicationDeadline || opening?.deadline;
  if (!raw) return null;
  const deadline = new Date(raw);
  const ms = deadline.getTime() - now.getTime();
  if (ms < 0) return 'Deadline passed';
  const days = Math.ceil(ms / 86400000);
  if (days === 0) return 'Closes today';
  if (days <= 7) return `Closes in ${days} day${days === 1 ? '' : 's'}`;
  return `Apply by ${deadline.toLocaleDateString()}`;
};
