function required(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return v;
}

const env = {
  PORT: Number(process.env.PORT || 5000),
  NODE_ENV: process.env.NODE_ENV || "development",

  DB_HOST: required("DB_HOST"),
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: required("DB_USER"),
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: required("DB_NAME"),

  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  GEMINI_API_KEY:
    process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || required("GEMINI_API_KEY"),
  GEMINI_MODEL: process.env.GEMINI_MODEL || process.env.OPENAI_MODEL || required("GEMINI_MODEL"),

  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173"
};

module.exports = { env };

