export type PileLayerKind = 'branch' | 'thatch';

export interface PileLayerConfig {
  id: string;
  kind: PileLayerKind;
  label: string;
}

export interface PileConfig {
  id: string;
  x: number;
  y: number;
  layers: PileLayerConfig[];
}

export interface MushroomConfig {
  id: string;
  pileId: string;
  x: number;
  y: number;
  kind: 'mushroom';
}

export interface LevelConfig {
  levelId: string;
  targetCount: number;
  piles: PileConfig[];
  items: MushroomConfig[];
}

export interface ActionResult {
  ok: boolean;
  reason?: string;
}

export interface GameState {
  levelId: string;
  targetCount: number;
  pickedCount: number;
  completed: boolean;
}
