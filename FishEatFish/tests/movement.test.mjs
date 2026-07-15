import test from 'node:test';
import assert from 'node:assert/strict';
import { movementAngleDegrees, moveWithinBounds, normalizeMovement } from '../assets/scripts/core/MovementSystem.ts';

const bounds = { minX: -100, maxX: 100, minY: -50, maxY: 50 };

test('鱼的朝向支持四向和斜向旋转', () => {
  assert.equal(movementAngleDegrees({ x: 1, y: 0 }), 0);
  assert.equal(movementAngleDegrees({ x: 0, y: 1 }), 90);
  assert.equal(movementAngleDegrees({ x: -1, y: 0 }), 180);
  assert.equal(movementAngleDegrees({ x: 0, y: -1 }), -90);
  assert.equal(movementAngleDegrees({ x: 0, y: 0 }), null);
});

test('斜向输入归一化，不会获得额外速度', () => {
  const direction = normalizeMovement({ x: 1, y: 1 });
  assert.ok(Math.abs(Math.hypot(direction.x, direction.y) - 1) < 1e-9);
  const next = moveWithinBounds({ x: 0, y: 0 }, { x: 1, y: 1 }, 100, 1, bounds);
  assert.ok(Math.abs(next.x - 70.71067811865474) < 1e-9);
  assert.equal(next.y, 50);
});

test('玩家移动被限制在海域边界内', () => {
  assert.deepEqual(moveWithinBounds({ x: 90, y: 45 }, { x: 1, y: 1 }, 100, 1, bounds), { x: 100, y: 50 });
  assert.deepEqual(moveWithinBounds({ x: -90, y: -45 }, { x: -1, y: -1 }, 100, 1, bounds), { x: -100, y: -50 });
});
