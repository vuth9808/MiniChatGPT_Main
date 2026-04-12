const express = require("express");
const { authRequired, adminOnly } = require("../middleware/auth");
const { query } = require("../db");

const router = express.Router();

// GET /users (admin) - list users with stats
router.get("/users", authRequired, adminOnly, async (_req, res, next) => {
  try {
    const users = await query(`
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.role, 
        u.created_at,
        COUNT(DISTINCT c.id)::int as conversation_count,
        COUNT(DISTINCT m.id)::int as message_count
      FROM users u
      LEFT JOIN conversations c ON u.id = c.user_id
      LEFT JOIN messages m ON c.id = m.conversation_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

// DELETE /users/:id (admin) - delete user (cascades chats)
router.delete("/users/:id", authRequired, adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const rows = await query("SELECT id FROM users WHERE id = $1 LIMIT 1", [id]);
    if (!rows.length) return res.status(404).json({ message: "User not found" });

    await query("DELETE FROM users WHERE id = $1", [id]);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

// GET /users/:id/chats (admin) - view a user's chats
router.get("/users/:id/chats", authRequired, adminOnly, async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) return res.status(400).json({ message: "Invalid id" });

    const chats = await query(
      "SELECT id, message, response, created_at FROM chats WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return res.json({ chats });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

