/**
 * Backend error handling utilities
 * Classifies errors and returns proper HTTP status codes with structured error responses
 */

const ERROR_TYPES = {
  RATE_LIMIT: "RATE_LIMIT",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  AUTH_ERROR: "AUTH_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  SERVER_ERROR: "SERVER_ERROR"
};

/**
 * Determine if an error from Gemini API is quota exceeded vs rate limited
 * @param {Error} geminiError - Error from generateAssistantReply
 * @returns {string} ERROR_TYPES value
 */
function classifyGeminiError(geminiError) {
  const msg = String(geminiError?.message || "");

  // Check for explicit quota markers
  if (geminiError?.isQuotaExceeded === true) {
    return ERROR_TYPES.QUOTA_EXCEEDED;
  }

  if (geminiError?.isRateLimit === true) {
    return ERROR_TYPES.RATE_LIMIT;
  }

  // Check message content for quota indicators
  const lowerMsg = msg.toLowerCase();
  if (
    lowerMsg.includes("quota") ||
    lowerMsg.includes("resource exhausted") ||
    lowerMsg.includes("resource has been exhausted") ||
    lowerMsg.includes("daily") ||
    lowerMsg.includes("exceeded")
  ) {
    return ERROR_TYPES.QUOTA_EXCEEDED;
  }

  // 429 status code
  if (geminiError?.status === 429) {
    // Default to QUOTA_EXCEEDED for 429, since that's usually more serious
    // Rate limits are typically different error codes or messages
    return ERROR_TYPES.QUOTA_EXCEEDED;
  }

  return ERROR_TYPES.SERVER_ERROR;
}

/**
 * Format error response for frontend
 * @param {Error} error - The error to format
 * @param {string} errorType - One of ERROR_TYPES
 * @returns {{error: string, message: string}}
 */
function formatErrorResponse(error, errorType = ERROR_TYPES.SERVER_ERROR) {
  const responses = {
    [ERROR_TYPES.RATE_LIMIT]: {
      error: ERROR_TYPES.RATE_LIMIT,
      message: "Too many requests. Please wait a moment before trying again."
    },
    [ERROR_TYPES.QUOTA_EXCEEDED]: {
      error: ERROR_TYPES.QUOTA_EXCEEDED,
      message: "Daily quota exceeded. Please try again tomorrow."
    },
    [ERROR_TYPES.AUTH_ERROR]: {
      error: ERROR_TYPES.AUTH_ERROR,
      message: "Authentication failed. Please log in again."
    },
    [ERROR_TYPES.VALIDATION_ERROR]: {
      error: ERROR_TYPES.VALIDATION_ERROR,
      message: error?.message || "Invalid request."
    },
    [ERROR_TYPES.NOT_FOUND]: {
      error: ERROR_TYPES.NOT_FOUND,
      message: error?.message || "Resource not found."
    },
    [ERROR_TYPES.SERVER_ERROR]: {
      error: ERROR_TYPES.SERVER_ERROR,
      message: "AI service temporarily unavailable. Please try again."
    }
  };

  return responses[errorType] || responses[ERROR_TYPES.SERVER_ERROR];
}

module.exports = {
  ERROR_TYPES,
  classifyGeminiError,
  formatErrorResponse
};
