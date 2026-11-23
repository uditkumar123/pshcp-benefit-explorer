const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve } = require('node:path');

const host = '127.0.0.1';
const port = Number(process.argv[2] ?? 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Usage: npm start -- <port> (1–65535)');
  process.exit(1);
}

// Serve only browser-facing files, not the repository or directory listings.
const assets = new Map([
  ['/index.html', 'text/html; charset=utf-8'],
  ['/styles.css', 'text/css; charset=utf-8'],
  ['/app.js', 'text/javascript; charset=utf-8'],
  ['/data.js', 'text/javascript; charset=utf-8'],
  ['/guide.js', 'text/javascript; charset=utf-8'],
  ['/logic.js', 'text/javascript; charset=utf-8'],
  ['/assets/favicon.svg', 'image/svg+xml'],
]);

createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  const path = req.url.split('?', 1)[0];
  const asset = path === '/' ? '/index.html' : path;
  const type = assets.get(asset);
  if (!type) {
    res.writeHead(404).end();
    return;
  }

  try {
    const body = await readFile(resolve(__dirname, '..', asset.slice(1)));
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': body.length });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(500).end();
  }
}).listen(port, host, () => console.log(`Benefit Atlas: http://${host}:${port}/`));
