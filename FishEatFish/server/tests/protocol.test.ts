import test from 'node:test';
import assert from 'node:assert/strict';
import { parseClientMessage, parseInput } from '../src/protocol/message-schemas.js';
test('protocol validates input bounds', () => { assert.equal(parseClientMessage({ protocolVersion: 1, type: 'input', payload: { clientTick: 1, moveX: 0, moveY: 0, rotation: 0 } }).type, 'input'); assert.throws(() => parseInput({ clientTick: 1, moveX: 2, moveY: 0, rotation: 0 })); });
