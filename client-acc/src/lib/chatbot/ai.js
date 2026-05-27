/**
 * AskACC – AI fallback module (disabled).
 *
 * Gemini integration removed. When no FAQ match is found the chatbot
 * directs the user to contact ACC directly.
 */

/**
 * Always returns null — no AI fallback.
 * @returns {Promise<null>}
 */
export async function askAI() {
  return null;
}

/**
 * Kept for API compatibility (unused now that AI is disabled).
 */
export function shouldFallbackToAI() {
  return false;
}
