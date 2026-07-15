import test from 'node:test';
import assert from 'node:assert/strict';
import { disconnectPolicy } from '../src/room/disconnect-policy.js';
test('disconnect policy removes player immediately', () => assert.equal(disconnectPolicy, 'remove-immediately'));
