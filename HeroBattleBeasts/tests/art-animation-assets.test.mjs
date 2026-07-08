import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('..', import.meta.url));
const fromRoot = (...parts) => join(root, ...parts);

const expectedArtAssets = [
  'assets/resources/art/characters/hero-placeholder.svg',
  'assets/resources/art/enemies/forest-slime-placeholder.svg',
  'assets/resources/art/weapons/player-bullet-placeholder.svg',
  'assets/resources/art/pickups/coin-placeholder.svg',
  'assets/resources/art/pickups/weapon-boost-placeholder.svg',
  'assets/resources/art/ui/hud-heart.svg',
  'assets/resources/art/ui/hud-coin.svg',
  'assets/resources/art/ui/hud-weapon.svg'
];

test('art and animation placeholder directories keep Cocos meta files', () => {
  const expectedPaths = [
    'assets/animations.meta',
    'assets/animations/animation-states.json',
    'assets/animations/animation-states.json.meta',
    'assets/resources/art.meta',
    'assets/resources/art/characters.meta',
    'assets/resources/art/enemies.meta',
    'assets/resources/art/weapons.meta',
    'assets/resources/art/pickups.meta',
    'assets/resources/art/ui.meta',
    ...expectedArtAssets,
    ...expectedArtAssets.map((assetPath) => `${assetPath}.meta`)
  ];

  const missing = expectedPaths.filter((assetPath) => !existsSync(fromRoot(assetPath)));
  assert.deepEqual(missing, []);
});

test('animation state manifest defines gameplay-facing visual states only', () => {
  const manifest = JSON.parse(readFileSync(fromRoot('assets/animations/animation-states.json'), 'utf8'));

  assert.equal(manifest.kind, 'placeholder-animation-states');
  assert.equal(manifest.rule, '动画资源只描述表现状态，不承载核心玩法规则。');
  assert.deepEqual(Object.keys(manifest.entities), [
    'hero',
    'forestSlime',
    'playerBullet',
    'coinPickup',
    'weaponBoostPickup',
    'hud'
  ]);

  assert.deepEqual(
    manifest.entities.hero.states.map((state) => state.name),
    ['idle', 'run', 'jump', 'shoot', 'hurt']
  );
  assert.deepEqual(
    manifest.entities.forestSlime.states.map((state) => state.name),
    ['idle', 'patrol', 'hit', 'defeated']
  );
  assert.deepEqual(
    manifest.entities.playerBullet.states.map((state) => state.name),
    ['fly', 'impact']
  );
});

test('animation states use explicit frame rates loop flags and placeholder frames', () => {
  const manifest = JSON.parse(readFileSync(fromRoot('assets/animations/animation-states.json'), 'utf8'));
  const allStates = Object.values(manifest.entities).flatMap((entity) => entity.states);

  for (const state of allStates) {
    assert.equal(typeof state.frameRate, 'number');
    assert.equal(typeof state.loop, 'boolean');
    assert.ok(Array.isArray(state.placeholderFrames));
    assert.ok(state.placeholderFrames.length >= 1);
  }
});

test('placeholder svg assets are small inspectable cartoon color blocks', () => {
  for (const assetPath of expectedArtAssets) {
    const content = readFileSync(fromRoot(assetPath), 'utf8');
    assert.match(content, /<svg[^>]+viewBox=/);
    assert.match(content, /data-role="cartoon-placeholder"/);
    assert.match(content, /<title>.+<\/title>/);
  }
});

test('art asset meta files use asset importer and unique uuids', () => {
  const uuids = expectedArtAssets.map((assetPath) => {
    const meta = JSON.parse(readFileSync(fromRoot(`${assetPath}.meta`), 'utf8'));
    assert.ok(['asset', '*'].includes(meta.importer));
    return meta.uuid;
  });

  assert.equal(new Set(uuids).size, expectedArtAssets.length);
});
