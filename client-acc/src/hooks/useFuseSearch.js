
/**
 * useFuseSearch – React hook encapsulating the Fuse.js search logic.
 * ...
 * @returns {{ search, byCategory, allCategories }}
 */
import { useCallback, useMemo } from "react";
// ... rest of hook unchanged


import { searchFAQs, getFAQsByCategory, getAllCategories } from "@/lib/chatbot/search.js";

export function useFuseSearch() {
  /** Memoized search function — stable reference, no re-render on each keystroke */
  const search = useCallback((query, limit = 5) => {
    return searchFAQs(query, limit);
  }, []);

  /** Memoized category filter function */
  const byCategory = useCallback((category, limit = 6) => {
    return getFAQsByCategory(category, limit);
  }, []);

  /** All unique categories — computed once */
  const allCategories = useMemo(() => getAllCategories(), []);

  return { search, byCategory, allCategories };
}
