const { GoogleGenAI } = require("@google/genai");
const { env } = require("./env");
const { get: getCached, set: setCached } = require("./cache");

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION =
  "You are a helpful assistant in a web chat app. Keep answers concise unless the user asks for detail.";

async function generateAssistantReply({ message }) {
  const cached = getCached(message);
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: String(message || ""),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7
      }
    });

    const text = response.text || "";
    const trimmed = text.trim();

    setCached(message, trimmed);
    return trimmed;

  } catch (err) {
    const msg = String(err?.message || "Gemini request failed");
    const e = new Error("AI service is temporarily unavailable");

    if (msg.includes("429")) {
      e.status = 429;

      if (
        msg.toLowerCase().includes("quota") ||
        msg.toLowerCase().includes("resource has been exhausted")
      ) {
        e.message = "Daily quota exceeded. Please try again tomorrow.";
        e.isQuotaExceeded = true;
      } else {
        e.message = "Too many requests. Please wait a moment.";
        e.isRateLimit = true;
      }
    } else if (msg.includes("404")) {
      e.status = 503;
      e.message = `AI model "${env.GEMINI_MODEL}" is unavailable.`;
    } else {
      e.status = 503;
      e.message = "AI service error. Please try again.";
    }

    e.cause = err;
    throw e;
  }
}

module.exports = { generateAssistantReply };
