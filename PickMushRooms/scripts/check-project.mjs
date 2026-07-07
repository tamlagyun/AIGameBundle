import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function assertFile(relativePath) {
  const fullPath = path.join(root, relativePath);
  assert.equal(fs.existsSync(fullPath), true, `Missing file: ${relativePath}`);
  return fullPath;
}

function assertJsonFile(relativePath) {
  assertFile(relativePath);
  readJson(relativePath);
}

function assertAssetWithMeta(relativePath) {
  assertFile(relativePath);
  assertJsonFile(`${relativePath}.meta`);
}

function checkLevel() {
  const level = readJson('assets/resources/levels/level-001.json');
  assert.equal(level.levelId, 'level-001');
  assert.equal(level.targetCount, 4);
  assert.equal(level.piles.length, 3);
  assert.equal(level.items.length, 5);

  const pileIds = new Set(level.piles.map((pile) => pile.id));
  assert.deepEqual([...pileIds], ['pile-left', 'pile-center', 'pile-right']);

  for (const pile of level.piles) {
    assert.equal(typeof pile.x, 'number', `Pile ${pile.id} x must be numeric`);
    assert.equal(typeof pile.y, 'number', `Pile ${pile.id} y must be numeric`);
    assert.ok(pile.layers.length > 0, `Pile ${pile.id} must have layers`);
  }

  for (const item of level.items) {
    assert.equal(pileIds.has(item.pileId), true, `Item ${item.id} references missing pile ${item.pileId}`);
  }
}

function checkPlaceholderArt() {
  assertJsonFile('assets/resources/art.meta');
  assertJsonFile('assets/resources/art/placeholder.meta');

  for (const name of ['forest-background', 'branch-pile', 'thatch-pile', 'mushroom']) {
    assertAssetWithMeta(`assets/resources/art/placeholder/${name}.png`);
  }
}

function checkCocosScripts() {
  for (const name of [
    'GameAppComponent',
    'RuntimeLayerPlan',
    'PlaceholderArtManifest',
    'InteractionFeedbackPlan'
  ]) {
    assertAssetWithMeta(`assets/scripts/cocos/${name}.ts`);
  }
}

function checkSceneMount() {
  const scene = readJson('assets/scenes/GameScene.scene');
  assert.equal(scene[0].__type__, 'cc.SceneAsset');
  assert.equal(scene[1]._name, 'GameScene');

  const canvas = scene[2];
  const component = scene[8];
  assert.equal(canvas._components.some((componentRef) => componentRef.__id__ === 8), true);
  assert.equal(component.__type__, '8b06c7d7d9BT7YE/iuH46fs');
}

function checkWebPreviewHarness() {
  const html = fs.readFileSync(assertFile('web-preview/index.html'), 'utf8');
  const script = fs.readFileSync(assertFile('web-preview/preview.js'), 'utf8');
  const server = fs.readFileSync(assertFile('scripts/serve-web-preview.mjs'), 'utf8');

  assert.equal(html.includes('./preview.js'), true);
  assert.equal(script.includes('../assets/resources/levels/level-001.json'), true);
  assert.equal(script.includes('data-testid'), true);
  assert.equal(server.includes('web-preview/index.html'), true);
}

function checkLatestAssetDbLog() {
  const logDir = path.join(root, 'temp/asset-db/log');
  if (!fs.existsSync(logDir)) {
    console.warn('Skipping Cocos asset-db log check: temp/asset-db/log does not exist yet.');
    return;
  }

  const logs = fs.readdirSync(logDir)
    .filter((file) => file.endsWith('.log'))
    .map((file) => {
      const fullPath = path.join(logDir, file);
      return { fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  if (logs.length === 0) {
    console.warn('Skipping Cocos asset-db log check: no log files found.');
    return;
  }

  const recentLogText = logs
    .slice(0, 5)
    .map((log) => fs.readFileSync(log.fullPath, 'utf8'))
    .join('\n');
  for (const token of [
    'GameScene.scene',
    'GameAppComponent.ts',
    'RuntimeLayerPlan.ts',
    'PlaceholderArtManifest.ts',
    'InteractionFeedbackPlan.ts'
  ]) {
    if (!recentLogText.includes(token)) {
      console.warn(`Cocos asset-db logs do not mention ${token} yet. Open or refresh Cocos Creator to import it.`);
    }
  }
}

checkLevel();
checkPlaceholderArt();
checkCocosScripts();
checkSceneMount();
checkWebPreviewHarness();
checkLatestAssetDbLog();

console.log('project check ok');
