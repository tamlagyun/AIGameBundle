import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const fromRoot = (...parts) => join(root, ...parts);

test('all planned prefab placeholders and meta files exist', () => {
  const plan = JSON.parse(readFileSync(fromRoot('assets/prefabs/prefab-plan.json'), 'utf8'));
  const missing = [];

  for (const prefab of plan.requiredPrefabs) {
    if (!existsSync(fromRoot(prefab.futurePath))) {
      missing.push(prefab.futurePath);
    }
    if (!existsSync(fromRoot(`${prefab.futurePath}.meta`))) {
      missing.push(`${prefab.futurePath}.meta`);
    }
  }

  assert.deepEqual(missing, []);
});

test('prefab placeholders use native Cocos prefab asset format', () => {
  const plan = JSON.parse(readFileSync(fromRoot('assets/prefabs/prefab-plan.json'), 'utf8'));

  for (const prefabPlan of plan.requiredPrefabs) {
    const prefab = JSON.parse(readFileSync(fromRoot(prefabPlan.futurePath), 'utf8'));

    assert.equal(Array.isArray(prefab), true, `${prefabPlan.futurePath} must be a Cocos prefab array`);
    assert.equal(prefab[0].__type__, 'cc.Prefab');
    assert.equal(prefab[0]._name, prefabPlan.name);
    assert.deepEqual(prefab[0].data, { __id__: 1 });
    assert.equal(prefab[1].__type__, 'cc.Node');
    assert.equal(prefab[1]._name, prefabPlan.name);
    assert.ok(prefab.some((item) => item.__type__ === 'cc.UITransform'));
    assert.ok(prefab.some((item) => item.__type__ === 'cc.PrefabInfo'));
  }
});

test('prefab placeholders keep binding metadata beside native Cocos data', () => {
  const prefab = JSON.parse(readFileSync(fromRoot('assets/prefabs/PlayerRoot.prefab'), 'utf8'));
  const metadata = prefab[1].__editorExtras__.heroBattleBeasts;

  assert.deepEqual(metadata, {
    bindsTo: 'RuntimeViewModel.player',
    visualRole: 'rounded-hero',
    rule: '表现占位资源，不包含核心玩法规则。'
  });
});

test('hud prefab placeholder defines required label slots', () => {
  const prefab = JSON.parse(readFileSync(fromRoot('assets/prefabs/HudRoot.prefab'), 'utf8'));
  const root = prefab[1];

  assert.deepEqual(root._children.map((child) => prefab[child.__id__]._name), [
    'HudHealthLabel',
    'HudCoinLabel',
    'HudScoreLabel',
    'HudObjectiveLabel',
    'HudWeaponLabel'
  ]);
});

test('prefab meta files use unique uuids', () => {
  const prefabNames = [
    'PlayerRoot',
    'EnemyForestSlime',
    'PlayerBullet',
    'CoinPickup',
    'WeaponBoostPickup',
    'HudRoot'
  ];
  const uuids = prefabNames.map((name) => {
    const meta = JSON.parse(readFileSync(fromRoot(`assets/prefabs/${name}.prefab.meta`), 'utf8'));
    assert.equal(meta.importer, 'prefab');
    return meta.uuid;
  });

  assert.equal(new Set(uuids).size, prefabNames.length);
});
