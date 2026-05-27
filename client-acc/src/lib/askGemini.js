/**
 * askGemini – AI fallback for AskACC chatbot.
 *
 * Called when Fuse.js cannot find a strong FAQ match.
 * Uses Gemini 2.0 Flash with a broad IIT Patna context —
 * not restricted to FAQ data only, so it can answer general
 * campus questions like "how to go from IIT Patna to Patna Junction".
 *
 * @param {string} query - The user's question.
 * @returns {Promise<string>} - The AI-generated answer.
 */
import faqData from "../data/faq.json";

export async function askGemini(query) {
  // ── CONFIGURATION ───────────────────────────────────────────────────────────
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const MODEL   = "gemini-flash-latest";   // tested: works with this API key
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  // ── PLACEHOLDER CHECK ────────────────────────────────────────────────────────
  if (!API_KEY) {
    return "I'm AskACC's AI mode — API key not configured. Please contact **acc@iitp.ac.in** for assistance.";
  }

  // Summarise FAQ categories so Gemini knows the domain
  const faqSummary = [...new Set(faqData.map(f => f.category))].join(", ");

  // ── SYSTEM PROMPT ────────────────────────────────────────────────────────────
  // NOTE: Gemini is allowed to use its general knowledge for IIT Patna questions
  // that fall outside the FAQ dataset (e.g., travel directions, general campus info).
  const systemPrompt = `You are AskACC, a friendly and knowledgeable AI assistant for students at IIT Patna (Indian Institute of Technology Patna), Bihar, India.

Your role:
- Answer questions about IIT Patna campus life, academics, admissions, hostel, fees, placements, travel, and general student queries.
- The portal has FAQs covering these categories: ${faqSummary}.
- If the question is covered in IIT Patna's domain, answer it helpfully using your general knowledge.
- Use bullet points or numbered steps when listing information.
- If you truly don't know something specific (like real-time data), acknowledge it and suggest contacting acc@iitp.ac.in.
- Do NOT refuse to answer general IIT Patna questions just because they aren't in the FAQ.
- IMPORTANT: Always write complete, full answers. Never stop mid-sentence or mid-word. Finish every thought completely.

Format: plain text, conversational, no headers. Use numbered steps for directions/processes.`;

  // ── API CALL ─────────────────────────────────────────────────────────────────
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}\n\nStudent question: ${query}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topP: 0.9,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.error("[AskGemini] API error:", response.status, errBody);

      if (response.status === 429) {
        return "I'm a bit overloaded right now (rate limit reached). Please try again in a minute, or browse the FAQ categories below! 🙂";
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Empty Gemini response");
    }

    return text.trim();
  } catch (error) {
    console.error("[AskGemini] Error:", error);
    return "I'm having trouble connecting right now. Please try again or contact **acc@iitp.ac.in** 📧";
  }
}
