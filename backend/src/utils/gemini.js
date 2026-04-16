const { GoogleGenerativeAI } = require("@google/genai");
const { env } = require("./env");
const { get: getCached, set: setCached } = require("./cache");

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const SYSTEM_INSTRUCTION =
  "You are a helpful assistant in a web chat app. Keep answers concise unless the user asks for detail.";

async function generateAssistantReply({ message }) {
  // Check cache first
  const cached = getCached(message);
  if (cached) {
    return cached;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: env.GEMINI_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: { temperature: 0.7 }
    });

    const result = await model.generateContent(String(message || ""));
    const text = result.response.text();
    const trimmed = text.trim();
    
    // Cache successful response
    setCached(message, trimmed);
    
    return trimmed;
  } catch (err) {
    const msg = String(err?.message || "Gemini request failed");
    const e = new Error("AI service is temporarily unavailable");

    // Detect quota exceeded vs rate limit
    if (msg.includes("[429")) {
      e.status = 429;
      
      // Check if it's specifically quota exceeded
      if (msg.includes("quota") || msg.includes("Quota") || msg.toLowerCase().includes("resource has been exhausted")) {
        e.message = "Daily quota exceeded. Please try again tomorrow.";
        e.isQuotaExceeded = true;  // Mark as quota for backend to identify
      } else {
        e.message = "Too many requests. Please wait a moment before trying again.";
        e.isRateLimit = true;      // Mark as rate limit
      }
    } else if (msg.includes("[404")) {
      e.status = 503;
      e.message = `AI model "${env.GEMINI_MODEL}" is unavailable. Please check GEMINI_MODEL.`;
    } else if (msg.toLowerCase().includes("resource exhausted")) {
      // Gemini sometimes reports quota as "resource exhausted"
      e.status = 429;
      e.message = "Daily quota exceeded. Please try again tomorrow.";
      e.isQuotaExceeded = true;
    } else {
      e.status = 503;
      e.message = "AI service error. Please try again.";
    }

    e.cause = err;
    throw e;
  }
}

module.exports = { generateAssistantReply };
