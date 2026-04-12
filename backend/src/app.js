require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const chatRoutes = require("./routes/chat.routes");
const adminRoutes = require("./routes/admin.routes");
const { errorHandler, notFound } = require("./middleware/errors");
const { loggingMiddleware } = require("./middleware/logging");
const { env } = require("./utils/env");

const app = express();

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(loggingMiddleware);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/", (_req, res) => res.json({ 
  message: "MiniChatGPT API",
  version: "1.0.0",
  status: "running",
  endpoints: {
    health: "GET /health",
    register: "POST /register",
    login: "POST /login",
    chat: "POST /chat (public), GET /chat (auth required)",
    users: "GET /users (admin only)"
  }
}));

// Mounted at root to match required API shape:
// POST /register, POST /login, GET /users, GET/POST /chat, DELETE /chat/:id
app.use("/", authRoutes);
app.use("/", chatRoutes);
app.use("/", adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

