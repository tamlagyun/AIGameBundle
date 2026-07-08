import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createInitialGameState,
  updateEnemies
} from '../assets/scripts/core/GameState.js';
import { GameRuntime } from '../assets/scripts/runtime/GameRuntime.js';

const levelConfig = {
  id: 'enemy-test',
  objective: { type: 'defeatEnemiesAndReachExit', requiredDefeats: 1 },
  physics: { gravity: 0, maxFallSpeed: 900, playerBounds: { width: 32, height: 48 } },
  combat: {
    bulletBounds: { width: 18, height: 12 },
    enemyBounds: { width: 48, height: 48 },
    bulletLifetimeSeconds: 1.2
  },
  playerSpawn: { x: 40, y: 100 },
  platforms: [],
  enemies: [{ id: 'slime-a', enemyId: 'forest-slime', x: 120, y: 100 }],
  pickups: [],
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
    enemyConfig: { ...enemyConfig, ...overrides.enemyConfig }
  });
}

test('initial state stores enemy patrol origin speed distance and direction', () => {
  const state = createState();
  const enemy = state.enemies[0];

  assert.equal(enemy.patrolOriginX, 120);
  assert.equal(enemy.moveSpeed, 60);
  assert.equal(enemy.patrolDistance, 80);
  assert.equal(enemy.direction, -1);
});

test('enemy patrol moves horizontally and reverses at patrol boundary', () => {
  let state = createState();

  state = updateEnemies(state, 1);
  assert.equal(state.enemies[0].position.x, 60);
  assert.equal(state.enemies[0].direction, -1);

  state = updateEnemies(state, 1);
  assert.equal(state.enemies[0].position.x, 40);
  assert.equal(state.enemies[0].direction, 1);
});

test('defeated enemies do not patrol or damage player', () => {
  let state = createState();
  state = {
    ...state,
    enemies: [{ ...state.enemies[0], defeated: true }],
    player: { ...state.player, position: { x: 120, y: 100 } }
  };

  state = updateEnemies(state, 1);

  assert.equal(state.enemies[0].position.x, 120);
  assert.equal(state.player.health, 5);
});

test('enemy contact damages player and uses invulnerability timing', () => {
  let state = createState();
  state = {
    ...state,
    timeSeconds: 2,
    player: { ...state.player, position: { x: 120, y: 100 } }
  };

  state = updateEnemies(state, 0.016);
  assert.equal(state.player.health, 4);
  assert.equal(state.player.invulnerableUntil, 3);

  state = updateEnemies(state, 0.016);
  assert.equal(state.player.health, 4);
});

test('runtime step updates enemy patrol and contact damage', () => {
  const runtime = new GameRuntime({
    levelConfig,
    playerConfig,
    weaponConfig,
    enemyConfig
  });

  runtime.replacePlayerPositionForRuntime({ x: 120, y: 100 });
  runtime.step({ moveX: 0, jumpPressed: false, shootPressed: false, pausePressed: false }, 0.016);

  const state = runtime.getState();
  assert.equal(state.player.health, 4);
  assert.ok(state.enemies[0].position.x < 120);
});
