// Leonida Ledger - local development server.
//
// Serves the app/ folder over HTTP so the guide can be tried in a browser
// exactly as a static host would serve it (the app's data fetch needs an
// http(s) origin; it does not run from file://). Node 22, standard library
// only, nothing to install:
//
//   node serve.ts              -> http://localhost:8080
//   node serve.ts --port 8090  -> http://localhost:8090
//
// Paths are confined to app/: anything that tries to climb out of it is
// refused. Responses are never cached, so edits show up on a plain reload.
import { createReadStream, statSync } from 'node:fs';
import { createServer, type ServerResponse } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));

const argv = process.argv.slice(2);
const portFlag = argv.indexOf('--port');
const wanted = portFlag === -1 ? 8080 : Number(argv[portFlag + 1]);
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

function sendText(response: ServerResponse, status: number, body: string) {
  response.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' }).end(body);
}

const server = createServer((request, response) => {
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    sendText(response, 400, 'bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';

  const target = resolve(join(appRoot, normalize(pathname)));
  if (target !== appRoot && !target.startsWith(appRoot + sep)) {
    sendText(response, 403, 'forbidden');
    return;
  }

  let size: number;
  try {
    const stats = statSync(target);
    if (!stats.isFile()) throw new Error('directory');
    size = stats.size;
  } catch {
    sendText(response, 404, 'not found');
    return;
  }

  response.writeHead(200, {
    'content-type': CONTENT_TYPES[extname(target).toLowerCase()] ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(target).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Leonida Ledger is being served at http://localhost:${port}`);
});
