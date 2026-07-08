import test from 'node:test';
import assert from 'node:assert/strict';

import { GameRuntime } from '../assets/scripts/runtime/GameRuntime.js';

const configs = {
  levelConfig: {
    id: 'restart-test',
    objective: { type: 'defeatEnemiesAndReachExit', requiredDefeats: 1 },
    physics: { gravity: 0, maxFallSpeed: 900, playerBounds: { width: 32, height: 48 } },
    combat: {
      bulletBounds: { width: 18, height: 12 },
      enemyBounds: { width: 48, height: 48 },
      pickupBounds: { width: 32, height: 32 },
      bulletLifetimeSeconds: 1.2
    },
    playerSpawn: { x: 40, y: 100 },
    platforms: [{ id: 'ground', x: 0, y: 100, width: 400, height: 40 }],
    enemies: [{ id: 'slime-a', enemyId: 'forest-slime', x: 160, y: 100 }],
    pickups: [{ id: 'coin-a', type: 'coin', x: 40, y: 100, value: 1 }],
    exit: { x: 260, y: 60, width: 40, height: 80 }
  },
  playerConfig: {
    id: 'hero-ranger',
    maxHealth: 5,
    moveSpeed: 120,
    jumpVelocity: 480,
    invulnerableSecondsAfterHit: 1,
    startWeaponId: 'starter-blaster'
  },
  weaponConfig: {
    id: 'starter-blaster',
    damage: 1,
    bulletSpeed: 100,
    fireCooldownSeconds: 0.2,
    boostedFireCooldownSeconds: 0.1,
    boostDurationSeconds: 8
  },
  enemyConfig: {
    id: 'forest-slime',
    maxHealth: 1,
    contactDamage: 1,
    moveSpeed: 60,
    patrolDistance: 80,
    score: 100
  }
};

test('restart resets changed runtime state back to initial gameplay state', () => {
  const runtime = new GameRuntime(configs);

  runtime.step({ moveX: 0, jumpPressed: false, shootPressed: false, pausePressed: false }, 0.016);
  runtime.hitEnemy('slime-a', 1);
  runtime.replacePlayerPositionForRuntime({ x: 270, y: 80 });
  runtime.step({ moveX: 0, jumpPressed: false, shootPressed: true, pausePressed: false }, 0.016);

  assert.equal(runtime.getState().status, 'won');
  assert.equal(runtime.getState().coins, 1);
  assert.equal(runtime.getState().enemies[0].defeated, true);

  const view = runtime.restart();
  const state = runtime.getState();

  assert.equal(view.status, 'playing');
  assert.equal(state.status, 'playing');
  assert.equal(state.timeSeconds, 0);
  assert.equal(state.coins, 0);
  assert.equal(state.defeatedEnemies, 0);
  assert.deepEqual(state.player.position, { x: 40, y: 100 });
  assert.equal(state.player.health, 5);
  assert.equal(state.bullets.length, 0);
  assert.equal(state.enemies[0].defeated, false);
  assert.equal(state.pickups[0].collected, false);
  assert.equal(state.platforms[0].id, 'ground');
});

test('restart works after losing and allows gameplay to continue', () => {
  const runtime = new GameRuntime(configs);

  runtime.damagePlayer(5, 0);
  assert.equal(runtime.getState().status, 'lost');

  runtime.restart();
  runtime.step({ moveX: 1, jumpPressed: false, shootPressed: false, pausePressed: false }, 0.1);

  assert.equal(runtime.getState().status, 'playing');
  assert.ok(runtime.getState().player.position.x > 40);
});
