import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createInitialGameState,
  updatePickups
} from '../assets/scripts/core/GameState.js';
import { GameRuntime } from '../assets/scripts/runtime/GameRuntime.js';

const levelConfig = {
  id: 'pickup-test',
  objective: { type: 'defeatEnemiesAndReachExit', requiredDefeats: 0 },
  physics: { gravity: 0, maxFallSpeed: 900, playerBounds: { width: 32, height: 48 } },
  combat: {
    bulletBounds: { width: 18, height: 12 },
    enemyBounds: { width: 48, height: 48 },
    pickupBounds: { width: 32, height: 32 },
    bulletLifetimeSeconds: 1.2
  },
  playerSpawn: { x: 40, y: 100 },
  platforms: [],
  enemies: [],
  pickups: [
    { id: 'coin-a', type: 'coin', x: 46, y: 100, value: 2 },
    { id: 'boost-a', type: 'weaponBoost', x: 120, y: 100, weaponId: 'starter-blaster' }
  ],
  exit: { x: 260, y: 60, width: 40, height: 80 }
};

const playerConfig = {
  id: 'hero-ranger',
  maxHealth: 5,
  moveSpeed: 120,
  jumpVelocity: 480,
  invulnerableSecondsAfterHit: 1,
  startWeaponId: 'starter-blaster'
};

const weaponConfig = {
  id: 'starter-blaster',
  damage: 1,
  bulletSpeed: 100,
  fireCooldownSeconds: 0.2,
  boostedFireCooldownSeconds: 0.1,
  boostDurationSeconds: 8
};

const enemyConfig = {
  id: 'forest-slime',
  maxHealth: 2,
  contactDamage: 1,
  moveSpeed: 60,
  patrolDistance: 80,
  score: 100
};

function createState(overrides = {}) {
  return createInitialGameState({
    levelConfig: { ...levelConfig, ...overrides.levelConfig },
    playerConfig,
    weaponConfig,
    enemyConfig
  });
}

test('initial state stores pickup collision bounds', () => {
  const state = createState();

  assert.deepEqual(state.combat.pickupBounds, { width: 32, height: 32 });
});

test('updatePickups automatically collects overlapping coins once', () => {
  let state = createState();

  state = updatePickups(state);
  assert.equal(state.coins, 2);
  assert.equal(state.pickups.find((pickup) => pickup.id === 'coin-a').collected, true);

  state = updatePickups(state);
  assert.equal(state.coins, 2);
});

test('updatePickups automatically activates weapon boosts', () => {
  let state = createState();
  state = {
    ...state,
    timeSeconds: 3,
    player: { ...state.player, position: { x: 120, y: 100 } }
  };

  state = updatePickups(state);

  assert.equal(state.player.weaponBoostUntil, 11);
  assert.equal(state.pickups.find((pickup) => pickup.id === 'boost-a').collected, true);
});

test('runtime step collects pickups without explicit collect command', () => {
  const runtime = new GameRuntime({ levelConfig, playerConfig, weaponConfig, enemyConfig });

  runtime.step({ moveX: 0, jumpPressed: false, shootPressed: false, pausePressed: false }, 0.016);

  const state = runtime.getState();
  assert.equal(state.coins, 2);
  assert.equal(state.pickups[0].collected, true);
});

test('runtime step freezes gameplay updates after winning', () => {
  const runtime = new GameRuntime({ levelConfig, playerConfig, weaponConfig, enemyConfig });

  runtime.replacePlayerPositionForRuntime({ x: 270, y: 80 });
  runtime.step({ moveX: 0, jumpPressed: false, shootPressed: false, pausePressed: false }, 0.016);
  const wonState = runtime.getState();
  assert.equal(wonState.status, 'won');

  runtime.step({ moveX: 1, jumpPressed: true, shootPressed: true, pausePressed: false }, 1);
  const frozenState = runtime.getState();

  assert.equal(frozenState.status, 'won');
  assert.deepEqual(frozenState.player.position, wonState.player.position);
  assert.equal(frozenState.bullets.length, 0);
});

test('runtime step freezes gameplay updates after losing', () => {
  const runtime = new GameRuntime({ levelConfig, playerConfig, weaponConfig, enemyConfig });

  runtime.damagePlayer(5, 0);
  const lostState = runtime.getState();
  assert.equal(lostState.status, 'lost');

  runtime.step({ moveX: 1, jumpPressed: true, shootPressed: true, pausePressed: false }, 1);
  const frozenState = runtime.getState();

  assert.equal(frozenState.status, 'lost');
  assert.deepEqual(frozenState.player.position, lostState.player.position);
  assert.equal(frozenState.bullets.length, 0);
});
