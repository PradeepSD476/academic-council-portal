import Fuse from 'fuse.js';

export default function useFuseSearch(faqs) {
  const fuse = new Fuse(faqs, {
    keys: ['question', 'answer', 'keywords', 'tags', 'category', 'subcategory'],
    threshold: 0.35,
    includeScore: true,
    minMatchCharLength: 2,
  });

  const searchFAQs = (query) => {
    const results = fuse.search(query);
    return results.filter(r => r.score < 0.35).slice(0, 3).map(r => r.item);
  };

  const getCategoryFAQs = (category) => {
    return faqs.filter(f => f.category.toLowerCase() === category.toLowerCase()).slice(0, 3);
  };

  return { searchFAQs, getCategoryFAQs };
}
