import { AudioManager } from './AudioManager.ts';
import { InputSystem, type InputAction } from './InputSystem.ts';
import { LevelManager } from './LevelManager.ts';
import { UIManager } from './UIManager.ts';
import type { PlatformService } from '../platform/PlatformService.ts';
import type { ActionResult, GameState, LevelConfig } from './types.ts';

export class GameApp {
  readonly audio = new AudioManager();
  readonly input = new InputSystem();
  readonly levels = new LevelManager();
  readonly ui = new UIManager();

  private readonly platform: PlatformService;

  constructor(platform: PlatformService) {
    this.platform = platform;
  }

  async initialize(): Promise<void> {
    await this.platform.login();
  }

  startLevel(level: LevelConfig): void {
    this.levels.loadLevel(level);
  }

  removeTopLayer(pileId: string): ActionResult {
    const result = this.levels.removeTopLayer(pileId);
    if (result.ok) {
      this.audio.play('remove_layer');
    }
    return result;
  }

  pickMushroom(mushroomId: string): ActionResult {
    const result = this.levels.pickMushroom(mushroomId);
    if (result.ok) {
      this.audio.play('pick_mushroom');
      if (this.getState().completed) {
        this.audio.play('level_complete');
      }
    }
    return result;
  }

  dispatch(action: InputAction): ActionResult {
    if (action.type === 'remove_top_layer') {
      return this.removeTopLayer(action.pileId);
    }
    return this.pickMushroom(action.mushroomId);
  }

  getState(): GameState {
    return this.levels.getState();
  }
}
