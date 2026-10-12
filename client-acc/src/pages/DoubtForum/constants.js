// Keep in sync with DOUBT_CATEGORIES in server-acc/controllers/doubtController.js
export const DOUBT_CATEGORIES = [
  "Academics",
  "Administration",
  "Fees & Scholarships",
  "Hostel & Mess",
  "Placements & Internships",
  "Campus Life",
  "Tech & Projects",
  "Other",
];

// Roles that moderate the forum. Keep in sync with DOUBT_ADMIN_ROLES on the server.
export const DOUBT_ADMIN_ROLES = ["SUPER_ADMIN", "FACULTY"];

export const timeAgo = (value) => {
  if (!value) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
