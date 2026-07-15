import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../src/auth/auth-service.js';
test('memory auth registers and verifies token', () => { const auth = new AuthService(); const result = auth.register('tester', 'password', '测试玩家'); assert.equal(auth.verify(result.token), result.accountId); assert.equal(auth.login('tester', 'password').displayName, '测试玩家'); });
