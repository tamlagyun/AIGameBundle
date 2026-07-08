import test from 'node:test';
import assert from 'node:assert/strict';

import { COCOS_NODE_NAMES, getCocosLayerPlan } from '../assets/scripts/cocos/CocosNodeNames.js';
import { createRuntimeNodeBindingPlan } from '../assets/scripts/cocos/RuntimeNodeBinder.js';
import { GameAppComponent } from '../assets/scripts/cocos/GameAppComponent.js';

test('Cocos node names define stable scene layers and gameplay nodes', () => {
  assert.deepEqual(getCocosLayerPlan(), [
    { key: 'background', nodeName: 'BackgroundLayer' },
    { key: 'world', nodeName: 'WorldLayer' },
    { key: 'effects', nodeName: 'EffectsLayer' },
    { key: 'hud', nodeName: 'HudLayer' },
    { key: 'modal', nodeName: 'ModalLayer' }
  ]);

  assert.equal(COCOS_NODE_NAMES.playerRoot, 'PlayerRoot');
  assert.equal(COCOS_NODE_NAMES.enemyPoolRoot, 'EnemyPoolRoot');
  assert.equal(COCOS_NODE_NAMES.bulletPoolRoot, 'BulletPoolRoot');
  assert.equal(COCOS_NODE_NAMES.pickupPoolRoot, 'PickupPoolRoot');
  assert.equal(COCOS_NODE_NAMES.hudRoot, 'HudRoot');
});

test('runtime node binder maps view model fields without gameplay rules', () => {
  const viewModel = {
    status: 'playing',
    hud: {
      healthText: '5/5',
      coinText: '2',
      scoreText: '100',
      objectiveText: '1/3',
      weaponText: '普通'
    },
    player: {
      id: 'hero-ranger',
      position: { x: 120, y: 420 },
      velocity: { x: 0, y: 0 },
      facing: 1,
      grounded: true,
      weaponId: 'starter-blaster'
    },
    enemies: [
      {
        id: 'slime-a',
        enemyId: 'forest-slime',
        position: { x: 360, y: 420 },
        health: 2,
        maxHealth: 2,
        defeated: false
      }
    ],
    bullets: [
      {
        id: 'bullet-1',
        position: { x: 180, y: 420 },
        velocity: { x: 720, y: 0 },
        owner: 'player'
      }
    ],
    pickups: [
      {
        id: 'coin-a',
        type: 'coin',
        position: { x: 220, y: 380 },
        collected: false
      }
    ],
    exit: { x: 700, y: 360, width: 80, height: 120 }
  };

  const plan = createRuntimeNodeBindingPlan(viewModel);

  assert.deepEqual(plan.player, {
    nodeName: 'PlayerRoot',
    position: { x: 120, y: 420 },
    facing: 1,
    animationState: 'idle'
  });
  assert.deepEqual(plan.hud.healthText, { nodeName: 'HudHealthLabel', text: '5/5' });
  assert.equal(plan.enemies[0].nodeName, 'Enemy_slime-a');
  assert.equal(plan.bullets[0].nodeName, 'Bullet_bullet-1');
  assert.equal(plan.pickups[0].nodeName, 'Pickup_coin-a');
});

test('GameAppComponent declares dependencies without importing platform APIs', () => {
  const component = new GameAppComponent();

  assert.equal(component.componentName, 'GameAppComponent');
  assert.deepEqual(component.requiredLayerNames, [
    'BackgroundLayer',
    'WorldLayer',
    'EffectsLayer',
    'HudLayer',
    'ModalLayer'
  ]);
  assert.equal(component.usesRuntimeViewModel, true);
  assert.equal(component.ownsGameplayRules, false);
});
