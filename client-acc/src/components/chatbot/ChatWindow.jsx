import React, { memo } from "react";
import ChatMessage from "./ChatMessage.jsx";
import FAQCard from "./FAQCard.jsx";
import CategoryChips from "./CategoryChips.jsx";
import QuickSuggestions from "./QuickSuggestions.jsx";
import TypingIndicator from "./TypingIndicator.jsx";
import { useScrollToBottom } from "@/hooks/useScrollToBottom.js";

const ChatWindow = memo(function ChatWindow({
  messages,
  isTyping,
  isWelcomeState,
  onCategorySelect,
  onSuggestionSelect,
}) {
  const { chatEndRef } = useScrollToBottom(messages);

  return (
    <div
      className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin bg-slate-50"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.map((msg) => {
        // Bot message with FAQ results
        if (msg.faqs && msg.faqs.length > 0) {
          return (
            <div key={msg.id} className="space-y-2.5">
              {/* Introductory bot text */}
              {msg.text && <ChatMessage message={{ ...msg, faqs: undefined }} />}
              {/* FAQ cards */}
              {msg.faqs.map((faq) => (
                <FAQCard key={faq.id} faq={faq} />
              ))}
            </div>
          );
        }

        // Bot message with category chips suggestion
        if (msg.showCategories) {
          return (
            <div key={msg.id} className="space-y-2.5">
              <ChatMessage message={{ ...msg, showCategories: undefined }} />
              <CategoryChips onSelect={onCategorySelect} />
            </div>
          );
        }

        // Regular user or bot text message
        return <ChatMessage key={msg.id} message={msg} />;
      })}

      {/* Welcome state extras */}
      {isWelcomeState && (
        <div className="space-y-3">
          <QuickSuggestions onSelect={onSuggestionSelect} />
          <CategoryChips onSelect={onCategorySelect} />
        </div>
      )}

      {/* Typing indicator */}
      {isTyping && <TypingIndicator />}

      {/* Auto-scroll anchor */}
      <div ref={chatEndRef} />
    </div>
  );
});

export default ChatWindow;
