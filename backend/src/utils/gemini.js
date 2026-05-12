const { GoogleGenAI } = require("@google/genai");

const { env } = require("./env");
const { get: getCached, set: setCached } = require("./cache");

const genAI = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

const SYSTEM_INSTRUCTION =
  "You are a friendly and helpful AI assistant in a chat app. Provide clear, conversational responses. Use the chat history to maintain context and continuity. Be concise but helpful, and try to give direct answers unless the user asks for more detail.";

async function generateAssistantReply({ contents }) {
  const cacheKey = JSON.stringify(contents);

  // Check cache first
  const cached = getCached(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const result = await genAI.models.generateContent({
      model: env.GEMINI_MODEL || "gemini-2.5-flash",

      contents,

      config: {
        systemInstruction: SYSTEM_INSTRUCTION,

        temperature: 0.5,

        maxOutputTokens: 600,
      },
    });

    const text = result.text || "";

    const trimmed = text.trim();

    // Save cache
    setCached(cacheKey, trimmed);

    return trimmed;

  } catch (err) {
    console.error("--- GEMINI ERROR DETAILS ---");
    console.error("Message:", err?.message);
    console.error("Status:", err?.status);
    console.error(
      "Full Error:",
      JSON.stringify(err, Object.getOwnPropertyNames(err))
    );
    console.error("-----------------------------");

    const msg = String(err?.message || "");

    const e = new Error("AI service temporarily unavailable");

    // Region blocked
    if (
      msg.includes("location is not supported") ||
      msg.includes("FAILED_PRECONDITION")
    ) {
      e.status = 400;

      e.message =
        "Gemini API is not supported in the current deployment region.";

    // Quota / rate limit
    } else if (
      msg.includes("429") ||
      msg.toLowerCase().includes("quota") ||
      msg.toLowerCase().includes("resource exhausted")
    ) {
      e.status = 429;

      if (
        msg.toLowerCase().includes("quota") ||
        msg.toLowerCase().includes("resource exhausted")
      ) {
        e.message =
          "Gemini API quota exceeded. Please try again later.";

        e.isQuotaExceeded = true;

      } else {
        e.message =
          "Too many requests. Please wait a moment.";

        e.isRateLimit = true;
      }

    // Model not found
    } else if (
      msg.includes("404") ||
      msg.toLowerCase().includes("model")
    ) {
      e.status = 404;

      e.message =
        `Model "${env.GEMINI_MODEL}" was not found or is unsupported.`;

    // Generic server error
    } else {
      e.status = 503;

      e.message =
        `Gemini error: ${msg || "Server Error"}`;
    }

    e.cause = err;

    throw e;
  }
}

module.exports = {
  generateAssistantReply,
};
