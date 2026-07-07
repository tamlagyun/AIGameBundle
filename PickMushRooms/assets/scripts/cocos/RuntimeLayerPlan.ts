export type RuntimeLayerKey = 'background' | 'playfield' | 'hud' | 'modal';

export interface RuntimeLayerSpec {
  key: RuntimeLayerKey;
  nodeName: string;
}

const RUNTIME_LAYER_PLAN: RuntimeLayerSpec[] = [
  { key: 'background', nodeName: 'BackgroundLayer' },
  { key: 'playfield', nodeName: 'PlayfieldLayer' },
  { key: 'hud', nodeName: 'HudLayer' },
  { key: 'modal', nodeName: 'ModalLayer' }
];

export function getRuntimeLayerPlan(): RuntimeLayerSpec[] {
  return RUNTIME_LAYER_PLAN.map((layer) => ({ ...layer }));
}
