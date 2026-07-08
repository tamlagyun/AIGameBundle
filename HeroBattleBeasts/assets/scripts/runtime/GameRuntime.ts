import type { GameState } from '../core/GameState';
import {
  collectPickup,
  createInitialGameState,
  damagePlayer,
  fireWeapon,
  hitEnemy,
  updateEnemies,
  updatePickups,
  updatePlayer,
  updateProjectiles
} from '../core/GameState';
import type { ExpandedLevelConfig, GameplayLevelConfig } from '../data/LevelData';
import { createRuntimeConfigs } from '../data/LevelData';
import type { InputCommand, Vector2 } from '../shared/types';
import type { RuntimeViewModel } from './RuntimeViewModel';
import { createRuntimeViewModel } from './RuntimeViewModel';

export type GameRuntimeConfigs = {
  levelConfig: ExpandedLevelConfig | GameplayLevelConfig;
  playerConfig: unknown;
  weaponConfig: unknown;
  enemyConfig: unknown;
};

export type GameRuntimeOptions = {
  platform?: unknown;
};

export class GameRuntime {
  private state: GameState;
  private readonly platform: unknown;
  private readonly configs: ReturnType<typeof createRuntimeConfigs<GameRuntimeConfigs>>;

  constructor(configs: GameRuntimeConfigs, options: GameRuntimeOptions = {}) {
    this.configs = createRuntimeConfigs(configs);
    this.state = createInitialGameState(this.configs);
    this.platform = options.platform ?? null;
  }

  getState(): GameState {
    return this.state;
  }

  getPlatformForDiagnostics(): unknown {
    return this.platform;
  }

  getViewModel(): RuntimeViewModel {
    return createRuntimeViewModel(this.state);
  }

  restart(): RuntimeViewModel {
    this.state = createInitialGameState(this.configs);
    return this.getViewModel();
  }

  step(inputCommand: InputCommand, deltaSeconds: number): RuntimeViewModel {
    if (this.state.status !== 'playing') {
      return this.getViewModel();
    }

    this.state = updatePlayer(this.state, inputCommand, deltaSeconds);
    if (inputCommand.shootPressed) {
      this.state = fireWeapon(this.state, this.state.timeSeconds, inputCommand);
    }
    if (!inputCommand.shootPressed) {
      this.state = updateProjectiles(this.state, deltaSeconds);
    }
    this.state = updateEnemies(this.state, deltaSeconds);
    this.state = updatePickups(this.state);
    return this.getViewModel();
  }

  hitEnemy(enemyId: string, damage: number): RuntimeViewModel {
    this.state = hitEnemy(this.state, enemyId, damage);
    return this.getViewModel();
  }

  collectPickup(pickupId: string, nowSeconds: number): RuntimeViewModel {
    this.state = collectPickup(this.state, pickupId, nowSeconds);
    return this.getViewModel();
  }

  damagePlayer(damage: number, nowSeconds: number): RuntimeViewModel {
    this.state = damagePlayer(this.state, damage, nowSeconds);
    return this.getViewModel();
  }

  replacePlayerPositionForRuntime(position: Vector2): void {
    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        position: { ...position }
      }
    };
  }
}
