import { useState } from 'react';

export default function FAQCard({ faq }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg shadow p-3 mb-2">
      <h3 className="font-semibold">{faq.question}</h3>
      <p className={`text-sm text-gray-700 ${expanded ? '' : 'line-clamp-3'}`}>
        {faq.answer}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-blue-600 text-xs mt-1"
      >
        {expanded ? 'Show less' : 'Read more'}
      </button>
      <div className="flex gap-2 mt-2">
        <span className="px-2 py-1 text-xs rounded-full bg-gray-200">{faq.category}</span>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            faq.priority === 'high'
              ? 'bg-red-200'
              : faq.priority === 'medium'
              ? 'bg-yellow-200'
              : 'bg-green-200'
          }`}
        >
          {faq.priority}
        </span>
      </div>
    </div>
  );
}
