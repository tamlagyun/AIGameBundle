import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createInitialGameState,
  updatePlayer
} from '../assets/scripts/core/GameState.js';
import { GameRuntime } from '../assets/scripts/runtime/GameRuntime.js';

const levelConfig = {
  id: 'physics-test',
  objective: { type: 'defeatEnemiesAndReachExit', requiredDefeats: 0 },
  playerSpawn: { x: 40, y: 224 },
  physics: {
    gravity: 1200,
    maxFallSpeed: 900,
    playerBounds: { width: 32, height: 48 }
  },
  platforms: [
    { id: 'ground', x: 0, y: 224, width: 500, height: 48 },
    { id: 'upper-ledge', x: 160, y: 144, width: 120, height: 24 }
  ],
  enemies: [],
  pickups: [],
  exit: { x: 440, y: 176, width: 40, height: 80 }
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
  bulletSpeed: 600,
  fireCooldownSeconds: 0.2,
  boostedFireCooldownSeconds: 0.1,
  boostDurationSeconds: 8
};

const enemyConfig = {
  id: 'forest-slime',
  maxHealth: 1,
  contactDamage: 1,
  moveSpeed: 90,
  patrolDistance: 160,
  score: 100
};

function createState(overrides = {}) {
  return createInitialGameState({
    levelConfig: { ...levelConfig, ...overrides.levelConfig },
    playerConfig: { ...playerConfig, ...overrides.playerConfig },
    weaponConfig,
    enemyConfig
  });
}

test('initial state stores physics config platforms and player bounds', () => {
  const state = createState();

  assert.deepEqual(state.physics, {
    gravity: 1200,
    maxFallSpeed: 900,
    playerBounds: { width: 32, height: 48 }
  });
  assert.equal(state.platforms.length, 2);
  assert.equal(state.player.grounded, true);
  assert.equal(state.player.groundPlatformId, 'ground');
});

test('jumping applies upward velocity and clears grounded state', () => {
  let state = createState();

  state = updatePlayer(state, { moveX: 0, jumpPressed: true, shootPressed: false, pausePressed: false }, 0.1);

  assert.equal(state.player.grounded, false);
  assert.equal(state.player.groundPlatformId, null);
  assert.equal(state.player.velocity.y, -360);
  assert.ok(state.player.position.y < 224);
});

test('gravity accelerates falling until the max fall speed', () => {
  let state = createState();
  state = {
    ...state,
    player: {
      ...state.player,
      position: { x: 40, y: 40 },
      velocity: { x: 0, y: 880 },
      grounded: false,
      groundPlatformId: null
    }
  };

  state = updatePlayer(state, { moveX: 0, jumpPressed: false, shootPressed: false, pausePressed: false }, 0.2);

  assert.equal(state.player.velocity.y, 900);
  assert.ok(state.player.position.y > 40);
  assert.equal(state.player.grounded, false);
});

test('falling onto a platform snaps player feet to the platform top', () => {
  let state = createState();
  state = {
    ...state,
    player: {
      ...state.player,
      position: { x: 170, y: 120 },
      velocity: { x: 0, y: 400 },
      grounded: false,
      groundPlatformId: null
    }
  };

  state = updatePlayer(state, { moveX: 0, jumpPressed: false, shootPressed: false, pausePressed: false }, 0.1);

  assert.equal(state.player.position.y, 144);
  assert.equal(state.player.velocity.y, 0);
  assert.equal(state.player.grounded, true);
  assert.equal(state.player.groundPlatformId, 'upper-ledge');
});

test('runtime step uses platform physics for movement', () => {
  const runtime = new GameRuntime({ levelConfig, playerConfig, weaponConfig, enemyConfig });

  runtime.step({ moveX: 1, jumpPressed: true, shootPressed: false, pausePressed: false }, 0.1);
  const view = runtime.getViewModel();

  assert.ok(view.player.position.x > 40);
  assert.ok(view.player.position.y < 224);
  assert.equal(view.player.grounded, false);
});
