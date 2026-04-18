const { GoogleGenAI } = require("@google/genai");
const { env } = require("./env");
const { get: getCached, set: setCached } = require("./cache");

const genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION =
  "You are a friendly and helpful AI assistant in a chat app. Provide clear, conversational responses. Use the chat history to maintain context and continuity. Be concise but helpful, and try to give direct answers unless the user asks for more detail.";

async function generateAssistantReply({ contents }) {
  const cacheKey = JSON.stringify(contents);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const result = await genAI.models.generateContent({
      model: env.GEMINI_MODEL,
      contents,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300
      }
    });

    const text = result.text || "";
    const trimmed = text.trim();

    // Cache lại
    setCached(cacheKey, trimmed);

    return trimmed;

  } catch (err) {
    const msg = String(err?.message || "Gemini request failed");
    const e = new Error("AI service is temporarily unavailable");

    if (msg.includes("[429")) {
      e.status = 429;

      if (
        msg.toLowerCase().includes("quota") ||
        msg.toLowerCase().includes("resource exhausted")
      ) {
        e.message = "Daily quota exceeded. Please try again tomorrow.";
        e.isQuotaExceeded = true;
      } else {
        e.message = "Too many requests. Please wait a moment.";
        e.isRateLimit = true;
      }

    } else if (msg.includes("[404")) {
      e.status = 503;
      e.message = `AI model "${env.GEMINI_MODEL}" is unavailable. Check GEMINI_MODEL.`;

    } else {
      e.status = 503;
      e.message = "AI service error. Please try again.";
    }

    e.cause = err;
    throw e;
  }
}

module.exports = { generateAssistantReply };
