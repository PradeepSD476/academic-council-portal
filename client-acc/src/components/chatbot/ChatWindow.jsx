/**
 * ChatWindow – Scrollable message list container.
 *
 * Renders:
 * - ChatMessage bubbles (user + bot text)
 * - FAQCard sets (bot FAQ results)
 * - CategoryChips (welcome state)
 * - QuickSuggestions (welcome state)
 * - TypingIndicator
 * - Auto-scroll anchor
 */
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
      className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin bg-gradient-to-b from-slate-50/60 to-white"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.map((msg) => {
        // Bot message with FAQ results
        if (msg.faqs && msg.faqs.length > 0) {
          return (
            <div key={msg.id} className="space-y-2">
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
            <div key={msg.id} className="space-y-2">
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
        <>
          <QuickSuggestions onSelect={onSuggestionSelect} />
          <CategoryChips onSelect={onCategorySelect} />
        </>
      )}

      {/* Typing indicator */}
      {isTyping && <TypingIndicator />}

      {/* Auto-scroll anchor */}
      <div ref={chatEndRef} />
    </div>
  );
});

export default ChatWindow;
