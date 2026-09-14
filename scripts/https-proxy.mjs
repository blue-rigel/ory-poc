import fs from "node:fs";
import https from "node:https";
import httpProxy from "http-proxy";

const routes = new Map([
  ["orypoc.test", "http://127.0.0.1:4000"],
  ["straitstimes.test", "http://127.0.0.1:3001"],
  ["businesstimes.test", "http://127.0.0.1:3002"],
]);

const cert = process.env.HTTPS_CERT;
const key = process.env.HTTPS_KEY;

if (!cert || !key) {
  throw new Error("HTTPS_CERT and HTTPS_KEY are required");
}

const proxy = httpProxy.createProxyServer({
  changeOrigin: false,
  ws: true,
  xfwd: true,
});

proxy.on("error", (error, request, response) => {
  console.error(`Proxy error for ${request.headers.host}:`, error.message);
  if (response && "writeHead" in response && !response.headersSent) {
    response.writeHead(502, { "content-type": "text/plain" });
    response.end("The local application is still starting. Refresh in a moment.\n");
    return;
  }
  if (response && "destroy" in response && !response.destroyed) {
    response.destroy();
  }
});

function targetFor(request) {
  const hostname = request.headers.host?.split(":", 1)[0]?.toLowerCase();
  return hostname ? routes.get(hostname) : undefined;
}

const server = https.createServer(
  { cert: fs.readFileSync(cert), key: fs.readFileSync(key) },
  (request, response) => {
    const target = targetFor(request);
    if (!target) {
      response.writeHead(404, { "content-type": "text/plain" });
      response.end("Unknown local application hostname.\n");
      return;
    }
    proxy.web(request, response, { target });
  },
);

server.on("upgrade", (request, socket, head) => {
  const target = targetFor(request);
  if (!target) {
    socket.destroy();
    return;
  }
  proxy.ws(request, socket, head, { target });
});

const port = Number(process.env.HTTPS_PORT ?? 443);

server.listen(port, "127.0.0.1", () => {
  console.log(`HTTPS router listening on https://127.0.0.1:${port}`);
});
