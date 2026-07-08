import {
  collectPickup,
  createInitialGameState,
  damagePlayer,
  fireWeapon,
  hitEnemy,
  updateEnemies,
  updatePickups,
  updateProjectiles,
  updatePlayer
} from '../core/GameState.js';
import { createRuntimeConfigs } from '../data/LevelData.js';
import { createRuntimeViewModel } from './RuntimeViewModel.js';

export class GameRuntime {
  constructor(configs, options = {}) {
    this._configs = createRuntimeConfigs(configs);
    this._state = createInitialGameState(this._configs);
    this._platform = options.platform ?? null;
  }

  getState() {
    return this._state;
  }

  getPlatformForDiagnostics() {
    return this._platform;
  }

  getViewModel() {
    return createRuntimeViewModel(this._state);
  }

  restart() {
    this._state = createInitialGameState(this._configs);
    return this.getViewModel();
  }

  step(inputCommand, deltaSeconds) {
    if (this._state.status !== 'playing') {
      return this.getViewModel();
    }

    this._state = updatePlayer(this._state, inputCommand, deltaSeconds);
    if (inputCommand.shootPressed) {
      this._state = fireWeapon(this._state, this._state.timeSeconds, inputCommand);
    }
    if (!inputCommand.shootPressed) {
      this._state = updateProjectiles(this._state, deltaSeconds);
    }
    this._state = updateEnemies(this._state, deltaSeconds);
    this._state = updatePickups(this._state);
    return this.getViewModel();
  }

  hitEnemy(enemyId, damage) {
    this._state = hitEnemy(this._state, enemyId, damage);
    return this.getViewModel();
  }

  collectPickup(pickupId, nowSeconds) {
    this._state = collectPickup(this._state, pickupId, nowSeconds);
    return this.getViewModel();
  }

  damagePlayer(damage, nowSeconds) {
    this._state = damagePlayer(this._state, damage, nowSeconds);
    return this.getViewModel();
  }

  replacePlayerPositionForRuntime(position) {
    this._state = {
      ...this._state,
      player: {
        ...this._state.player,
        position: { ...position }
      }
    };
  }
}
