import { MushroomSystem } from './MushroomSystem.ts';
import { PileSystem } from './PileSystem.ts';
import type { ActionResult, GameState, LevelConfig } from './types.ts';

export class LevelManager {
  readonly piles = new PileSystem();
  readonly mushrooms = new MushroomSystem();

  private currentLevel?: LevelConfig;
  private completed = false;

  loadLevel(level: LevelConfig): void {
    this.currentLevel = level;
    this.completed = false;
    this.piles.load(level.piles);
    this.mushrooms.load(level.items, this.piles);
  }

  removeTopLayer(pileId: string): ActionResult {
    const result = this.piles.removeTopLayer(pileId);
    if (result.ok) {
      this.mushrooms.refreshVisibility(this.piles);
    }
    return result;
  }

  pickMushroom(mushroomId: string): ActionResult {
    const result = this.mushrooms.pick(mushroomId);
    if (result.ok && this.currentLevel) {
      this.completed = this.mushrooms.getPickedCount() >= this.currentLevel.targetCount;
    }
    return result;
  }

  getState(): GameState {
    if (!this.currentLevel) {
      return {
        levelId: '',
        targetCount: 0,
        pickedCount: 0,
        completed: false
      };
    }

    return {
      levelId: this.currentLevel.levelId,
      targetCount: this.currentLevel.targetCount,
      pickedCount: this.mushrooms.getPickedCount(),
      completed: this.completed
    };
  }
}
