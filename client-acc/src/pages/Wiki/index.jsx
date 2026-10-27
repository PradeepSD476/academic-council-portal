import { useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { AlertCircle, BookOpen, Check, ChevronDown, Copy, LoaderCircle, Mail, Search } from 'lucide-react';
import { fetchWikiArticles } from '../../api/wikiApi';

const getArticleContent = (content) => {
  if (typeof content !== 'string') return content || {};
  try {
    return JSON.parse(content);
  } catch {
    return { summary: content };
  }
};

const getSearchableArticle = (article) => {
  const content = getArticleContent(article.content);
  return {
    ...article,
    content,
    searchText: JSON.stringify(content),
    keywords: Array.isArray(content.keywords) ? content.keywords.join(' ') : '',
  };
};

function MailTemplate({ template }) {
  const [copied, setCopied] = useState(false);
  const mailto = `mailto:${template.to}?cc=${encodeURIComponent(template.cc || '')}&subject=${encodeURIComponent(template.subject || '')}&body=${encodeURIComponent(template.body || '')}`;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(`${template.to}${template.cc ? `, ${template.cc}` : ''}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="mt-5 border-t border-slate-200 pt-4" aria-label="Email template">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Mail size={16} aria-hidden="true" /> Email template
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyAddress}
            title="Copy email addresses"
            aria-label="Copy email addresses"
            className="inline-flex size-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <a href={mailto} className="academic-btn-primary gap-2">
            <Mail size={15} aria-hidden="true" /> Compose email
          </a>
        </div>
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-[4.5rem_1fr]">
        <dt className="font-semibold text-slate-600">To</dt>
        <dd className="break-all text-slate-900">{template.to}</dd>
        {template.cc && <>
          <dt className="font-semibold text-slate-600">CC</dt>
          <dd className="break-all text-slate-900">{template.cc}</dd>
        </>}
        {template.subject && <>
          <dt className="font-semibold text-slate-600">Subject</dt>
          <dd className="text-slate-900">{template.subject}</dd>
        </>}
      </dl>
      {template.body && (
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-4 font-sans text-sm leading-6 text-slate-700">
          {template.body}
        </pre>
      )}
    </section>
  );
}

function Article({ article, expanded, onToggle }) {
  const { content } = article;
  const steps = Array.isArray(content.steps) ? content.steps : [];
  const notes = Array.isArray(content.importantNotes) ? content.importantNotes : [];

  return (
    <article className="border-b border-slate-200 py-5 first:border-t">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <span className="min-w-0">
          <span className="mb-1 block text-xs font-semibold uppercase text-blue-800">{article.category?.name || 'Wiki'}</span>
          <span className="block text-lg font-bold text-slate-950">{article.title}</span>
          {content.summary && <span className="mt-1 block text-sm leading-6 text-slate-600">{content.summary}</span>}
        </span>
        <ChevronDown size={20} className={`mt-1 shrink-0 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {expanded && (
        <div className="mt-5 pl-0 sm:pl-2">
          {steps.length > 0 && (
            <ol className="space-y-5">
              {steps.map((step, index) => (
                <li key={`${step.title}-${index}`} className="grid grid-cols-[2rem_1fr] gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-900">{index + 1}</span>
                  <div className="min-w-0 pt-1">
                    <h3 className="font-bold text-slate-900">{step.title}</h3>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{step.description}</p>
                    {step.mailTemplate && <MailTemplate template={step.mailTemplate} />}
                  </div>
                </li>
              ))}
            </ol>
          )}

          {notes.length > 0 && (
            <section className="mt-6 border-l-4 border-amber-500 bg-amber-50 px-4 py-3">
              <h3 className="font-bold text-slate-900">Important notes</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                {notes.map((note, index) => <li key={`${note}-${index}`}>{note}</li>)}
              </ul>
            </section>
          )}
        </div>
      )}
    </article>
  );
}

export default function WikiHome() {
  const [articles, setArticles] = useState([]);
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    fetchWikiArticles()
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error('The Wiki API returned an invalid response.');
        }
        if (active) setArticles(data.map(getSearchableArticle));
      }).catch((loadError) => {
        console.error('Failed to load Wiki articles:', loadError);
        if (!active) return;

        const status = loadError.response?.status;
        const backendError = loadError.response?.data?.error || '';
        if (status >= 500 && /can't reach database server|database server/i.test(backendError)) {
          setError('The Wiki server cannot reach PostgreSQL. Start the database and check the backend database connection.');
        } else if (status) {
          setError(`The Wiki server returned an error (${status}). Check the backend and try again.`);
        } else if (loadError.request) {
          setError('Cannot reach the Wiki API. Confirm the backend is running and the frontend API proxy is configured.');
        } else {
          setError('The Wiki API returned an invalid response. Check the backend logs and try again.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [retryCount]);

  const fuse = useMemo(() => new Fuse(articles, {
    threshold: 0.32,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'keywords', weight: 0.3 },
      { name: 'content.summary', weight: 0.15 },
      { name: 'searchText', weight: 0.1 },
      { name: 'category.name', weight: 0.05 },
    ],
  }), [articles]);

  const results = useMemo(() => {
    const search = query.trim();
    if (!search) return articles;

    const matches = new Map();
    fuse.search(search).forEach(({ item, score }) => {
      matches.set(item.id, { item, terms: new Set(), phraseScore: score ?? 1, tokenScore: 0 });
    });

    const terms = [...new Set(search.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || [])]
      .filter((term) => term.length > 1);
    terms.forEach((term) => {
      fuse.search(term).forEach(({ item, score }) => {
        const match = matches.get(item.id) || { item, terms: new Set(), phraseScore: 1, tokenScore: 0 };
        match.terms.add(term);
        match.tokenScore += score ?? 1;
        matches.set(item.id, match);
      });
    });

    return [...matches.values()]
      .sort((left, right) => right.terms.size - left.terms.size
        || left.phraseScore - right.phraseScore
        || left.tokenScore - right.tokenScore)
      .map(({ item }) => item);
  }, [articles, fuse, query]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 pb-9 pt-16 sm:pt-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-800">
            <BookOpen size={17} aria-hidden="true" /> ACC Wiki
          </div>
          <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl">Practical answers for day-to-day doubts</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Search resolution steps, official contacts, and email formats for common academic and portal issues.
          </p>
          <label className="mt-6 flex max-w-3xl items-center gap-3 border border-slate-300 bg-white px-4 py-3 shadow-sm focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-100">
            <Search size={19} className="shrink-0 text-slate-500" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setExpandedId(null);
              }}
              placeholder="Try: fee debited but AIS still unpaid, UTR, receipt..."
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
              aria-label="Search Wiki articles"
            />
            {query && <button type="button" onClick={() => setQuery('')} className="text-sm font-semibold text-blue-800 hover:underline">Clear</button>}
          </label>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-7 sm:py-10">
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-950">{query.trim() ? 'Matching guides' : 'Resolution guides'}</h2>
          {!loading && <p className="text-sm text-slate-500">{results.length} {results.length === 1 ? 'result' : 'results'}</p>}
        </div>

        {loading && <div className="flex items-center gap-2 py-8 text-sm text-slate-600"><LoaderCircle size={18} className="animate-spin" /> Loading Wiki articles...</div>}
        {error && (
          <div role="alert" className="flex flex-wrap items-center gap-2 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-900">
            <AlertCircle size={18} aria-hidden="true" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => {
                setError('');
                setLoading(true);
                setRetryCount((count) => count + 1);
              }}
              className="font-semibold underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}
        {!loading && !error && results.length === 0 && (
          <div className="border-y border-slate-200 py-8 text-sm text-slate-600">
            No guide matched “{query}”. Try a related phrase such as “payment”, “portal”, “transaction”, or “email”.
          </div>
        )}
        {!loading && !error && results.map((article) => (
          <Article
            key={article.id}
            article={article}
            expanded={expandedId === article.id}
            onToggle={() => setExpandedId((current) => current === article.id ? null : article.id)}
          />
        ))}
      </main>
    </div>
  );
}