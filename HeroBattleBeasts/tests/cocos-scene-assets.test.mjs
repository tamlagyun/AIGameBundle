import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const fromRoot = (...parts) => join(root, ...parts);

function findSceneNode(sceneAsset, name) {
  return sceneAsset.find((item) => item.__type__ === 'cc.Node' && item._name === name);
}

test('MainScene scene asset and meta files exist', () => {
  const requiredPaths = [
    'assets/scenes/MainScene.scene',
    'assets/scenes/MainScene.scene.meta',
    'assets/scenes.meta',
    'assets/prefabs.meta',
    'assets/resources.meta',
    'assets/scripts/cocos.meta'
  ];

  assert.deepEqual(
    requiredPaths.filter((path) => !existsSync(fromRoot(path))),
    []
  );
});

test('MainScene uses native Cocos scene asset format', () => {
  const scene = JSON.parse(readFileSync(fromRoot('assets/scenes/MainScene.scene'), 'utf8'));

  assert.equal(Array.isArray(scene), true);
  assert.equal(scene[0].__type__, 'cc.SceneAsset');
  assert.equal(scene[0]._name, 'MainScene');
  assert.equal(scene[1].__type__, 'cc.Scene');
  assert.equal(scene[1]._name, 'MainScene');
  assert.ok(findSceneNode(scene, 'Canvas'));
  assert.ok(scene.some((item) => item.__type__ === 'cc.Camera'));
  assert.ok(scene.some((item) => item.__type__ === 'cc.Canvas'));
});

test('MainScene component references point back to their owner nodes', () => {
  const scene = JSON.parse(readFileSync(fromRoot('assets/scenes/MainScene.scene'), 'utf8'));

  for (const [nodeIndex, item] of scene.entries()) {
    if (item.__type__ !== 'cc.Node') {
      continue;
    }

    for (const componentRef of item._components ?? []) {
      const component = scene[componentRef.__id__];
      assert.ok(component, `${item._name} references missing component ${componentRef.__id__}`);
      assert.deepEqual(
        component.node,
        { __id__: nodeIndex },
        `${item._name} component ${component.__type__} must point back to node index ${nodeIndex}`
      );
    }
  }

  const sceneRoot = scene[1];
  assert.equal(scene[sceneRoot._globals.__id__].__type__, 'cc.SceneGlobals');
});

test('MainScene Canvas uses the Camera component as its render camera', () => {
  const scene = JSON.parse(readFileSync(fromRoot('assets/scenes/MainScene.scene'), 'utf8'));
  const canvas = scene.find((item) => item.__type__ === 'cc.Canvas');
  const cameraComponent = scene[canvas?._cameraComponent?.__id__];

  assert.ok(canvas, 'MainScene requires a cc.Canvas component');
  assert.equal(cameraComponent?.__type__, 'cc.Camera');
});

test('MainScene SceneGlobals references native global resources', () => {
  const scene = JSON.parse(readFileSync(fromRoot('assets/scenes/MainScene.scene'), 'utf8'));
  const globals = scene[scene[1]._globals.__id__];

  assert.equal(scene[globals.ambient.__id__].__type__, 'cc.AmbientInfo');
  assert.equal(scene[globals.shadows.__id__].__type__, 'cc.ShadowsInfo');
  assert.equal(scene[globals._skybox.__id__].__type__, 'cc.SkyboxInfo');
  assert.equal(scene[globals.fog.__id__].__type__, 'cc.FogInfo');
  assert.equal(scene[globals.octree.__id__].__type__, 'cc.OctreeInfo');
  assert.equal(scene[globals.skin.__id__].__type__, 'cc.SkinInfo');
});

test('MainScene mounts GameAppComponent on GameApp node', () => {
  const scene = JSON.parse(readFileSync(fromRoot('assets/scenes/MainScene.scene'), 'utf8'));
  const gameAppIndex = scene.findIndex((item) => item.__type__ === 'cc.Node' && item._name === 'GameApp');
  const gameApp = scene[gameAppIndex];

  assert.ok(gameApp, 'GameApp node is required');
  assert.ok((gameApp._components ?? []).length > 0, 'GameApp must mount the Cocos entry component');
  assert.ok(
    (gameApp._components ?? []).some((componentRef) => scene[componentRef.__id__]?.__type__ === '1c507deW1NBJY7jHbuyPKqe'),
    'GameApp must reference GameAppComponent serialized type'
  );
});

test('Cocos editor preview opens MainScene by default', () => {
  const sceneSettingsPath = fromRoot('settings/v2/packages/scene.json');
  const sceneMeta = JSON.parse(readFileSync(fromRoot('assets/scenes/MainScene.scene.meta'), 'utf8'));

  assert.equal(
    existsSync(sceneSettingsPath),
    true,
    'settings/v2/packages/scene.json is required so Cocos preview can open MainScene'
  );

  const sceneSettings = JSON.parse(readFileSync(sceneSettingsPath, 'utf8'));

  assert.match(sceneSettings.__version__, /^1\./);
  assert.equal(sceneSettings['current-scene'], sceneMeta.uuid);
});

test('MainScene keeps required runtime node names', () => {
  const scene = JSON.parse(readFileSync(fromRoot('assets/scenes/MainScene.scene'), 'utf8'));
  const requiredNodes = [
    'BackgroundLayer',
    'WorldLayer',
    'EffectsLayer',
    'HudLayer',
    'ModalLayer',
    'GameApp',
    'PlayerRoot',
    'EnemyPoolRoot',
    'BulletPoolRoot',
    'PickupPoolRoot',
    'ExitArea',
    'HudRoot',
    'HudHealthLabel',
    'HudCoinLabel',
    'HudScoreLabel',
    'HudObjectiveLabel',
    'HudWeaponLabel'
  ];

  assert.deepEqual(
    requiredNodes.filter((name) => !findSceneNode(scene, name)),
    []
  );
});

test('prefab naming plan reserves gameplay and hud prefab slots', () => {
  const plan = JSON.parse(readFileSync(fromRoot('assets/prefabs/prefab-plan.json'), 'utf8'));

  assert.deepEqual(
    plan.requiredPrefabs.map((prefab) => prefab.name),
    [
      'PlayerRoot',
      'EnemyForestSlime',
      'PlayerBullet',
      'CoinPickup',
      'WeaponBoostPickup',
      'HudRoot'
    ]
  );
  assert.match(plan.rule, /预制体|prefab/i);
});

test('meta strategy document requires pairing assets with meta files', () => {
  const doc = readFileSync(fromRoot('docs/cocos-assets.md'), 'utf8');

  assert.match(doc, /Cocos 资源卫生规则/);
  assert.match(doc, /新增或移动 Cocos 资源时必须同时保留对应 `\.meta` 文件/);
  assert.match(doc, /MainScene\.scene/);
});
