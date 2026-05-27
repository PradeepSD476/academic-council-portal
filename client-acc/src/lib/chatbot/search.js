/**
 * AskACC – Production-grade Fuse.js search module.
 *
 * Singleton Fuse instance — created once at module load time,
 * never recreated on every render or search call.
 *
 * Weighted keys: question > keywords > category/subcategory/tags
 * ignoreLocation: true → full-text scan, great for natural language.
 */

import Fuse from "fuse.js";
import faqData from "@/data/faq.json";

const FUSE_OPTIONS = {
  keys: [
    { name: "question",    weight: 0.45 },
    { name: "keywords",    weight: 0.30 },
    { name: "answer",      weight: 0.08 },
    { name: "category",    weight: 0.08 },
    { name: "subcategory", weight: 0.05 },
    { name: "tags",        weight: 0.04 },
  ],
  threshold: 0.65,        // raised: catches near-exact & paraphrased questions
  ignoreLocation: true,   // full-text scan, not just prefix
  minMatchCharLength: 2,
  shouldSort: true,
  includeScore: true,
  findAllMatches: false,
  useExtendedSearch: false,
};

// Module-level singleton — never re-instantiated
const fuse = new Fuse(faqData, FUSE_OPTIONS);

/**
 * Search FAQs with fuzzy matching.
 * @param {string} query  - User's search query
 * @param {number} limit  - Max results (default 10)
 * @returns {Array}       - Array of FAQ item objects
 */
export function searchFAQs(query, limit = 10) {
  if (!query?.trim() || query.trim().length < 2) return [];

  return fuse
    .search(query.trim(), { limit: limit + 5 })   // fetch extras, filter below
    .filter((r) => r.score !== undefined && r.score < 0.65) // keep all Fuse-approved matches
    .slice(0, limit)
    .map((r) => r.item);
}

/**
 * Get top result score (kept for API compatibility).
 */
export function getBestScore(query) {
  if (!query?.trim()) return 1;
  const results = fuse.search(query.trim(), { limit: 1 });
  return results[0]?.score ?? 1;
}

/**
 * Get ALL FAQs filtered by category (exact match, case-insensitive).
 * No artificial limit — returns everything in the category.
 * @param {string} category
 * @param {number} limit  - optional cap (default: no limit)
 * @returns {Array}
 */
export function getFAQsByCategory(category, limit = Infinity) {
  if (!category) return [];
  const filtered = faqData.filter(
    (item) => item.category.toLowerCase() === category.toLowerCase()
  );
  return limit === Infinity ? filtered : filtered.slice(0, limit);
}

/** Get all unique categories from the dataset */
export function getAllCategories() {
  return [...new Set(faqData.map((f) => f.category))];
}

export { faqData };
