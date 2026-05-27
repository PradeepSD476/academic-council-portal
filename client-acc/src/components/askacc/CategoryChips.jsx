const categories = [
  'Admissions', 'Hostel', 'Finance', 'Placements',
  'Essentials', 'Travel', 'Campus Life', 'Hotels Nearby'
];

export default function CategoryChips({ onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm hover:bg-blue-200"
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
