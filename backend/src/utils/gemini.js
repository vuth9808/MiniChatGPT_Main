const { GoogleGenAI } = require("@google/genai");
const { env } = require("./env");
const { get: getCached, set: setCached } = require("./cache");


const genAI = new GoogleGenAI(env.GEMINI_API_KEY);

const SYSTEM_INSTRUCTION =
  "You are a friendly and helpful AI assistant in a chat app. Provide clear, conversational responses. Use the chat history to maintain context and continuity. Be concise but helpful, and try to give direct answers unless the user asks for more detail.";

async function generateAssistantReply({ contents }) {
  const cacheKey = JSON.stringify(contents);

  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    
    const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

    const result = await model.generateContent({
      contents,
      generationConfig: { 
        temperature: 0.5,
        maxOutputTokens: 600,
      },
      
    });

    const response = await result.response;
    const text = response.text();
    const trimmed = text.trim();

    setCached(cacheKey, trimmed);
    return trimmed;

  } catch (err) {
    console.error("--- CHI TIẾT LỖI GEMINI ---");
    console.error("Message:", err.message);
    console.error("Status:", err.status);

    console.error("Full Error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    console.error("---------------------------");

    const msg = String(err?.message || "");
    const status = err?.status || 500;
    const e = new Error("AI service temporarily unavailable");

    if (msg.includes("location is not supported") || msg.includes("FAILED_PRECONDITION")) {
      e.status = 400;
      e.message = "Vùng đặt máy chủ hiện bị Google hạn chế. Hãy đổi Region sang US trên Render.";
    } 
    else if (status === 429 || msg.includes("429") || msg.toLowerCase().includes("quota")) {
      e.status = 429;
      e.message = "Hết hạn mức hoặc yêu cầu quá nhanh.";
    }
    else {
      e.status = 503;
      e.message = `Lỗi Gemini: ${msg || "Server Error"}`;
    }

    e.cause = err;
    throw e;
  }
}

module.exports = { generateAssistantReply };
