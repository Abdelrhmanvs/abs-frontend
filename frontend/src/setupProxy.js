const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  // Only proxy /api routes to backend (if using local development)
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:3500",
      changeOrigin: true,
    })
  );

  // Proxy auth requests to backend
  app.use(
    "/auth",
    createProxyMiddleware({
      target: "http://localhost:3500",
      changeOrigin: true,
    })
  );
};
