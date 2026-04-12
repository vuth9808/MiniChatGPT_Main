// Logging middleware to track all requests and errors
function loggingMiddleware(req, _res, next) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const token = req.headers.authorization ? "present" : "missing";
  const userId = req.user ? req.user.id : "anonymous";
  
  // Log incoming request
  console.log(`[${timestamp}] ${method} ${path} - User: ${userId}, Token: ${token}`);
  
  next();
}

module.exports = { loggingMiddleware };
