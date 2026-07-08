import test from 'node:test';
import assert from 'node:assert/strict';

import {
  collectPickup,
  createInitialGameState,
  damagePlayer,
  fireWeapon,
  hitEnemy,
  updatePlayer
} from '../assets/scripts/core/GameState.js';

const levelConfig = {
  id: 'level-001',
  objective: { type: 'defeatEnemiesAndReachExit', requiredDefeats: 2 },
  physics: { gravity: 0, maxFallSpeed: 900, playerBounds: { width: 32, height: 48 } },
  playerSpawn: { x: 10, y: 20 },
  enemies: [
    { id: 'slime-a', enemyId: 'forest-slime', x: 100, y: 20 },
    { id: 'slime-b', enemyId: 'forest-slime', x: 180, y: 20 }
  ],
  pickups: [
    { id: 'coin-a', type: 'coin', x: 50, y: 10, value: 1 },
    { id: 'boost-a', type: 'weaponBoost', x: 90, y: 10, weaponId: 'starter-blaster' }
  ],
  exit: { x: 220, y: 10, width: 40, height: 80 }
};

const playerConfig = {
  id: 'hero-ranger',
  maxHealth: 5,
  moveSpeed: 260,
  jumpVelocity: 620,
  invulnerableSecondsAfterHit: 1,
  startWeaponId: 'starter-blaster'
};

const weaponConfig = {
  id: 'starter-blaster',
  damage: 1,
  bulletSpeed: 720,
  fireCooldownSeconds: 0.22,
  boostedFireCooldownSeconds: 0.11,
  boostDurationSeconds: 8
};

const enemyConfig = {
  id: 'forest-slime',
  maxHealth: 2,
  contactDamage: 1,
  moveSpeed: 90,
  patrolDistance: 160,
  score: 100
};

test('creates initial gameplay state from configs', () => {
  const state = createInitialGameState({ levelConfig, playerConfig, weaponConfig, enemyConfig });

  assert.equal(state.player.health, 5);
  assert.deepEqual(state.player.position, { x: 10, y: 20 });
  assert.equal(state.enemies.length, 2);
  assert.equal(state.pickups.length, 2);
  assert.equal(state.objective.requiredDefeats, 2);
  assert.equal(state.status, 'playing');
});

test('updates player movement and jump intent without Cocos dependencies', () => {
  let state = createInitialGameState({ levelConfig, playerConfig, weaponConfig, enemyConfig });

  state = updatePlayer(state, { moveX: 1, jumpPressed: true, shootPressed: false, pausePressed: false }, 0.1);

  assert.equal(state.player.velocity.x, 260);
  assert.equal(state.player.velocity.y, -620);
  assert.equal(state.player.grounded, false);
  assert.ok(state.player.position.x > 10);
});

test('player movement and damage timing come from config values', () => {
  let state = createInitialGameState({
    levelConfig,
    playerConfig: {
      ...playerConfig,
      moveSpeed: 120,
      jumpVelocity: 340,
      invulnerableSecondsAfterHit: 2.5
    },
    weaponConfig,
    enemyConfig
  });

  state = updatePlayer(state, { moveX: -1, jumpPressed: true, shootPressed: false, pausePressed: false }, 0.5);
  assert.equal(state.player.velocity.x, -120);
  assert.equal(state.player.velocity.y, -340);

  state = damagePlayer(state, 1, 3);
  assert.equal(state.player.invulnerableUntil, 5.5);
});

test('fires bullets using weapon cooldown and facing direction', () => {
  let state = createInitialGameState({ levelConfig, playerConfig, weaponConfig, enemyConfig });

  state = fireWeapon(state, 0);
  assert.equal(state.bullets.length, 1);
  assert.equal(state.bullets[0].damage, 1);
  assert.equal(state.bullets[0].velocity.x, 720);

  state = fireWeapon(state, 0.1);
  assert.equal(state.bullets.length, 1);

  state = fireWeapon(state, 0.23);
  assert.equal(state.bullets.length, 2);
});

test('enemy damage increments defeat count and score', () => {
  let state = createInitialGameState({ levelConfig, playerConfig, weaponConfig, enemyConfig });

  state = hitEnemy(state, 'slime-a', 1);
  assert.equal(state.enemies.find((enemy) => enemy.id === 'slime-a').health, 1);
  assert.equal(state.defeatedEnemies, 0);

  state = hitEnemy(state, 'slime-a', 1);
  assert.equal(state.enemies.find((enemy) => enemy.id === 'slime-a').defeated, true);
  assert.equal(state.defeatedEnemies, 1);
  assert.equal(state.score, 100);
});

test('collects coins and weapon boosts once', () => {
  let state = createInitialGameState({ levelConfig, playerConfig, weaponConfig, enemyConfig });

  state = collectPickup(state, 'coin-a', 0);
  assert.equal(state.coins, 1);
  state = collectPickup(state, 'coin-a', 0);
  assert.equal(state.coins, 1);

  state = collectPickup(state, 'boost-a', 2);
  assert.equal(state.player.weaponBoostUntil, 10);
});

test('damage uses invulnerability window and losing all health fails the level', () => {
  let state = createInitialGameState({ levelConfig, playerConfig, weaponConfig, enemyConfig });

  state = damagePlayer(state, 1, 0);
  assert.equal(state.player.health, 4);
  state = damagePlayer(state, 1, 0.5);
  assert.equal(state.player.health, 4);

  state = damagePlayer(state, 4, 1.1);
  assert.equal(state.player.health, 0);
  assert.equal(state.status, 'lost');
});

test('reaching exit after required defeats wins the level', () => {
  let state = createInitialGameState({ levelConfig, playerConfig, weaponConfig, enemyConfig });

  state = hitEnemy(state, 'slime-a', 2);
  state = hitEnemy(state, 'slime-b', 2);
  state = updatePlayer(
    {
      ...state,
      player: {
        ...state.player,
        position: { x: 230, y: 30 }
      }
    },
    { moveX: 0, jumpPressed: false, shootPressed: false, pausePressed: false },
    0.016
  );

  assert.equal(state.status, 'won');
});
