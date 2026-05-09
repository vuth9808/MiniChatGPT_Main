const { GoogleGenAI } = require("@google/genai");
const { env } = require("./env");
const { get: getCached, set: setCached } = require("./cache");

const genAI = new GoogleGenAI(env.GEMINI_API_KEY); // Thường truyền trực tiếp API Key

const SYSTEM_INSTRUCTION =
  "You are a friendly and helpful AI assistant in a chat app. Provide clear, conversational responses. Use the chat history to maintain context and continuity. Be concise but helpful, and try to give direct answers unless the user asks for more detail.";

async function generateAssistantReply({ contents }) {
  const cacheKey = JSON.stringify(contents);

  // 1. Kiểm tra cache
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    // Lưu ý: Cú pháp getGenerativeModel thường được dùng trong SDK mới
    const model = genAI.getGenerativeModel({ 
      model: env.GEMINI_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION, // System Instruction nên đặt ở đây
    });

    const result = await model.generateContent({
      contents,
      generationConfig: { // Đổi 'config' thành 'generationConfig' theo chuẩn SDK
        temperature: 0.5,
        maxOutputTokens: 600,
      },
    });

    const response = await result.response;
    const text = response.text();
    const trimmed = text.trim();

    // 2. Lưu cache
    setCached(cacheKey, trimmed);

    return trimmed;

  } catch (err) {
    console.error("FULL GEMINI ERROR DETAILS:", JSON.stringify(err, null, 2));

    const msg = String(err?.message || "");
    const status = err?.status || 500;
    const e = new Error("AI service temporarily unavailable");
    e.status = 503;

    // --- LOGIC PHÂN LOẠI LỖI MỚI ---

    // A. Lỗi khu vực (Location) - Lỗi bạn đang gặp
    if (msg.includes("location is not supported") || msg.includes("FAILED_PRECONDITION")) {
      e.status = 400;
      e.message = "Vùng đặt máy chủ (Singapore) hiện bị Google hạn chế. Vui lòng đổi Region sang US (Oregon/Ohio) trên Render.";
    } 
    
    // B. Quota / Rate Limit
    else if (
      status === 429 || 
      msg.includes("429") || 
      msg.toLowerCase().includes("quota") || 
      msg.toLowerCase().includes("resource exhausted")
    ) {
      e.status = 429;
      if (msg.toLowerCase().includes("quota")) {
        e.message = "Hết hạn mức sử dụng trong ngày (Daily Quota). Thử lại vào ngày mai nhé!";
        e.isQuotaExceeded = true;
      } else {
        e.message = "Bạn đang gửi yêu cầu quá nhanh. Đợi một chút rồi thử lại nhé.";
        e.isRateLimit = true;
      }
    }

    // C. Model không tồn tại
    else if (status === 404 || msg.includes("404")) {
      e.status = 404;
      e.message = `Không tìm thấy model "${env.GEMINI_MODEL}". Kiểm tra lại biến GEMINI_MODEL.`;
    }

    // D. Lỗi API Key hoặc cấu hình sai (400 chung)
    else if (status === 400) {
      e.status = 400;
      e.message = "Yêu cầu không hợp lệ. Có thể do API Key hoặc cấu hình model.";
    }

    // E. Lỗi Server mặc định
    else {
      e.message = "Hệ thống AI đang gặp sự cố nhỏ. Thử lại sau vài giây nhé!";
    }

    e.cause = err;
    throw e;
  }
}

module.exports = { generateAssistantReply };
