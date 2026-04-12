// Simple in-memory cache for chat responses
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

function getCacheKey(message) {
  return `chat:${message.trim().toLowerCase()}`;
}

function get(message) {
  const key = getCacheKey(message);
  const entry = cache.get(key);
  
  if (!entry) return null;
  
  // Check if cache entry has expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return entry.response;
}

function set(message, response) {
  const key = getCacheKey(message);
  cache.set(key, {
    response,
    expiresAt: Date.now() + CACHE_TTL
  });
}

function clear() {
  cache.clear();
}

module.exports = { get, set, clear };
