import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4173);
const mimetypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json' };
http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURI(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end(); return; }
  const filename = path.resolve(root, '.' + pathname);
  // No path traversal and no hidden files.
  if ((!filename.startsWith(root + path.sep) && filename !== root) || pathname.split('/').some((p) => p.startsWith('.'))) {
    res.writeHead(403).end(); return;
  }
  const file = filename === root ? path.join(root, 'studio', 'preview.html') : filename;
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mimetypes[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
}).listen(port, '127.0.0.1', () => console.log(`PonyGotchi Studio : http://127.0.0.1:${port}`));
