export function createRuntimeViewModel(state) {
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

function createResultViewModel(state) {
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
