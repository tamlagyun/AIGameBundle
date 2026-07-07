import test from 'node:test';
import assert from 'node:assert/strict';

import { GameApp } from '../assets/scripts/core/GameApp.ts';
import { getPlaceholderArtManifest } from '../assets/scripts/cocos/PlaceholderArtManifest.ts';
import { getInteractionFeedbackPlan } from '../assets/scripts/cocos/InteractionFeedbackPlan.ts';
import { createLevelViewModel } from '../assets/scripts/core/LevelViewModel.ts';
import { getRuntimeLayerPlan } from '../assets/scripts/cocos/RuntimeLayerPlan.ts';
import { PlatformServiceWeb } from '../assets/scripts/platform/PlatformServiceWeb.ts';
import level from '../assets/resources/levels/level-001.json' with { type: 'json' };

test('hidden mushrooms cannot be picked before their own covering layers are removed', () => {
  const app = new GameApp(new PlatformServiceWeb());

  app.startLevel(level);
  const result = app.pickMushroom('mushroom-center-red');

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'mushroom_hidden');
  assert.equal(app.getState().pickedCount, 0);
});

test('removing all pile layers reveals mushrooms and allows picking them', () => {
  const app = new GameApp(new PlatformServiceWeb());

  app.startLevel(level);
  assert.equal(app.removeTopLayer('pile-center').ok, true);
  assert.equal(app.removeTopLayer('pile-center').ok, true);

  const result = app.pickMushroom('mushroom-center-red');

  assert.equal(result.ok, true);
  assert.equal(app.getState().pickedCount, 1);
  assert.equal(app.getState().completed, false);
});

test('picking target count across multiple piles completes the level', () => {
  const app = new GameApp(new PlatformServiceWeb());

  app.startLevel(level);
  app.removeTopLayer('pile-left');
  app.pickMushroom('mushroom-left-small');
  app.removeTopLayer('pile-center');
  app.removeTopLayer('pile-center');
  app.pickMushroom('mushroom-center-red');
  app.pickMushroom('mushroom-center-brown');
  app.removeTopLayer('pile-right');
  app.removeTopLayer('pile-right');
  app.removeTopLayer('pile-right');
  app.pickMushroom('mushroom-right-gold');

  assert.equal(app.getState().pickedCount, 4);
  assert.equal(app.getState().completed, true);
});

test('clearing one pile does not reveal mushrooms under other piles', () => {
  const app = new GameApp(new PlatformServiceWeb());

  app.startLevel(level);
  app.removeTopLayer('pile-left');

  assert.equal(app.pickMushroom('mushroom-left-small').ok, true);
  assert.equal(app.pickMushroom('mushroom-center-red').ok, false);
  assert.equal(app.pickMushroom('mushroom-right-gold').ok, false);
  assert.equal(app.getState().pickedCount, 1);
});

test('starting the level again resets piles mushrooms and completion state', () => {
  const app = new GameApp(new PlatformServiceWeb());

  app.startLevel(level);
  app.removeTopLayer('pile-left');
  app.pickMushroom('mushroom-left-small');
  app.removeTopLayer('pile-center');
  app.removeTopLayer('pile-center');
  app.pickMushroom('mushroom-center-red');
  app.pickMushroom('mushroom-center-brown');
  app.removeTopLayer('pile-right');
  app.removeTopLayer('pile-right');
  app.removeTopLayer('pile-right');
  app.pickMushroom('mushroom-right-gold');

  assert.equal(app.getState().completed, true);

  app.startLevel(level);
  const view = createLevelViewModel(app);

  assert.equal(view.hud.targetText, '0/4');
  assert.equal(view.hud.completedVisible, false);
  assert.deepEqual(view.piles.map((pile) => pile.remainingLayerCount), [1, 2, 3]);
  assert.deepEqual(view.mushrooms.map((mushroom) => mushroom.visible), [false, false, false, false, false]);
  assert.deepEqual(view.mushrooms.map((mushroom) => mushroom.picked), [false, false, false, false, false]);
});

test('web platform service returns local simulated results', async () => {
  const platform = new PlatformServiceWeb();

  assert.deepEqual(await platform.login(), { ok: true, userId: 'web-local-user' });
  assert.equal((await platform.share()).ok, true);
  assert.equal((await platform.showRewardAd()).rewarded, true);

  await platform.saveData('progress', { levelId: 'level-001' });

  assert.deepEqual(await platform.loadData('progress'), { levelId: 'level-001' });
});

test('level view model reflects visible rough playable scene state', () => {
  const app = new GameApp(new PlatformServiceWeb());

  app.startLevel(level);
  let view = createLevelViewModel(app);

  assert.equal(view.hud.targetText, '0/4');
  assert.equal(view.hud.completedVisible, false);
  assert.deepEqual(
    view.piles.map((pile) => ({
      id: pile.id,
      remainingLayerCount: pile.remainingLayerCount,
      topLayerKind: pile.topLayerKind
    })),
    [
      { id: 'pile-left', remainingLayerCount: 1, topLayerKind: 'thatch' },
      { id: 'pile-center', remainingLayerCount: 2, topLayerKind: 'branch' },
      { id: 'pile-right', remainingLayerCount: 3, topLayerKind: 'branch' }
    ]
  );
  assert.deepEqual(view.mushrooms.map((mushroom) => mushroom.visible), [false, false, false, false, false]);

  app.removeTopLayer('pile-left');
  app.pickMushroom('mushroom-left-small');
  app.removeTopLayer('pile-center');
  app.removeTopLayer('pile-center');
  app.pickMushroom('mushroom-center-red');
  app.pickMushroom('mushroom-center-brown');
  app.removeTopLayer('pile-right');
  app.removeTopLayer('pile-right');
  app.removeTopLayer('pile-right');
  app.pickMushroom('mushroom-right-gold');
  view = createLevelViewModel(app);

  assert.equal(view.hud.targetText, '4/4');
  assert.equal(view.hud.completedVisible, true);
  assert.deepEqual(view.piles.map((pile) => pile.remainingLayerCount), [0, 0, 0]);
  assert.deepEqual(view.mushrooms.map((mushroom) => mushroom.picked), [true, true, true, true, false]);
});

test('runtime layer plan keeps scene nodes in stable render order', () => {
  assert.deepEqual(getRuntimeLayerPlan(), [
    { key: 'background', nodeName: 'BackgroundLayer' },
    { key: 'playfield', nodeName: 'PlayfieldLayer' },
    { key: 'hud', nodeName: 'HudLayer' },
    { key: 'modal', nodeName: 'ModalLayer' }
  ]);
});

test('placeholder art manifest records required rough game assets', () => {
  assert.deepEqual(getPlaceholderArtManifest(), {
    background: 'art/placeholder/forest-background',
    branchPile: 'art/placeholder/branch-pile',
    thatchPile: 'art/placeholder/thatch-pile',
    mushroom: 'art/placeholder/mushroom'
  });
});

test('interaction feedback plan uses short nonblocking timings', () => {
  assert.deepEqual(getInteractionFeedbackPlan(), {
    removeLayer: {
      durationSeconds: 0.16,
      endScale: 0.88,
      endOpacity: 0
    },
    pickMushroom: {
      durationSeconds: 0.14,
      endScale: 1.22,
      endOpacity: 0
    },
    floatingText: {
      text: '+1',
      durationSeconds: 0.28,
      yOffset: 42
    }
  });
});
