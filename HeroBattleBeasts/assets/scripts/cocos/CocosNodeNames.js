export const COCOS_NODE_NAMES = {
  backgroundLayer: 'BackgroundLayer',
  worldLayer: 'WorldLayer',
  effectsLayer: 'EffectsLayer',
  hudLayer: 'HudLayer',
  modalLayer: 'ModalLayer',
  playerRoot: 'PlayerRoot',
  enemyPoolRoot: 'EnemyPoolRoot',
  bulletPoolRoot: 'BulletPoolRoot',
  pickupPoolRoot: 'PickupPoolRoot',
  hudRoot: 'HudRoot',
  hudHealthLabel: 'HudHealthLabel',
  hudCoinLabel: 'HudCoinLabel',
  hudScoreLabel: 'HudScoreLabel',
  hudObjectiveLabel: 'HudObjectiveLabel',
  hudWeaponLabel: 'HudWeaponLabel'
};

export function getCocosLayerPlan() {
  return [
    { key: 'background', nodeName: COCOS_NODE_NAMES.backgroundLayer },
    { key: 'world', nodeName: COCOS_NODE_NAMES.worldLayer },
    { key: 'effects', nodeName: COCOS_NODE_NAMES.effectsLayer },
    { key: 'hud', nodeName: COCOS_NODE_NAMES.hudLayer },
    { key: 'modal', nodeName: COCOS_NODE_NAMES.modalLayer }
  ];
}
