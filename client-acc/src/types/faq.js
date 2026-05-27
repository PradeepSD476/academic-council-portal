/**
 * @fileoverview JSDoc type definitions for the AskACC FAQ chatbot system.
 * These act as lightweight TypeScript-like contracts for the JS codebase.
 */

/**
 * @typedef {Object} FAQItem
 * @property {string} id           - Unique identifier
 * @property {string} category     - Top-level category (e.g. "Hostel")
 * @property {string} subcategory  - Sub-category (e.g. "Allotment")
 * @property {string} question     - The full question text
 * @property {string} answer       - The answer text (may include markdown)
 * @property {string[]} keywords   - Keywords for fuzzy search
 * @property {"high"|"medium"|"low"} priority - Answer importance level
 * @property {string} source       - Original source / office
 * @property {string[]} tags       - Additional searchable tags
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id          - Unique message id
 * @property {"user"|"bot"} role  - Who sent the message
 * @property {string} content     - Message text
 * @property {number} timestamp   - Unix timestamp (ms)
 * @property {boolean} [isTyping] - True while bot is "typing"
 */

/**
 * @typedef {Object} SearchResult
 * @property {FAQItem} item  - The matched FAQ entry
 * @property {number} score  - Fuse.js match score (lower = better)
 */

/**
 * @typedef {Object} ChatbotState
 * @property {boolean} isOpen       - Whether the chatbot panel is open
 * @property {ChatMessage[]} messages - Array of chat messages
 * @property {boolean} isTyping     - Whether the bot is processing
 * @property {string} inputValue    - Current input field value
 */

// Export a dummy object so this file can be imported without issues
export default {};
