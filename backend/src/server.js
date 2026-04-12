const app = require("./app");
const { env } = require("./utils/env");

const PORT = process.env.PORT || env.PORT || 5000;

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  const url = process.env.NODE_ENV === "production" 
    ? `https://api.example.com (or your domain)` 
    : `http://localhost:${PORT}`;
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📝 Environment: ${env.NODE_ENV}`);
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

