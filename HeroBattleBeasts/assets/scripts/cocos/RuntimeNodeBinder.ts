import { COCOS_NODE_NAMES } from './CocosNodeNames';
import type { RuntimeViewModel } from '../runtime/RuntimeViewModel';
import type { Vector2 } from '../shared/types';

export type RuntimeNodeBindingPlan = {
  status: RuntimeViewModel['status'];
  player: {
    nodeName: string;
    position: Vector2;
    facing: -1 | 1;
    animationState: 'idle' | 'run' | 'jump';
  };
  enemies: Array<{
    nodeName: string;
    id: string;
    enemyId: string;
    position: Vector2;
    visible: boolean;
    healthRatio: number;
  }>;
  bullets: Array<{
    nodeName: string;
    id: string;
    position: Vector2;
    owner: 'player' | 'enemy';
  }>;
  pickups: Array<{
    nodeName: string;
    id: string;
    type: string;
    position: Vector2;
    visible: boolean;
  }>;
  hud: Record<string, { nodeName: string; text: string }>;
  exit: {
    nodeName: string;
    rect: RuntimeViewModel['exit'];
  };
};

export function createRuntimeNodeBindingPlan(viewModel: RuntimeViewModel): RuntimeNodeBindingPlan {
  return {
    status: viewModel.status,
    player: {
      nodeName: COCOS_NODE_NAMES.playerRoot,
      position: { ...viewModel.player.position },
      facing: viewModel.player.facing,
      animationState: resolvePlayerAnimation(viewModel.player)
    },
    enemies: viewModel.enemies.map((enemy) => ({
      nodeName: `Enemy_${enemy.id}`,
      id: enemy.id,
      enemyId: enemy.enemyId,
      position: { ...enemy.position },
      visible: !enemy.defeated,
      healthRatio: enemy.maxHealth === 0 ? 0 : enemy.health / enemy.maxHealth
    })),
    bullets: viewModel.bullets.map((bullet) => ({
      nodeName: `Bullet_${bullet.id}`,
      id: bullet.id,
      position: { ...bullet.position },
      owner: bullet.owner
    })),
    pickups: viewModel.pickups.map((pickup) => ({
      nodeName: `Pickup_${pickup.id}`,
      id: pickup.id,
      type: pickup.type,
      position: { ...pickup.position },
      visible: !pickup.collected
    })),
    hud: {
      healthText: { nodeName: COCOS_NODE_NAMES.hudHealthLabel, text: viewModel.hud.healthText },
      coinText: { nodeName: COCOS_NODE_NAMES.hudCoinLabel, text: viewModel.hud.coinText },
      scoreText: { nodeName: COCOS_NODE_NAMES.hudScoreLabel, text: viewModel.hud.scoreText },
      objectiveText: { nodeName: COCOS_NODE_NAMES.hudObjectiveLabel, text: viewModel.hud.objectiveText },
      weaponText: { nodeName: COCOS_NODE_NAMES.hudWeaponLabel, text: viewModel.hud.weaponText }
    },
    exit: {
      nodeName: 'ExitArea',
      rect: { ...viewModel.exit }
    }
  };
}

function resolvePlayerAnimation(player: RuntimeViewModel['player']): 'idle' | 'run' | 'jump' {
  if (!player.grounded) {
    return 'jump';
  }
  if (player.velocity.x !== 0) {
    return 'run';
  }
  return 'idle';
}
