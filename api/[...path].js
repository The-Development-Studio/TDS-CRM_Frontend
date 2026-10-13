const MAX_BODY_BYTES = 4_500_000;

export default async function proxy(request, response) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    response.status(503).json({ error: "Backend proxy is not configured" });
    return;
  }

  try {
    const chunks = [];
    let size = 0;
    if (request.body !== undefined) {
      const body = Buffer.isBuffer(request.body)
        ? request.body
        : Buffer.from(typeof request.body === "string" ? request.body : JSON.stringify(request.body));
      chunks.push(body);
      size = body.length;
    } else if (!["GET", "HEAD"].includes(request.method || "GET")) {
      for await (const chunk of request) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > MAX_BODY_BYTES) {
          response.status(413).json({ error: "Request body is too large" });
          return;
        }
        chunks.push(buffer);
      }
    }
    if (size > MAX_BODY_BYTES) {
      response.status(413).json({ error: "Request body is too large" });
      return;
    }

    const headers = new Headers();
    for (const [name, value] of Object.entries(request.headers)) {
      if (["host", "connection", "content-length", "accept-encoding"].includes(name.toLowerCase())) continue;
      if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
      else if (value) headers.set(name, value);
    }
    const target = new URL(request.url || "/", backendUrl);
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: chunks.length ? Buffer.concat(chunks) : undefined
    });

    response.status(upstream.status);
    upstream.headers.forEach((value, name) => {
      if (!["connection", "content-encoding", "content-length", "transfer-encoding", "set-cookie"].includes(name.toLowerCase())) {
        response.setHeader(name, value);
      }
    });
    const cookies = upstream.headers.getSetCookie();
    if (cookies.length) response.setHeader("set-cookie", cookies);
    response.send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    if (!response.headersSent) response.status(502).json({ error: "Backend service is unavailable" });
    else response.end();
  }
}
