// Simple rate limiter per IP/user
const limits = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 30; // 30 requests per minute

function getKey(req) {
  // Use user ID if logged in, otherwise use IP
  if (req.user) return `user:${req.user.id}`;
  return `ip:${req.ip}`;
}

function checkLimit(req) {
  const key = getKey(req);
  const now = Date.now();
  
  if (!limits.has(key)) {
    limits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  
  const entry = limits.get(key);
  
  // Reset if window has passed
  if (now > entry.resetAt) {
    limits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  
  // Check if limit exceeded
  if (entry.count >= MAX_REQUESTS) {
    return false;
  }
  
  entry.count++;
  return true;
}

module.exports = { checkLimit };
