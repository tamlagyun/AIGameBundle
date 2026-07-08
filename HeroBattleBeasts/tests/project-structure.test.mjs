import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGameplayLevelConfig } from '../assets/scripts/data/LevelData.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const fromRoot = (...parts) => join(root, ...parts);

test('Cocos compatible project skeleton exists', () => {
  const requiredPaths = [
    'package.json',
    'tsconfig.json',
    '.gitignore',
    'assets/scenes',
    'assets/scripts/core',
    'assets/scripts/runtime',
    'assets/scripts/platform',
    'assets/scripts/data',
    'assets/scripts/ui',
    'assets/scripts/audio',
    'assets/scripts/shared',
    'assets/resources/configs',
    'tests'
  ];

  assert.deepEqual(
    requiredPaths.filter((path) => !existsSync(fromRoot(path))),
    []
  );
});

test('package exposes verification scripts', () => {
  const packageJson = JSON.parse(readFileSync(fromRoot('package.json'), 'utf8'));

  assert.equal(packageJson.name, 'hero-battle-beasts');
  assert.equal(packageJson.type, 'module');
  assert.equal(packageJson.creator.version, '3.8.8');
  assert.equal(packageJson.scripts.test, 'node --test tests/*.test.mjs');
  assert.equal(packageJson.scripts.check, 'node scripts/check-project.mjs');
});

test('project hygiene keeps local Cocos editor state out of version control', () => {
  const gitignore = readFileSync(fromRoot('.gitignore'), 'utf8');

  assert.match(gitignore, /^\.creator\/$/m);
  assert.match(gitignore, /^library\/$/m);
  assert.match(gitignore, /^temp\/$/m);
});

test('Agent collaboration rules are readable Chinese project rules', () => {
  const rules = readFileSync(fromRoot('AGENTS.md'), 'utf8');

  assert.match(rules, /项目名称：HeroBattleBeasts/);
  assert.match(rules, /后续每个步骤列出计划后直接实施/);
  assert.match(rules, /默认必须使用中文/);
  assert.doesNotMatch(rules, /�|椤圭洰|鐩綍|榄傛枟/);
});

test('platform editor service provides safe fallback behavior', async () => {
  const { PlatformServiceEditor } = await import('../assets/scripts/platform/PlatformServiceEditor.js');
  const platform = new PlatformServiceEditor();

  assert.equal(platform.target, 'editor');
  assert.deepEqual(await platform.login(), { ok: true, userId: 'editor-local-user' });
  assert.equal((await platform.share({ title: 'HeroBattleBeasts' })).ok, true);
  assert.equal((await platform.showRewardAd('test-placement')).rewarded, false);
  assert.deepEqual(platform.getSafeArea(), { top: 0, right: 0, bottom: 0, left: 0 });
});

test('initial gameplay configs are present and readable', () => {
  const player = JSON.parse(readFileSync(fromRoot('assets/resources/configs/player.json'), 'utf8'));
  const weapon = JSON.parse(readFileSync(fromRoot('assets/resources/configs/weapon-basic.json'), 'utf8'));
  const enemy = JSON.parse(readFileSync(fromRoot('assets/resources/configs/enemy-slime.json'), 'utf8'));
  const level = JSON.parse(readFileSync(fromRoot('assets/resources/configs/level-001.json'), 'utf8'));

  assert.equal(player.id, 'hero-ranger');
  assert.equal(weapon.id, 'starter-blaster');
  assert.equal(enemy.id, 'forest-slime');
  assert.equal(level.id, 'level-001');
  assert.equal(level.schemaVersion, 2);
  assert.ok(level.platforms.length > 0);
  assert.ok(level.encounters.length > 0);
  assert.ok(level.pickupGroups.length > 0);

  const gameplayLevel = createGameplayLevelConfig(level);
  assert.ok(gameplayLevel.enemies.length > 0);
  assert.ok(gameplayLevel.pickups.length > 0);
});
