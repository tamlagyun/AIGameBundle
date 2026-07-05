import type { GameApp } from './GameApp.ts';
import type { PileLayerKind } from './types.ts';

export interface PileViewModel {
  id: string;
  x: number;
  y: number;
  remainingLayerCount: number;
  topLayerKind: PileLayerKind | null;
  topLayerLabel: string;
}

export interface MushroomViewModel {
  id: string;
  x: number;
  y: number;
  visible: boolean;
  picked: boolean;
}

export interface LevelViewModel {
  hud: {
    targetText: string;
    completedVisible: boolean;
  };
  piles: PileViewModel[];
  mushrooms: MushroomViewModel[];
}

export function createLevelViewModel(app: GameApp): LevelViewModel {
  return {
    hud: app.ui.renderHud(app.getState()),
    piles: app.levels.piles.getPiles().map((pile) => {
      const remaining = app.levels.piles.getRemainingLayers(pile.id);
      const topLayer = remaining[0];

      return {
        id: pile.id,
        x: pile.x,
        y: pile.y,
        remainingLayerCount: remaining.length,
        topLayerKind: topLayer?.kind ?? null,
        topLayerLabel: topLayer?.label ?? 'Cleared'
      };
    }),
    mushrooms: app.levels.mushrooms.getMushrooms().map((mushroom) => ({
      id: mushroom.id,
      x: mushroom.x,
      y: mushroom.y,
      visible: mushroom.visible,
      picked: mushroom.picked
    }))
  };
}
