import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const fromRoot = (...parts) => join(root, ...parts);

test('preview files and npm command are present', () => {
  assert.equal(existsSync(fromRoot('preview/index.html')), true);
  assert.equal(existsSync(fromRoot('preview/preview.js')), true);
  assert.equal(existsSync(fromRoot('scripts/serve-preview.mjs')), true);

  const packageJson = JSON.parse(readFileSync(fromRoot('package.json'), 'utf8'));
  assert.equal(packageJson.scripts.preview, 'node scripts/serve-preview.mjs');
});

test('preview page uses canvas and module script', () => {
  const html = readFileSync(fromRoot('preview/index.html'), 'utf8');

  assert.match(html, /<canvas id="gameCanvas"/);
  assert.match(html, /type="module"/);
  assert.match(html, /preview\.js/);
});

test('preview module creates playable preview state from existing runtime', async () => {
  const { createPreviewRuntime, createPreviewInputState } = await import('../preview/preview.js');

  const runtime = createPreviewRuntime();
  const input = createPreviewInputState();

  assert.equal(runtime.getViewModel().status, 'playing');
  assert.deepEqual(input.activeCodes, new Set());
});
