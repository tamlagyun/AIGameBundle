import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createInitialGameState,
  fireWeapon,
  updateProjectiles
} from '../assets/scripts/core/GameState.js';
import { GameRuntime } from '../assets/scripts/runtime/GameRuntime.js';

const levelConfig = {
  id: 'projectile-test',
  objective: { type: 'defeatEnemiesAndReachExit', requiredDefeats: 1 },
  physics: { gravity: 0, maxFallSpeed: 900, playerBounds: { width: 32, height: 48 } },
  combat: {
    bulletBounds: { width: 18, height: 12 },
    enemyBounds: { width: 48, height: 48 },
    bulletLifetimeSeconds: 0.5
  },
  playerSpawn: { x: 40, y: 100 },
  platforms: [],
  enemies: [{ id: 'slime-a', enemyId: 'forest-slime', x: 160, y: 100 }],
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
  moveSpeed: 90,
  patrolDistance: 160,
  score: 100
};

function createState() {
  return createInitialGameState({ levelConfig, playerConfig, weaponConfig, enemyConfig });
}

test('initial state stores combat projectile collision config', () => {
  const state = createState();

  assert.deepEqual(state.combat, {
    bulletBounds: { width: 18, height: 12 },
    enemyBounds: { width: 48, height: 48 },
    pickupBounds: { width: 32, height: 32 },
    bulletLifetimeSeconds: 0.5
  });
});

test('projectiles move by velocity and age over time', () => {
  let state = fireWeapon(createState(), 0);

  state = updateProjectiles(state, 0.25);

  assert.equal(state.bullets.length, 1);
  assert.deepEqual(state.bullets[0].position, { x: 65, y: 100 });
  assert.equal(state.bullets[0].ageSeconds, 0.25);
});

test('aimed shots can travel upward and hit enemies above the player', () => {
  const runtime = new GameRuntime({
    levelConfig: {
      ...levelConfig,
      enemies: [{ id: 'slime-high', enemyId: 'forest-slime', x: 40, y: 60 }]
    },
    playerConfig,
    weaponConfig,
    enemyConfig
  });

  runtime.step({
    moveX: 0,
    aimX: 0,
    aimY: -1,
    jumpPressed: false,
    shootPressed: true,
    pausePressed: false
  }, 0.016);
  runtime.step({
    moveX: 0,
    aimX: 0,
    aimY: -1,
    jumpPressed: false,
    shootPressed: false,
    pausePressed: false
  }, 0.45);

  const state = runtime.getState();
  assert.equal(state.bullets.length, 0);
  assert.equal(state.enemies[0].health, 1);
});

test('diagonal aimed shots normalize velocity to weapon speed', () => {
  const state = fireWeapon(createState(), 0, { aimX: 1, aimY: -1 });

  assert.equal(state.bullets.length, 1);
  assert.ok(Math.abs(state.bullets[0].velocity.x - Math.SQRT1_2 * 100) < 0.0001);
  assert.ok(Math.abs(state.bullets[0].velocity.y + Math.SQRT1_2 * 100) < 0.0001);
});

test('expired projectiles are removed without damaging enemies', () => {
  let state = fireWeapon(createState(), 0);

  state = updateProjectiles(state, 0.6);

  assert.equal(state.bullets.length, 0);
  assert.equal(state.enemies[0].health, 2);
  assert.equal(state.defeatedEnemies, 0);
});

test('projectile hit damages enemy removes bullet and awards defeat score once', () => {
  let state = createState();
  state = {
    ...fireWeapon(state, 0),
    bullets: [
      {
        id: 'bullet-hit',
        position: { x: 135, y: 100 },
        velocity: { x: 100, y: 0 },
        damage: 2,
        owner: 'player',
        lifetimeSeconds: 0.5,
        ageSeconds: 0
      }
    ]
  };

  state = updateProjectiles(state, 0.1);

  assert.equal(state.bullets.length, 0);
  assert.equal(state.enemies[0].health, 0);
  assert.equal(state.enemies[0].defeated, true);
  assert.equal(state.defeatedEnemies, 1);
  assert.equal(state.score, 100);
});

test('runtime step advances projectiles and resolves projectile hits', () => {
  const runtime = new GameRuntime({
    levelConfig: {
      ...levelConfig,
      enemies: [{ id: 'slime-a', enemyId: 'forest-slime', x: 80, y: 100 }]
    },
    playerConfig,
    weaponConfig,
    enemyConfig
  });

  runtime.step({ moveX: 0, jumpPressed: false, shootPressed: true, pausePressed: false }, 0.016);
  runtime.step({ moveX: 0, jumpPressed: false, shootPressed: false, pausePressed: false }, 0.2);

  const state = runtime.getState();
  assert.equal(state.bullets.length, 0);
  assert.equal(state.enemies[0].health, 1);
});
