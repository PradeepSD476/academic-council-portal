import { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import CategoryChips from './CategoryChips';
import FAQCard from './FAQCard';
import TypingIndicator from './TypingIndicator';
import useFuseSearch from './useFuseSearch';
import faqs from '../../assets/askacc_faqs.json';
import './askacc.css';

export default function AskACCPanel({ onClose }) {
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Hi! I'm AskACC 👋 Ask me anything about IIT Patna — admissions, hostel, fees, placements, and more!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const { searchFAQs, getCategoryFAQs } = useFuseSearch(faqs);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { type: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const results = searchFAQs(input);
      if (results.length > 0) {
        setMessages(prev => [...prev, { type: 'bot', faqs: results }]);
      } else {
        setMessages(prev => [...prev, { type: 'bot', text: "I couldn't find an exact answer. Try asking about: hostel, fees, documents, placement, or travel 🙂" }]);
      }
      setLoading(false);
    }, 800);
  };

  const handleCategoryClick = (category) => {
    const results = getCategoryFAQs(category);
    setMessages(prev => [...prev, { type: 'bot', faqs: results }]);
  };

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[550px] bg-white shadow-xl rounded-lg flex flex-col z-50 transition-transform animate-slide-up">
      {/* Header */}
      <div className="bg-[#1e3a5f] text-white px-4 py-3 flex justify-between items-center rounded-t-lg">
        <div>
          <h2 className="font-bold">AskACC 🎓</h2>
          <p className="text-sm">Your IIT Patna Guide</p>
        </div>
        <button aria-label="Close chatbot" onClick={onClose}>✖</button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, idx) =>
          msg.faqs ? (
            msg.faqs.map(faq => <FAQCard key={faq.id} faq={faq} />)
          ) : (
            <ChatMessage key={idx} type={msg.type} text={msg.text} />
          )
        )}
        {loading && <TypingIndicator />}
        {messages.length === 1 && <CategoryChips onSelect={handleCategoryClick} />}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t flex">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type your question..."
          className="flex-1 border rounded-l px-3 py-2 focus:outline-none"
        />
        <button
          aria-label="Send message"
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 rounded-r"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
