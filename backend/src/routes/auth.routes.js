const express = require("express");
const bcrypt = require("bcryptjs");
const { query } = require("../db");
const { signAccessToken } = require("../utils/tokens");

const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email, password are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await query(
      "SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1",
      [email, username]
    );
    if (existing.length) return res.status(409).json({ message: "Email or username already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const result = await query(
      "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, 'user') RETURNING id",
      [username, email, hashed]
    );

    const user = { id: result[0].id, username, email, role: "user" };
    const token = signAccessToken(user);
    return res.status(201).json({ token, user });
  } catch (err) {
    return next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "email and password are required" });

    const rows = await query(
      "SELECT id, username, email, password, role FROM users WHERE email = $1 LIMIT 1",
      [email]
    );
    if (!rows.length) return res.status(401).json({ message: "Invalid credentials" });

    const userRow = rows[0];
    const ok = await bcrypt.compare(password, userRow.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const user = { id: userRow.id, username: userRow.username, email: userRow.email, role: userRow.role };
    const token = signAccessToken(user);
    return res.json({ token, user });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

