import test from 'node:test';
import assert from 'node:assert/strict';

import { GameApp } from '../assets/scripts/core/GameApp.ts';
import { PlatformServiceWeb } from '../assets/scripts/platform/PlatformServiceWeb.ts';
import level from '../assets/resources/levels/level-001.json' with { type: 'json' };

test('hidden mushrooms cannot be picked before covering layers are removed', () => {
  const app = new GameApp(new PlatformServiceWeb());

  app.startLevel(level);
  const result = app.pickMushroom('mushroom-1');

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'mushroom_hidden');
  assert.equal(app.getState().pickedCount, 0);
});

test('removing all pile layers reveals mushrooms and allows picking them', () => {
  const app = new GameApp(new PlatformServiceWeb());

  app.startLevel(level);
  assert.equal(app.removeTopLayer('pile-1').ok, true);
  assert.equal(app.removeTopLayer('pile-1').ok, true);

  const result = app.pickMushroom('mushroom-1');

  assert.equal(result.ok, true);
  assert.equal(app.getState().pickedCount, 1);
  assert.equal(app.getState().completed, false);
});

test('picking target count completes the level', () => {
  const app = new GameApp(new PlatformServiceWeb());

  app.startLevel(level);
  app.removeTopLayer('pile-1');
  app.removeTopLayer('pile-1');
  app.pickMushroom('mushroom-1');
  app.pickMushroom('mushroom-2');

  assert.equal(app.getState().pickedCount, 2);
  assert.equal(app.getState().completed, true);
});

test('web platform service returns local simulated results', async () => {
  const platform = new PlatformServiceWeb();

  assert.deepEqual(await platform.login(), { ok: true, userId: 'web-local-user' });
  assert.equal((await platform.share()).ok, true);
  assert.equal((await platform.showRewardAd()).rewarded, true);

  await platform.saveData('progress', { levelId: 'level-001' });

  assert.deepEqual(await platform.loadData('progress'), { levelId: 'level-001' });
});
