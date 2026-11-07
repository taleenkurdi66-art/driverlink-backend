export default {
  async fetch(request, env) {
    try {
      if (request.method === "GET" && new URL(request.url).pathname === "/") {
        return Response.json({
          status: "ok",
          app: "DriverLink API",
          message: "Worker is running"
        });
      }

      if (request.method === "GET" && new URL(request.url).pathname === "/api/health") {
        const db = await env.HYPERDRIVE.connectionString;
        return Response.json({
          status: "ok",
          database: db ? "connected" : "not connected"
        });
      }

      return Response.json({ error: "Not found" }, { status: 404 });
    } catch (error) {
      return Response.json({
        error: "Server error",
        details: error.message
      }, { status: 500 });
    }
  }
};
