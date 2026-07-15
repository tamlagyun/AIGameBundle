import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { defaultServerConfig } from '../src/config/server-config.js';

test('HTTP app exposes health, auth and match routes', async () => {
  const { app } = createApp({ ...defaultServerConfig, httpPort: 0 });
  const health = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(health.statusCode, 200);
  const register = await app.inject({ method: 'POST', url: '/auth/register', payload: { username: 'tester', password: 'password' } });
  assert.equal(register.statusCode, 200);
  const token = register.json().token as string;
  const match = await app.inject({ method: 'POST', url: '/match/join', headers: { authorization: `Bearer ${token}` } });
  assert.equal(match.statusCode, 200);
  await app.close();
});
