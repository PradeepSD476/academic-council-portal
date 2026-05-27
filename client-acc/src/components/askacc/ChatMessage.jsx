export default function ChatMessage({ type, text }) {
  return (
    <div className={`flex ${type === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs px-3 py-2 rounded-lg shadow ${
          type === 'user'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {text}
      </div>
    </div>
  );
}
