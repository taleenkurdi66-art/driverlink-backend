export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return Response.json({
        app: "DriverLink",
        status: "online",
        message: "DriverLink API is running"
      });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  }
};
