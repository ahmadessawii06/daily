import { readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const generated = ['dist', 'server.js', '.test-data', ...readdirSync(root)
  .filter(name => name.startsWith('.vercel-esm-test-'))];

for (const name of generated) {
  const target = path.resolve(root, name);
  if (!target.startsWith(root)) throw new Error('Cleanup target must stay inside the project');
  rmSync(target, { recursive: true, force: true });
}
