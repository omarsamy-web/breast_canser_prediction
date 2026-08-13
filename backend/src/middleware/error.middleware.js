export function errorHandler(error, _req, res, _next) {
  console.error("API Error:", error);
  const status = error.status || error.statusCode || (error.name === "MulterError" ? 400 : 500);
  const message = error.message || "Internal server error";
  
  res.status(status).json({
    message,
    details: error.response?.data || error.errors || null,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack
  });
}
