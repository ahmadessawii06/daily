import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';

test('compiled Vercel entry loads in native Node ESM without a TypeScript loader', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const output = fs.mkdtempSync(path.join(root, '.vercel-esm-test-'));
  try {
    // Preserve separate modules: bundling would hide missing ESM extensions.
    await build({
      absWorkingDir: root,
      entryPoints: ['api/index.ts', 'backend/app.ts', 'backend/repository.ts',
        'backend/security.ts', 'backend/mongodb.ts', 'src/shared/merge.ts'],
      outbase: '.', outdir: output, bundle: false, platform: 'node', format: 'esm',
    });
    const entry = pathToFileURL(path.join(output, 'api/index.js'));
    const result = spawnSync(process.execPath, ['--input-type=module', '-e',
      `const { default: app } = await import(${JSON.stringify(entry.href)});
       if (typeof app !== 'function') throw new Error('Missing Express handler');`], {
      cwd: root, encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '' },
    });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
