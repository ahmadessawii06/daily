import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import { createServer as createHttpServer } from 'node:http';
import { createApiApp } from './backend/app';
import { listenOnAvailablePort } from './backend/listen';

export const app = createApiApp(process.env.NODE_ENV === 'production');
const httpServer = createHttpServer(app);
let vite: import('vite').ViteDevServer | undefined;
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      ws: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const dist = path.resolve('dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}
const port = Number(process.env.PORT || 3000);
try {
  const actualPort = await listenOnAvailablePort(httpServer, port, process.env.NODE_ENV !== 'production');
  if (actualPort !== port) console.log(`Port ${port} is in use; using ${actualPort}.`);
  console.log(`Mizan running at http://localhost:${actualPort}`);
} catch (error) {
  console.error(`Unable to start Mizan: ${(error as Error).message}`);
  await vite?.close();
  process.exitCode = 1;
}
export default app;
