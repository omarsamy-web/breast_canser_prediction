export function errorHandler(error, _req, res, _next) {
  console.error(error);
  const status = error.status || error.statusCode || (error.name === "MulterError" ? 400 : 500);
  const message =
    error.message ||
    (error.name === "MulterError"
      ? "Invalid file upload"
      : "Internal server error");
  res.status(status).json({ message });
}
