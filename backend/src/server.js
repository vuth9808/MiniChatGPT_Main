const app = require("./app");
const { env } = require("./utils/env");

const PORT = process.env.PORT || env.PORT || 5000;

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📝 Environment: ${env.NODE_ENV}`);

  // Keep-alive ping: prevent Render free tier from sleeping after 15 minutes
  if (process.env.NODE_ENV === "production") {
    const SELF_URL = process.env.RENDER_EXTERNAL_URL;

    if (SELF_URL) {
      // Ping every 10 minutes
      setInterval(async () => {
        try {
          await fetch(`${SELF_URL}/health`);
          // eslint-disable-next-line no-console
          console.log("[KEEP_ALIVE] Pinged self successfully");
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("[KEEP_ALIVE] Ping failed:", err.message);
        }
      }, 10 * 60 * 1000);

      // eslint-disable-next-line no-console
      console.log(`🏓 Keep-alive enabled → pinging ${SELF_URL}/health every 10 minutes`);
    } else {
      // eslint-disable-next-line no-console
      console.warn("⚠️  RENDER_EXTERNAL_URL not set — keep-alive disabled");
    }
  }
});

// Handle errors
server.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error(`❌ Server error: ${err.message}`);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  // eslint-disable-next-line no-console
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log("Server closed");
    process.exit(0);
  });
});
