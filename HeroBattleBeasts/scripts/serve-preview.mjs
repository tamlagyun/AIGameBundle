import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const port = Number(process.env.PORT ?? 5178);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8'
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
  const requestedPath = url.pathname === '/' ? '/preview/index.html' : url.pathname;
  const filePath = normalize(join(root, requestedPath));

  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('未找到预览资源');
    return;
  }

  response.writeHead(200, {
    'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream'
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, () => {
  console.log(`HeroBattleBeasts 预览服务已启动：http://localhost:${port}`);
});
