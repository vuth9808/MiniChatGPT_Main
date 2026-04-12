/**
 * Classify and handle different types of API errors
 */

export const ERROR_TYPES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  RATE_LIMIT: "RATE_LIMIT", // Temporary - 429
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED", // Permanent - 429 with quota flag
  AUTH_ERROR: "AUTH_ERROR", // 401
  NOT_FOUND: "NOT_FOUND", // 404
  SERVER_ERROR: "SERVER_ERROR", // 5xx
  UNKNOWN: "UNKNOWN"
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  RATE_LIMIT: "⏳ Server busy. Please wait a moment and try again.",
  QUOTA_EXCEEDED: "🚫 Daily quota exceeded. Try again tomorrow.",
  AUTH_ERROR: "Session expired. Please log in again.",
  NOT_FOUND: "Conversation not found.",
  SERVER_ERROR: "AI service temporarily unavailable.",
  UNKNOWN: "Something went wrong. Please try again."
};

/**
 * Classify error from API response
 * @param {Error} error - Axios error
 * @returns {{type: string, message: string, retryable: boolean}}
 */
export function classifyError(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;

  // Network errors
  if (!error?.response) {
    return {
      type: ERROR_TYPES.NETWORK_ERROR,
      message: ERROR_MESSAGES.NETWORK_ERROR,
      retryable: true
    };
  }

  // Rate limit (429)
  if (status === 429) {
    const isQuotaExceeded = data?.error === "QUOTA_EXCEEDED";
    if (isQuotaExceeded) {
      return {
        type: ERROR_TYPES.QUOTA_EXCEEDED,
        message: ERROR_MESSAGES.QUOTA_EXCEEDED,
        retryable: false
      };
    }
    return {
      type: ERROR_TYPES.RATE_LIMIT,
      message: ERROR_MESSAGES.RATE_LIMIT,
      retryable: true
    };
  }

  // Auth errors (401)
  if (status === 401) {
    return {
      type: ERROR_TYPES.AUTH_ERROR,
      message: ERROR_MESSAGES.AUTH_ERROR,
      retryable: false
    };
  }

  // Not found (404)
  if (status === 404) {
    return {
      type: ERROR_TYPES.NOT_FOUND,
      message: data?.message || ERROR_MESSAGES.NOT_FOUND,
      retryable: false
    };
  }

  // Server errors (5xx)
  if (status >= 500) {
    return {
      type: ERROR_TYPES.SERVER_ERROR,
      message: ERROR_MESSAGES.SERVER_ERROR,
      retryable: true
    };
  }

  // Unknown
  return {
    type: ERROR_TYPES.UNKNOWN,
    message: data?.message || ERROR_MESSAGES.UNKNOWN,
    retryable: false
  };
}

/**
 * Retry with exponential backoff
 * IMPORTANT: Check error type BEFORE calling this function!
 * Only pass errors that are classifiable as retryable.
 * 
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} initialDelayMs - Initial delay in ms
 * @returns {Promise<any>}
 * @throws {Error} If max retries exceeded or error is not retryable
 */
export async function retryWithBackoff(fn, maxRetries = 3, initialDelayMs = 1000) {
  let lastError;
  let lastClassified;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const classified = classifyError(error);
      lastError = error;
      lastClassified = classified;

      // CRITICAL: Don't retry if error is not retryable
      // This includes QUOTA_EXCEEDED, AUTH_ERROR, NOT_FOUND
      if (!classified.retryable) {
        console.error(
          `[RETRY] Non-retryable error: ${classified.type}. Stopping.`,
          classified.message
        );
        throw error;
      }

      // If max retries reached, give up
      if (attempt === maxRetries) {
        console.error(
          `[RETRY] Max retries (${maxRetries}) exceeded for ${classified.type}`
        );
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delayMs = initialDelayMs * Math.pow(2, attempt);
      console.warn(
        `[RETRY] Attempt ${attempt + 1}/${maxRetries + 1} failed with ${classified.type}. Retrying in ${delayMs}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
