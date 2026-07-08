import test from 'node:test';
import assert from 'node:assert/strict';

import { createRuntimeViewModel } from '../assets/scripts/runtime/RuntimeViewModel.js';

function createState(status = 'playing') {
  return {
    status,
    timeSeconds: 12.34,
    score: 300,
    coins: 4,
    defeatedEnemies: 3,
    objective: { type: 'defeatEnemiesAndReachExit', requiredDefeats: 3 },
    player: {
      id: 'hero-ranger',
      health: status === 'lost' ? 0 : 5,
      maxHealth: 5,
      moveSpeed: 120,
      jumpVelocity: 480,
      invulnerableSecondsAfterHit: 1,
      position: { x: 10, y: 20 },
      velocity: { x: 0, y: 0 },
      facing: 1,
      grounded: true,
      groundPlatformId: null,
      weaponId: 'starter-blaster',
      weaponBoostUntil: 0,
      invulnerableUntil: 0
    },
    weapon: {
      id: 'starter-blaster',
      damage: 1,
      bulletSpeed: 100,
      fireCooldownSeconds: 0.2,
      boostedFireCooldownSeconds: 0.1,
      boostDurationSeconds: 8,
      nextFireAt: 0
    },
    physics: { gravity: 0, maxFallSpeed: 900, playerBounds: { width: 32, height: 48 } },
    combat: {
      bulletBounds: { width: 18, height: 12 },
      enemyBounds: { width: 48, height: 48 },
      pickupBounds: { width: 32, height: 32 },
      bulletLifetimeSeconds: 1.2
    },
    platforms: [],
    enemies: [],
    bullets: [],
    pickups: [],
    exit: { x: 100, y: 20, width: 40, height: 80 }
  };
}

test('playing view model has no result summary', () => {
  const view = createRuntimeViewModel(createState('playing'));

  assert.equal(view.result, null);
});

test('won view model exposes restartable result summary', () => {
  const view = createRuntimeViewModel(createState('won'));

  assert.deepEqual(view.result, {
    status: 'won',
    title: '通关成功',
    score: 300,
    coins: 4,
    defeatedEnemies: 3,
    elapsedSeconds: 12.34,
    canRestart: true
  });
});

test('lost view model exposes failed result summary', () => {
  const view = createRuntimeViewModel(createState('lost'));

  assert.deepEqual(view.result, {
    status: 'lost',
    title: '挑战失败',
    score: 300,
    coins: 4,
    defeatedEnemies: 3,
    elapsedSeconds: 12.34,
    canRestart: true
  });
});
