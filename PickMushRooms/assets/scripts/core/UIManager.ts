import type { GameState } from './types.ts';

export interface HUDState {
  targetText: string;
  completedVisible: boolean;
}

export class UIManager {
  renderHud(state: GameState): HUDState {
    return {
      targetText: `${state.pickedCount}/${state.targetCount}`,
      completedVisible: state.completed
    };
  }
}
