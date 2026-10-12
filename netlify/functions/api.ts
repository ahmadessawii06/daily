import serverless from 'serverless-http';
import { createApiApp } from '../../backend/app.js';

export function createNetlifyHandler(app = createApiApp(true)) {
  const handle = serverless(app);
  return (event: any, context: any) => handle({
    ...event,
    path: event.path.replace(/^\/\.netlify\/functions\/api/, ''),
  }, context);
}
export const handler = createNetlifyHandler();
