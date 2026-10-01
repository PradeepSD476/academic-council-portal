import React, { useState, useEffect } from "react";
import axios from "axios";

const WikiHome = () => {
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Fetch categories and articles from Express backend
    axios.get("http://localhost:3000/api/v1/wiki/categories")
      .then(res => setCategories(res.data))
      .catch(err => console.error("Error fetching categories:", err));

    axios.get("http://localhost:3000/api/v1/wiki/articles")
      .then(res => setArticles(res.data))
      .catch(err => console.error("Error fetching articles:", err));
  }, []);

  // Filter articles based on category selection & search input
  const filteredArticles = articles.filter((article) => {
    const matchesCategory = selectedCategory 
      ? article.categoryId === selectedCategory.id 
      : true;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          article.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto p-6 text-slate-800">
      <h1 className="text-3xl font-bold text-center mb-2">ACC Knowledge Base & Wiki</h1>
      <p className="text-center text-slate-500 mb-6">Search guides, procedural rules, and campus FAQs.</p>

      {/* Search Bar */}
      <div className="mb-8 max-w-lg mx-auto">
        <input
          type="text"
          placeholder="Search guides, e.g. Transcript, Bonafide..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Article Detail View Modal/Section */}
      {selectedArticle ? (
        <div className="p-6 border rounded-xl bg-white shadow-md mb-8">
          <button
            onClick={() => setSelectedArticle(null)}
            className="mb-4 text-sm font-semibold text-blue-600 hover:underline"
          >
            ← Back to Articles
          </button>
          <h2 className="text-2xl font-bold mb-2">{selectedArticle.title}</h2>
          <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-medium">
            {selectedArticle.category?.name || "General"}
          </span>
          <div className="mt-4 text-slate-700 whitespace-pre-line leading-relaxed border-t pt-4">
            {selectedArticle.content}
          </div>
        </div>
      ) : (
        <>
          {/* Categories Grid */}
          <h2 className="text-xl font-semibold mb-4">Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div
              onClick={() => setSelectedCategory(null)}
              className={`p-4 border rounded-xl cursor-pointer transition ${
                selectedCategory === null ? "border-blue-500 bg-blue-50" : "hover:border-slate-400"
              }`}
            >
              <h3 className="font-bold">All Categories</h3>
              <p className="text-xs text-slate-500">Show all published knowledge base articles</p>
            </div>
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className={`p-4 border rounded-xl cursor-pointer transition ${
                  selectedCategory?.id === cat.id ? "border-blue-500 bg-blue-50" : "hover:border-slate-400"
                }`}
              >
                <h3 className="font-bold">{cat.name}</h3>
                <p className="text-xs text-slate-500">{cat.description}</p>
              </div>
            ))}
          </div>

          {/* Articles List */}
          <h2 className="text-xl font-semibold mb-4">
            Articles {selectedCategory ? `(${selectedCategory.name})` : ""}
          </h2>
          <div className="grid gap-4">
            {filteredArticles.length === 0 ? (
              <p className="text-slate-500">No articles found matching your criteria.</p>
            ) : (
              filteredArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="p-5 border rounded-xl hover:shadow-md cursor-pointer transition bg-white"
                >
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{article.title}</h3>
                  <p className="text-xs text-slate-500">
                    Category: {article.category?.name || "Academic Procedures"}
                  </p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default WikiHome;