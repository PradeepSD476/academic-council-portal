/**
 * useChatbot – Central chatbot state machine.
 *
 * Responsibilities:
 *  - Messages array management
 *  - Typing / loading state
 *  - sendMessage(query) → Fuse search → optional AI fallback
 *  - selectCategory(categoryKey) → show FAQs for that category
 *  - clearChat() → reset to welcome state
 *  - Unread badge count (increments when panel is closed)
 */

import { useState, useCallback, useRef } from "react";
import { searchFAQs, getFAQsByCategory } from "@/lib/chatbot/search.js";
import { COMMANDS } from "@/lib/chatbot/categories.js";

const WELCOME_MESSAGE = {
  id: "welcome",
  type: "bot",
  text: "Hi! I'm **AskACC** 🎓 Your IIT Patna guide. Ask me anything about admissions, hostel, fees, placements, and more!",
  timestamp: new Date(),
};

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function createBotMessage(overrides) {
  return {
    id: makeId(),
    type: "bot",
    timestamp: new Date(),
    ...overrides,
  };
}

function createUserMessage(text) {
  return {
    id: makeId(),
    type: "user",
    text,
    timestamp: new Date(),
  };
}

export function useChatbot({ isOpen }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  // Reset unread when panel opens
  const handleOpen = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const pushBotMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, createBotMessage(msg)]);
    // Increment badge only when panel is closed
    if (!isOpenRef.current) {
      setUnreadCount((n) => n + 1);
    }
  }, []);

  /**
   * sendMessage – main entry point for user queries.
   * Handles: command shortcuts, Fuse search, AI fallback.
   */
  const sendMessage = useCallback(
    async (rawQuery) => {
      const query = rawQuery?.trim();
      if (!query) return;

      // Add user bubble
      setMessages((prev) => [...prev, createUserMessage(query)]);
      setIsTyping(true);

      // Simulate realistic thinking delay
      await new Promise((r) => setTimeout(r, 650));

      try {
        // 1. Check for command shortcuts
        const commandKey = query.toLowerCase().split(/\s+/)[0];
        if (COMMANDS[commandKey]) {
          const faqs = getFAQsByCategory(COMMANDS[commandKey], 20);
          if (faqs.length > 0) {
            pushBotMessage({
              faqs,
              category: COMMANDS[commandKey],
              text: `Here are the top results for **${COMMANDS[commandKey]}**:`,
            });
            setIsTyping(false);
            return;
          }
        }

        // 2. Fuse.js semantic search
        const results = searchFAQs(query, 10);

        // Show FAQ cards whenever the search finds anything.
        // searchFAQs already applies the score threshold — no need to re-check here.
        if (results.length > 0) {
          pushBotMessage({
            faqs: results,
            text:
              results.length === 1
                ? "Here's what I found:"
                : `Found **${results.length}** relevant answers:`,
          });
        } else {
          // No FAQ match — direct user to contact ACC
          pushBotMessage({
            text: "I couldn't find that in our FAQ database. For personalised help, please reach out to the **Academic Council** directly:\n\n📧 **acc@iitp.ac.in**\n\nOr browse our FAQ categories below 👇",
            showCategories: true,
            isContactMessage: true,
          });
        }
      } catch {
        pushBotMessage({
          text: "Something went wrong. Please try again or contact **acc@iitp.ac.in** 📧",
        });
      } finally {
        setIsTyping(false);
      }
    },
    [pushBotMessage]
  );

  /**
   * selectCategory – Browse FAQs by category chip click.
   */
  const selectCategory = useCallback(
    (categoryKey) => {
      const faqs = getFAQsByCategory(categoryKey, 20);
      // Add a user message showing what was clicked
      setMessages((prev) => [
        ...prev,
        createUserMessage(`Show me FAQs for: ${categoryKey}`),
      ]);

      setTimeout(() => {
        if (faqs.length > 0) {
          pushBotMessage({
            faqs,
            category: categoryKey,
            text: `Here are the top **${categoryKey}** FAQs:`,
          });
        } else {
          pushBotMessage({
            text: `No FAQs found for **${categoryKey}** yet. Try searching instead!`,
          });
        }
      }, 400);
    },
    [pushBotMessage]
  );

  /**
   * clearChat – Reset to initial welcome state.
   */
  const clearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setIsTyping(false);
  }, []);

  const isWelcomeState = messages.length === 1 && messages[0].id === "welcome";

  return {
    messages,
    isTyping,
    unreadCount,
    isWelcomeState,
    sendMessage,
    selectCategory,
    clearChat,
    handleOpen,
  };
}
