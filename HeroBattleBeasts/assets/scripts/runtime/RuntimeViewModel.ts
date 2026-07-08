import type { GameState, GameStatus, Rect } from '../core/GameState';
import type { Vector2 } from '../shared/types';

export type RuntimeViewModel = {
  status: GameStatus;
  result: null | {
    status: Exclude<GameStatus, 'playing'>;
    title: string;
    score: number;
    coins: number;
    defeatedEnemies: number;
    elapsedSeconds: number;
    canRestart: boolean;
  };
  hud: {
    healthText: string;
    coinText: string;
    scoreText: string;
    objectiveText: string;
    weaponText: string;
  };
  player: {
    id: string;
    position: Vector2;
    velocity: Vector2;
    facing: -1 | 1;
    grounded: boolean;
    weaponId: string;
  };
  enemies: Array<{
    id: string;
    enemyId: string;
    position: Vector2;
    health: number;
    maxHealth: number;
    defeated: boolean;
  }>;
  bullets: Array<{
    id: string;
    position: Vector2;
    velocity: Vector2;
    owner: 'player' | 'enemy';
  }>;
  pickups: Array<{
    id: string;
    type: string;
    position: Vector2;
    collected: boolean;
  }>;
  exit: Rect;
};

export function createRuntimeViewModel(state: GameState): RuntimeViewModel {
  return {
    status: state.status,
    result: createResultViewModel(state),
    hud: {
      healthText: `${state.player.health}/${state.player.maxHealth}`,
      coinText: String(state.coins),
      scoreText: String(state.score),
      objectiveText: `${state.defeatedEnemies}/${state.objective.requiredDefeats}`,
      weaponText: state.player.weaponBoostUntil > state.timeSeconds ? '强化' : '普通'
    },
    player: {
      id: state.player.id,
      position: { ...state.player.position },
      velocity: { ...state.player.velocity },
      facing: state.player.facing,
      grounded: state.player.grounded,
      weaponId: state.player.weaponId
    },
    enemies: state.enemies.map((enemy) => ({
      id: enemy.id,
      enemyId: enemy.enemyId,
      position: { ...enemy.position },
      health: enemy.health,
      maxHealth: enemy.maxHealth,
      defeated: enemy.defeated
    })),
    bullets: state.bullets.map((bullet) => ({
      id: bullet.id,
      position: { ...bullet.position },
      velocity: { ...bullet.velocity },
      owner: bullet.owner
    })),
    pickups: state.pickups.map((pickup) => ({
      id: pickup.id,
      type: pickup.type,
      position: { x: pickup.x, y: pickup.y },
      collected: pickup.collected
    })),
    exit: { ...state.exit }
  };
}

function createResultViewModel(state: GameState): RuntimeViewModel['result'] {
  if (state.status === 'playing') {
    return null;
  }

  return {
    status: state.status,
    title: state.status === 'won' ? '通关成功' : '挑战失败',
    score: state.score,
    coins: state.coins,
    defeatedEnemies: state.defeatedEnemies,
    elapsedSeconds: Number(state.timeSeconds.toFixed(2)),
    canRestart: true
  };
}
