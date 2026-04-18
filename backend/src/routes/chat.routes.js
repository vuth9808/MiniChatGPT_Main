const express = require("express");
const { authOptional, authRequired } = require("../middleware/auth");
const { query } = require("../db");
const { generateAssistantReply } = require("../utils/gemini");
const { checkLimit } = require("../utils/rateLimiter");
const { getFallbackResponse } = require("../utils/fallback");
const { classifyGeminiError, formatErrorResponse, ERROR_TYPES } = require("../utils/errorHandler");

const router = express.Router();

// GET /conversations - get all conversations for logged-in user
router.get("/conversations", authRequired, async (req, res, next) => {
  try {
    const conversations = await query(
      `SELECT id, title, created_at, updated_at FROM conversations 
       WHERE user_id = $1 
       ORDER BY updated_at DESC`,
      [req.user.id]
    );
    return res.json({ conversations });
  } catch (err) {
    return next(err);
  }
});

// POST /conversations - create a new conversation
// FIX: Removed quota check call — no longer wastes an API call on every new conversation.
// Quota errors are handled naturally when the first message is sent.
router.post("/conversations", authRequired, async (req, res, next) => {
  try {
    const { title } = req.body || {};
    const conversationTitle = title || "New Conversation";

    const result = await query(
      `INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING id`,
      [req.user.id, conversationTitle]
    );

    return res.status(201).json({
      conversation: {
        id: result[0].id,
        title: conversationTitle,
        created_at: new Date(),
        updated_at: new Date(),
        messages: []
      }
    });
  } catch (err) {
    return next(err);
  }
});

// GET /conversations/:id - get conversation with all messages
router.get("/conversations/:id", authRequired, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid conversation id" });

    // Check that conversation belongs to user
    const convRows = await query(
      `SELECT id, title, created_at FROM conversations WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    if (!convRows.length) return res.status(404).json({ message: "Conversation not found" });

    // Get all messages in conversation
    const messages = await query(
      `SELECT id, role, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    const conversation = convRows[0];
    return res.json({ conversation: { ...conversation, messages } });
  } catch (err) {
    return next(err);
  }
});

// POST /conversations/:id/messages - add message to conversation
router.post("/conversations/:id/messages", authRequired, async (req, res, next) => {
  try {
    const conversationId = Number(req.params.id);
    const { message } = req.body || {};

    if (!conversationId) return res.status(400).json({ message: "Invalid conversation id" });
    if (!message || !String(message).trim()) {
      return res.status(400).json(
        formatErrorResponse(null, ERROR_TYPES.VALIDATION_ERROR)
      );
    }

    // Check rate limit
    if (!checkLimit(req)) {
      console.warn("[RATE_LIMIT] User rate limited:", req.user.id);
      return res.status(429).json(
        formatErrorResponse(null, ERROR_TYPES.RATE_LIMIT)
      );
    }

    // Check that conversation belongs to user
    const convRows = await query(
      `SELECT id FROM conversations WHERE id = $1 AND user_id = $2`,
      [conversationId, req.user.id]
    );
    if (!convRows.length) {
      return res.status(404).json(
        formatErrorResponse(null, ERROR_TYPES.NOT_FOUND)
      );
    }

    // FIX: Reduced from 20 → 10 messages to reduce input tokens sent to Gemini.
    // 10 messages is sufficient context for most conversations.
    const historyRows = await query(
      `SELECT role, content FROM messages 
       WHERE conversation_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [conversationId]
    );

    // Reverse to get chronological order, then build contents array
    const history = historyRows.reverse();
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Append current user message
    contents.push({
      role: 'user',
      parts: [{ text: String(message).trim() }]
    });

    // Generate AI response
    let responseText;

    try {
      responseText = await generateAssistantReply({ contents });
    } catch (err) {
      console.error("[GEMINI_ERROR]", err.message);

      const errorType = classifyGeminiError(err);
      console.log(`[GEMINI_ERROR_CLASSIFIED] Type: ${errorType}`);

      // For quota exceeded, return 429 immediately — do not save to DB
      if (errorType === ERROR_TYPES.QUOTA_EXCEEDED) {
        console.warn("[QUOTA_EXCEEDED] Daily quota exhausted for user:", req.user.id);
        return res.status(429).json(
          formatErrorResponse(null, ERROR_TYPES.QUOTA_EXCEEDED)
        );
      }

      // For rate limit or other server errors, use fallback response
      console.warn("[FALLBACK] Using fallback response due to:", err.message);
      responseText = getFallbackResponse();
    }

    const userContent = String(message).trim();

    // FIX: Merged 2 separate INSERT queries into 1 to reduce DB round trips.
    // Also merged the UPDATE updated_at into the same transaction using a CTE.
    const insertResult = await query(
      `WITH ins AS (
         INSERT INTO messages (conversation_id, role, content)
         VALUES ($1, 'user', $2), ($1, 'assistant', $3)
         RETURNING id, role
       ),
       upd AS (
         UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1
       )
       SELECT id, role FROM ins`,
      [conversationId, userContent, responseText]
    );

    const userMsg   = insertResult.find(r => r.role === 'user');
    const assistantMsg = insertResult.find(r => r.role === 'assistant');

    return res.status(201).json({
      messages: [
        { id: userMsg.id,      role: "user",      content: userContent,   created_at: new Date() },
        { id: assistantMsg.id, role: "assistant",  content: responseText,  created_at: new Date() }
      ]
    });
  } catch (err) {
    return next(err);
  }
});

// DELETE /conversations/:id - delete conversation
router.delete("/conversations/:id", authRequired, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid conversation id" });

    const rows = await query(
      `SELECT id FROM conversations WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Conversation not found" });

    await query(`DELETE FROM conversations WHERE id = $1`, [id]);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

// GET /chat - DEPRECATED: kept for backwards compatibility
router.get("/chat", authRequired, async (req, res, next) => {
  try {
    const chats = await query(
      "SELECT id, message, response, created_at FROM chats WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    return res.json({ chats });
  } catch (err) {
    return next(err);
  }
});

// POST /chat - DEPRECATED: kept for backwards compatibility (guest/temp conversation)
router.post("/chat", authOptional, async (req, res, next) => {
  try {
    if (!checkLimit(req)) {
      console.warn("[RATE_LIMIT] Guest rate limited from IP:", req.ip);
      return res.status(429).json(
        formatErrorResponse(null, ERROR_TYPES.RATE_LIMIT)
      );
    }

    const { message } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json(
        formatErrorResponse(null, ERROR_TYPES.VALIDATION_ERROR)
      );
    }

    let responseText;
    try {
      const contents = [{ role: 'user', parts: [{ text: String(message).trim() }] }];
      responseText = await generateAssistantReply({ contents });
    } catch (err) {
      console.error("[GEMINI_ERROR]", err.message);
      const errorType = classifyGeminiError(err);

      if (errorType === ERROR_TYPES.QUOTA_EXCEEDED) {
        console.warn("[QUOTA_EXCEEDED] Daily quota exhausted");
        return res.status(429).json(
          formatErrorResponse(null, ERROR_TYPES.QUOTA_EXCEEDED)
        );
      }

      responseText = getFallbackResponse();
      console.warn(`[FALLBACK] Using fallback response due to: ${err.message}`);
    }

    if (!req.user) {
      return res.status(201).json({
        chat: { id: null, message: String(message), response: responseText, created_at: new Date() }
      });
    }

    const result = await query(
      "INSERT INTO chats (user_id, message, response) VALUES ($1, $2, $3) RETURNING id",
      [req.user.id, String(message), responseText]
    );

    return res.status(201).json({
      chat: { id: result[0].id, message: String(message), response: responseText, created_at: new Date() }
    });
  } catch (err) {
    return next(err);
  }
});

// DELETE /chat/:id - DEPRECATED: delete individual chat
router.delete("/chat/:id", authRequired, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const rows = await query("SELECT id FROM chats WHERE id = $1 AND user_id = $2 LIMIT 1", [
      id,
      req.user.id
    ]);
    if (!rows.length) return res.status(404).json({ message: "Chat not found" });

    await query("DELETE FROM chats WHERE id = $1", [id]);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
