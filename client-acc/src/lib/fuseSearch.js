import Fuse from "fuse.js";
import faqData from "../data/faq.json";

/**
 * Fuse.js configuration for fuzzy search across FAQ fields.
 * threshold 0.35 — balanced between precision and recall.
 */
const fuseOptions = {
  includeScore: true,
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2,
  keys: [
    { name: "question", weight: 0.5 },
    { name: "keywords", weight: 0.3 },
    { name: "category", weight: 0.1 },
    { name: "subcategory", weight: 0.05 },
    { name: "tags", weight: 0.05 },
  ],
};

// Singleton Fuse instance to avoid re-initialising on every search
const fuse = new Fuse(faqData, fuseOptions);

/**
 * Search the FAQ dataset with Fuse.js fuzzy matching.
 * @param {string} query - The user's search query.
 * @param {number} [limit=3] - Maximum number of results to return.
 * @returns {{ item: FAQItem, score: number }[]} Sorted array of matches.
 */
export function searchFAQ(query, limit = 3) {
  if (!query || query.trim().length === 0) return [];
  const results = fuse.search(query.trim(), { limit });
  // Filter out weak matches (score closer to 1 means worse match in Fuse)
  return results.filter((r) => r.score !== undefined && r.score < 0.4);
}

/**
 * Get the best single FAQ match for a query.
 * @param {string} query
 * @returns {import("../types/faq").FAQItem | null}
 */
export function getBestMatch(query) {
  const results = searchFAQ(query, 1);
  if (results.length === 0) return null;
  return results[0].item;
}

/**
 * Get all unique categories from the FAQ dataset.
 * @returns {string[]}
 */
export function getCategories() {
  const cats = faqData.map((item) => item.category);
  return [...new Set(cats)];
}

/**
 * Get FAQ items filtered by category.
 * @param {string} category
 * @returns {import("../types/faq").FAQItem[]}
 */
export function getFAQByCategory(category) {
  if (!category || category === "All") return faqData;
  return faqData.filter((item) => item.category === category);
}

export { faqData };
