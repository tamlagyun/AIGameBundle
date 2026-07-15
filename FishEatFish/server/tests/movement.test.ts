import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateMovement } from '../src/simulation/movement-system.js';
test('server clamps movement to map bounds', () => { const result = simulateMovement({ x: 1910, y: 0, rotation: 0 }, { moveX: 1, moveY: 0, rotation: 0 }, 260, 1, { minX: -1920, maxX: 1920, minY: -1080, maxY: 1080 }); assert.equal(result.x, 1920); });
