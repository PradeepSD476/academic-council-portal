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

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "at", "do", "for", "get", "how", "i", "in",
  "is", "it", "me", "my", "of", "on", "the", "to", "where", "which",
]);

const TOKEN_DOCUMENT_FREQUENCY = new Map();
faqData.forEach((item) => {
  const tokens = new Set(getSearchTokens([
    item.question,
    ...(item.keywords || []),
    item.category,
    item.subcategory,
    ...(item.tags || []),
  ].join(" ")));
  tokens.forEach((token) => {
    TOKEN_DOCUMENT_FREQUENCY.set(token, (TOKEN_DOCUMENT_FREQUENCY.get(token) || 0) + 1);
  });
});

function getSearchTokens(text) {
  return [...new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
  )];
}

function getOrderedTokenMatches(queryTokens, text) {
  const textTokens = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/);
  let textIndex = 0;
  const matches = [];

  for (const queryToken of queryTokens) {
    const matchIndex = textTokens.indexOf(queryToken, textIndex);
    if (matchIndex !== -1) {
      matches.push(queryToken);
      textIndex = matchIndex + 1;
    }
  }

  return matches;
}

/** Find FAQ fields that contain multiple query terms in the same order. */
export function getSequenceFAQs(query, limit = 10) {
  const queryTokens = (query || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (queryTokens.length < 2 || limit <= 0) return [];

  return faqData
    .map((item) => {
      const fields = [item.question, ...(item.keywords || [])].filter(Boolean);
      const matches = fields
        .map((field) => getOrderedTokenMatches(queryTokens, field))
        .sort((a, b) => b.length - a.length)[0] || [];
      const meaningfulMatches = matches.filter((token) => !STOP_WORDS.has(token));
      return { item, matches, meaningfulMatches };
    })
    .filter((result) =>
      result.meaningfulMatches.length > 0 &&
      (result.meaningfulMatches.length >= 2 || result.matches.length >= 3)
    )
    .sort((a, b) =>
      b.meaningfulMatches.length - a.meaningfulMatches.length ||
      b.matches.length - a.matches.length
    )
    .slice(0, limit)
    .map((result) => result.item);
}

/** Rank keyword-overlap results after the stronger sequence matches. */
export function getSimilarFAQs(query, excludedItems = [], limit = 10) {
  const queryTokens = getSearchTokens(query || "");
  if (queryTokens.length === 0 || limit <= 0) return [];

  const excludedIds = new Set(excludedItems.map((item) => item.id));
  return faqData
    .filter((item) => !excludedIds.has(item.id))
    .map((item) => {
      const questionTokens = new Set(getSearchTokens(item.question || ""));
      const keywordTokens = new Set(getSearchTokens((item.keywords || []).join(" ")));
      const metadataTokens = new Set(getSearchTokens([
        item.category,
        item.subcategory,
        ...(item.tags || []),
      ].join(" ")));
      const score = queryTokens.reduce((total, token) => {
        const rarity = Math.log(
          (faqData.length + 1) / ((TOKEN_DOCUMENT_FREQUENCY.get(token) || 0) + 1)
        ) + 1;
        if (questionTokens.has(token)) return total + rarity * 3;
        if (keywordTokens.has(token)) return total + rarity * 2;
        if (metadataTokens.has(token)) return total + rarity;
        return total;
      }, 0);
      return { item, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((result) => result.item);
}

/** Return ordered phrase matches first, then related results without duplicates. */
export function searchFAQGroups(query, limit = 10) {
  if (!query?.trim() || limit <= 0) {
    return { sequenceMatches: [], similarMatches: [] };
  }

  const sequenceMatches = getSequenceFAQs(query, limit);
  const similarMatches = getSimilarFAQs(
    query,
    sequenceMatches,
    limit - sequenceMatches.length
  );

  return { sequenceMatches, similarMatches };
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
