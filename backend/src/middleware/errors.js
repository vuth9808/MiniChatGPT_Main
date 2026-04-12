function notFound(_req, res) {
  return res.status(404).json({ message: "Not found" });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  // eslint-disable-next-line no-console
  const endpoint = `${req.method} ${req.path}`;
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error on ${endpoint}:`, err?.cause || err);
  
  const status = Number(err?.status) || 500;
  const message = err?.message || "Server error";
  return res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };

