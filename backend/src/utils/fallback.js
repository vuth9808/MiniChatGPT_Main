// Fallback responses when AI service is unavailable
const fallbackResponses = [
  "I'm currently experiencing high demand. Please try again in a moment.",
  "My API quota has been reached. I'll be back online shortly!",
  "The AI service is temporarily overloaded. Thank you for your patience.",
  "I'm taking a quick break to recharge. Please try again soon!",
  "My resources are being rebalanced. I'll be ready in just a moment."
];

function getFallbackResponse() {
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

module.exports = { getFallbackResponse };
