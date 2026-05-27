/**
 * AskACC – Categories, Commands & Quick Suggestions config.
 * Single source of truth — no category strings hardcoded in components.
 */

export const CATEGORIES = [
  { label: "📋 Admissions",        key: "Admissions",          color: "bg-blue-500",    textColor: "text-blue-700",  bgLight: "bg-blue-50",   border: "border-blue-200" },
  { label: "🏠 Hostel",            key: "Hostel",               color: "bg-indigo-500",  textColor: "text-indigo-700", bgLight: "bg-indigo-50", border: "border-indigo-200" },
  { label: "💰 Finance",           key: "Finance",              color: "bg-emerald-500", textColor: "text-emerald-700",bgLight: "bg-emerald-50",border: "border-emerald-200"},
  { label: "📚 Registration",      key: "Registration",         color: "bg-violet-500",  textColor: "text-violet-700", bgLight: "bg-violet-50", border: "border-violet-200" },
  { label: "🎓 Academics",         key: "Academics",            color: "bg-sky-500",     textColor: "text-sky-700",   bgLight: "bg-sky-50",    border: "border-sky-200" },
  { label: "💼 Placements",        key: "Placements",           color: "bg-amber-500",   textColor: "text-amber-700", bgLight: "bg-amber-50",  border: "border-amber-200" },
  { label: "🚌 Travel",            key: "Travel",               color: "bg-orange-500",  textColor: "text-orange-700",bgLight: "bg-orange-50", border: "border-orange-200"},
  { label: "🎒 Essentials",        key: "Essentials",           color: "bg-teal-500",    textColor: "text-teal-700",  bgLight: "bg-teal-50",   border: "border-teal-200" },
  { label: "🏨 Accommodation",     key: "Accommodation",        color: "bg-rose-500",    textColor: "text-rose-700",  bgLight: "bg-rose-50",   border: "border-rose-200" },
  { label: "🌱 Campus Life",       key: "Campus Life",          color: "bg-green-500",   textColor: "text-green-700", bgLight: "bg-green-50",  border: "border-green-200" },
  { label: "👨‍👩‍👧 Parents",         key: "Parents & Orientation",color: "bg-pink-500",    textColor: "text-pink-700",  bgLight: "bg-pink-50",   border: "border-pink-200" },
  { label: "🏥 Medical",           key: "Medical",              color: "bg-red-500",     textColor: "text-red-700",   bgLight: "bg-red-50",    border: "border-red-200" },
  { label: "📡 Internet & Banking",key: "Internet & Banking",   color: "bg-cyan-500",    textColor: "text-cyan-700",  bgLight: "bg-cyan-50",   border: "border-cyan-200" },
  { label: "💬 Communication",     key: "Communication",        color: "bg-fuchsia-500", textColor: "text-fuchsia-700",bgLight: "bg-fuchsia-50",border: "border-fuchsia-200"},
];

/** Command shortcuts: user types a word → maps to a category key */
export const COMMANDS = {
  hostel:    "Hostel",
  fees:      "Finance",
  finance:   "Finance",
  money:     "Finance",
  documents: "Registration",
  docs:      "Registration",
  register:  "Registration",
  admit:     "Admissions",
  admission: "Admissions",
  travel:    "Travel",
  bus:       "Travel",
  reach:     "Travel",
  placement: "Placements",
  job:       "Placements",
  campus:    "Campus Life",
  essentials:"Essentials",
  bring:     "Essentials",
  medical:   "Medical",
  health:    "Medical",
  parents:   "Parents & Orientation",
  hotel:     "Accommodation",
  stay:      "Accommodation",
  internet:  "Internet & Banking",
  bank:      "Internet & Banking",
  wifi:      "Internet & Banking",
  branch:    "Academics",
  academics: "Academics",
};

/** Quick suggestion pills shown after the welcome message */
export const QUICK_SUGGESTIONS = [
  "Which hostel do freshers get?",
  "What documents are required?",
  "How to pay fees?",
  "How to reach IIT Patna?",
  "JoSAA ₹30,000 refund?",
  "Branch change at IIT Patna?",
  "Guest house for parents?",
  "Placement stats 2024?",
];

/** Priority badge styles */
export const PRIORITY_STYLES = {
  high:   { bg: "bg-red-100",    text: "text-red-700",    label: "High Priority" },
  medium: { bg: "bg-amber-100",  text: "text-amber-700",  label: "Medium" },
  low:    { bg: "bg-green-100",  text: "text-green-700",  label: "Low" },
};

/** Returns the category config object for a given key, or undefined */
export function getCategoryConfig(key) {
  return CATEGORIES.find((c) => c.key === key);
}
