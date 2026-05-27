import { useState } from 'react';
import AskACCPanel from './AskACCPanel';
import './askacc.css';

export default function AskACCButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Ask ACC Chatbot"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white shadow-lg animate-pulse"
      >
        💬
      </button>
      {open && <AskACCPanel onClose={() => setOpen(false)} />}
    </>
  );
}
