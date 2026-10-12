import type { Server } from 'node:http';

export async function listenOnAvailablePort(server: Server, requestedPort: number, allowFallback: boolean): Promise<number> {
  if (!Number.isInteger(requestedPort) || requestedPort < 0 || requestedPort > 65535) {
    throw new Error('PORT must be an integer between 0 and 65535');
  }
  for (let attempt = 0; attempt < (allowFallback ? 20 : 1); attempt++) {
    const port = requestedPort + attempt;
    if (port > 65535) break;
    try {
      await new Promise<void>((resolve, reject) => {
        const onError = (error: Error) => { server.off('listening', onListening); reject(error); };
        const onListening = () => { server.off('error', onError); resolve(); };
        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(port, '0.0.0.0');
      });
      return (server.address() as { port: number }).port;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EADDRINUSE' || !allowFallback) throw error;
    }
  }
  throw new Error(`No available port near ${requestedPort}. Set PORT to another value.`);
}
