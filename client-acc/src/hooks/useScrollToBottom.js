/**
 * useScrollToBottom – Auto-scroll to end of a container on messages change.
 *
 * Usage:
 *   const { chatEndRef } = useScrollToBottom(messages);
 *   <div ref={chatEndRef} />  ← place at bottom of list
 */
import { useRef, useEffect } from "react";

export function useScrollToBottom(dependency) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [dependency]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  return { chatEndRef, scrollToBottom };
}
