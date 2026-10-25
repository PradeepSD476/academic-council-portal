import React, { useState, useEffect } from 'react';
import Editor from '../../components/Editor';
import { createWikiArticle, fetchWikiCategories } from '../../api/wikiApi';

export default function ManageWiki() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchWikiCategories().then(setCategories).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createWikiArticle({ title, slug, content, categoryId });
      alert('Wiki Article Created!');
      setTitle('');
      setSlug('');
      setContent('');
    } catch (err) {
      alert('Error creating article');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Manage ACC Wiki</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title (e.g. How to get Bonafide Certificate)"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
          }}
          className="w-full p-3 border rounded-md text-black"
          required
        />
        <input
          type="text"
          placeholder="Slug (e.g. how-to-get-bonafide)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full p-3 border rounded-md text-black"
          required
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full p-3 border rounded-md text-black"
          required
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <Editor value={content} onChange={setContent} />
        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md">
          Publish Entry
        </button>
      </form>
    </div>
  );
}
