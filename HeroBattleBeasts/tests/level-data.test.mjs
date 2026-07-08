import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createGameplayLevelConfig,
  createRuntimeConfigs
} from '../assets/scripts/data/LevelData.js';
import { GameRuntime } from '../assets/scripts/runtime/GameRuntime.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const fromRoot = (...parts) => join(root, ...parts);

const expandedLevelConfig = {
  id: 'level-test',
  displayName: '测试森林入口',
  size: { width: 1200, height: 720 },
  spawnPoints: {
    playerStart: { x: 80, y: 420 },
    exit: { x: 1100, y: 560, width: 72, height: 96 }
  },
  objective: {
    type: 'defeatEnemiesAndReachExit',
    requiredDefeats: 2
  },
  platforms: [
    { id: 'ground', x: 0, y: 640, width: 1200, height: 80 }
  ],
  encounters: [
    {
      id: 'intro-slimes',
      enemyId: 'forest-slime',
      points: [
        { id: 'slime-a', x: 320, y: 580 },
        { id: 'slime-b', x: 680, y: 580 }
      ]
    }
  ],
  pickupGroups: [
    {
      id: 'coin-line-a',
      type: 'coin',
      value: 1,
      points: [
        { id: 'coin-a', x: 250, y: 530 },
        { id: 'coin-b', x: 300, y: 500 }
      ]
    },
    {
      id: 'boost-a',
      type: 'weaponBoost',
      weaponId: 'starter-blaster',
      points: [{ id: 'weapon-boost-a', x: 740, y: 520 }]
    }
  ]
};

test('expanded level data flattens spawn points encounters and pickup groups', () => {
  const levelConfig = createGameplayLevelConfig(expandedLevelConfig);

  assert.deepEqual(levelConfig.playerSpawn, { x: 80, y: 420 });
  assert.deepEqual(levelConfig.exit, { x: 1100, y: 560, width: 72, height: 96 });
  assert.deepEqual(levelConfig.enemies, [
    { id: 'slime-a', enemyId: 'forest-slime', x: 320, y: 580, encounterId: 'intro-slimes' },
    { id: 'slime-b', enemyId: 'forest-slime', x: 680, y: 580, encounterId: 'intro-slimes' }
  ]);
  assert.deepEqual(levelConfig.pickups, [
    { id: 'coin-a', type: 'coin', x: 250, y: 530, value: 1, groupId: 'coin-line-a' },
    { id: 'coin-b', type: 'coin', x: 300, y: 500, value: 1, groupId: 'coin-line-a' },
    {
      id: 'weapon-boost-a',
      type: 'weaponBoost',
      x: 740,
      y: 520,
      weaponId: 'starter-blaster',
      groupId: 'boost-a'
    }
  ]);
});

test('expanded level data remains compatible with existing flat level configs', () => {
  const legacyLevel = {
    id: 'legacy',
    objective: { type: 'defeatEnemiesAndReachExit', requiredDefeats: 1 },
    playerSpawn: { x: 10, y: 20 },
    enemies: [{ id: 'slime-a', enemyId: 'forest-slime', x: 100, y: 20 }],
    pickups: [{ id: 'coin-a', type: 'coin', x: 50, y: 10, value: 1 }],
    exit: { x: 220, y: 10, width: 40, height: 80 }
  };

  assert.deepEqual(createGameplayLevelConfig(legacyLevel), legacyLevel);
});

test('runtime configs can be built from expanded level and existing gameplay configs', () => {
  const runtimeConfigs = createRuntimeConfigs({
    levelConfig: expandedLevelConfig,
    playerConfig: { id: 'hero-ranger', maxHealth: 5, moveSpeed: 200, jumpVelocity: 500, invulnerableSecondsAfterHit: 1, startWeaponId: 'starter-blaster' },
    weaponConfig: { id: 'starter-blaster', damage: 1, bulletSpeed: 600, fireCooldownSeconds: 0.2, boostedFireCooldownSeconds: 0.1, boostDurationSeconds: 8 },
    enemyConfig: { id: 'forest-slime', maxHealth: 1, contactDamage: 1, moveSpeed: 90, patrolDistance: 160, score: 100 }
  });

  const runtime = new GameRuntime(runtimeConfigs);
  const state = runtime.getState();

  assert.deepEqual(state.player.position, { x: 80, y: 420 });
  assert.equal(state.enemies.length, 2);
  assert.equal(state.pickups.length, 3);
});

test('game runtime accepts expanded level config directly at startup', () => {
  const runtime = new GameRuntime({
    levelConfig: expandedLevelConfig,
    playerConfig: { id: 'hero-ranger', maxHealth: 5, moveSpeed: 200, jumpVelocity: 500, invulnerableSecondsAfterHit: 1, startWeaponId: 'starter-blaster' },
    weaponConfig: { id: 'starter-blaster', damage: 1, bulletSpeed: 600, fireCooldownSeconds: 0.2, boostedFireCooldownSeconds: 0.1, boostDurationSeconds: 8 },
    enemyConfig: { id: 'forest-slime', maxHealth: 1, contactDamage: 1, moveSpeed: 90, patrolDistance: 160, score: 100 }
  });

  assert.deepEqual(runtime.getState().player.position, { x: 80, y: 420 });
  assert.equal(runtime.getState().enemies[0].encounterId, 'intro-slimes');
});

test('level 001 config uses expanded placement groups instead of only flat lists', () => {
  const level = JSON.parse(readFileSync(fromRoot('assets/resources/configs/level-001.json'), 'utf8'));
  const flattened = createGameplayLevelConfig(level);

  assert.equal(level.schemaVersion, 2);
  assert.ok(Array.isArray(level.encounters));
  assert.ok(Array.isArray(level.pickupGroups));
  assert.ok(level.spawnPoints.playerStart);
  assert.ok(level.spawnPoints.exit);
  assert.equal(flattened.enemies.length, 3);
  assert.equal(flattened.pickups.length, 3);
  assert.equal(flattened.objective.requiredDefeats, 3);
});

test('json config reader parses project config files with stable utf8 behavior', () => {
  const player = JSON.parse(readFileSync(fromRoot('assets/resources/configs/player.json'), 'utf8'));

  assert.equal(player.id, 'hero-ranger');
});
