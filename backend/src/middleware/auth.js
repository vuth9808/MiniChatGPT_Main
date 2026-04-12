const jwt = require("jsonwebtoken");
const { env } = require("../utils/env");

function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Missing token" });

    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload; // { id, role, username, email }
    return next();
  } catch (_err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function authOptional(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      req.user = null;
      return next();
    }

    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (_err) {
    req.user = null;
    return next();
  }
}

function adminOnly(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Missing token" });
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });
  return next();
}

module.exports = { authRequired, authOptional, adminOnly };

