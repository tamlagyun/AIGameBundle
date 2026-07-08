export function createInitialGameState({ levelConfig, playerConfig, weaponConfig, enemyConfig }) {
  const physics = createPhysicsConfig(levelConfig);
  const combat = createCombatConfig(levelConfig);
  const platforms = levelConfig.platforms ?? [];
  const groundedPlatform = findPlatformBelow(levelConfig.playerSpawn, physics.playerBounds, platforms);
  const startsGrounded = platforms.length === 0 || Boolean(groundedPlatform);

  return {
    status: 'playing',
    timeSeconds: 0,
    score: 0,
    coins: 0,
    defeatedEnemies: 0,
    physics,
    combat,
    platforms: platforms.map((platform) => ({ ...platform })),
    objective: {
      type: levelConfig.objective.type,
      requiredDefeats: levelConfig.objective.requiredDefeats
    },
    player: {
      id: playerConfig.id,
      health: playerConfig.maxHealth,
      maxHealth: playerConfig.maxHealth,
      moveSpeed: playerConfig.moveSpeed,
      jumpVelocity: playerConfig.jumpVelocity,
      invulnerableSecondsAfterHit: playerConfig.invulnerableSecondsAfterHit,
      position: { ...levelConfig.playerSpawn },
      velocity: { x: 0, y: 0 },
      facing: 1,
      grounded: startsGrounded,
      groundPlatformId: groundedPlatform?.id ?? null,
      weaponId: playerConfig.startWeaponId,
      weaponBoostUntil: 0,
      invulnerableUntil: 0
    },
    weapon: {
      id: weaponConfig.id,
      damage: weaponConfig.damage,
      bulletSpeed: weaponConfig.bulletSpeed,
      fireCooldownSeconds: weaponConfig.fireCooldownSeconds,
      boostedFireCooldownSeconds: weaponConfig.boostedFireCooldownSeconds,
      boostDurationSeconds: weaponConfig.boostDurationSeconds,
      nextFireAt: 0
    },
    enemies: levelConfig.enemies.map((spawn) => ({
      ...spawn,
      id: spawn.id,
      enemyId: spawn.enemyId,
      position: { x: spawn.x, y: spawn.y },
      health: enemyConfig.maxHealth,
      maxHealth: enemyConfig.maxHealth,
      contactDamage: enemyConfig.contactDamage,
      moveSpeed: enemyConfig.moveSpeed,
      patrolDistance: enemyConfig.patrolDistance,
      patrolOriginX: spawn.x,
      direction: spawn.direction ?? -1,
      score: enemyConfig.score,
      defeated: false
    })),
    bullets: [],
    pickups: levelConfig.pickups.map((pickup) => ({
      ...pickup,
      collected: false
    })),
    exit: { ...levelConfig.exit }
  };
}

export function updatePlayer(state, input, deltaSeconds) {
  if (state.status !== 'playing') {
    return state;
  }

  const facing = input.moveX === 0 ? state.player.facing : input.moveX;
  const nextPlayer = resolvePlayerPhysics(state, input, deltaSeconds, facing);
  const nextState = {
    ...state,
    timeSeconds: state.timeSeconds + deltaSeconds,
    player: nextPlayer
  };

  return evaluateObjective(nextState);
}

function createPhysicsConfig(levelConfig) {
  return {
    gravity: levelConfig.physics?.gravity ?? 1400,
    maxFallSpeed: levelConfig.physics?.maxFallSpeed ?? 900,
    playerBounds: {
      width: levelConfig.physics?.playerBounds?.width ?? 32,
      height: levelConfig.physics?.playerBounds?.height ?? 48
    }
  };
}

function createCombatConfig(levelConfig) {
  return {
    bulletBounds: {
      width: levelConfig.combat?.bulletBounds?.width ?? 18,
      height: levelConfig.combat?.bulletBounds?.height ?? 12
    },
    enemyBounds: {
      width: levelConfig.combat?.enemyBounds?.width ?? 48,
      height: levelConfig.combat?.enemyBounds?.height ?? 48
    },
    pickupBounds: {
      width: levelConfig.combat?.pickupBounds?.width ?? 32,
      height: levelConfig.combat?.pickupBounds?.height ?? 32
    },
    bulletLifetimeSeconds: levelConfig.combat?.bulletLifetimeSeconds ?? 1.2
  };
}

function resolvePlayerPhysics(state, input, deltaSeconds, facing) {
  const physics = state.physics ?? createPhysicsConfig({});
  const previousPosition = state.player.position;
  const horizontalVelocity = input.moveX * state.player.moveSpeed;
  const jumpStarted = input.jumpPressed && state.player.grounded;
  const startingVerticalVelocity = jumpStarted ? -state.player.jumpVelocity : state.player.velocity.y;
  const verticalVelocity = Math.min(
    physics.maxFallSpeed,
    startingVerticalVelocity + physics.gravity * deltaSeconds
  );
  const nextPosition = {
    x: previousPosition.x + horizontalVelocity * deltaSeconds,
    y: previousPosition.y + verticalVelocity * deltaSeconds
  };

  const landing = findLandingPlatform({
    previousPosition,
    nextPosition,
    bounds: physics.playerBounds,
    platforms: state.platforms ?? []
  });

  if (landing) {
    return {
      ...state.player,
      facing,
      position: {
        x: nextPosition.x,
        y: landing.y
      },
      velocity: {
        x: horizontalVelocity,
        y: 0
      },
      grounded: true,
      groundPlatformId: landing.id
    };
  }

  return {
    ...state.player,
    facing,
    position: nextPosition,
    velocity: {
      x: horizontalVelocity,
      y: verticalVelocity
    },
    grounded: false,
    groundPlatformId: null
  };
}

function findPlatformBelow(position, bounds, platforms) {
  return platforms.find((platform) => (
    Math.abs(position.y - platform.y) < 0.001 &&
    horizontalOverlaps(position.x, bounds.width, platform)
  ));
}

function findLandingPlatform({ previousPosition, nextPosition, bounds, platforms }) {
  return platforms.find((platform) => (
    previousPosition.y <= platform.y &&
    nextPosition.y >= platform.y &&
    horizontalOverlaps(nextPosition.x, bounds.width, platform)
  ));
}

function horizontalOverlaps(centerX, width, platform) {
  const halfWidth = width / 2;
  return centerX + halfWidth > platform.x && centerX - halfWidth < platform.x + platform.width;
}

export function fireWeapon(state, nowSeconds, input = {}) {
  if (state.status !== 'playing' || nowSeconds < state.weapon.nextFireAt) {
    return state;
  }

  const boosted = state.player.weaponBoostUntil > nowSeconds;
  const cooldown = boosted ? state.weapon.boostedFireCooldownSeconds : state.weapon.fireCooldownSeconds;
  const aim = normalizeAim(input, state.player.facing);
  const bullet = {
    id: `bullet-${state.bullets.length + 1}`,
    position: { ...state.player.position },
    velocity: {
      x: aim.x * state.weapon.bulletSpeed,
      y: aim.y * state.weapon.bulletSpeed
    },
    damage: state.weapon.damage,
    owner: 'player',
    lifetimeSeconds: state.combat?.bulletLifetimeSeconds ?? 1.2,
    ageSeconds: 0
  };

  return {
    ...state,
    weapon: {
      ...state.weapon,
      nextFireAt: nowSeconds + cooldown
    },
    bullets: [...state.bullets, bullet]
  };
}

function normalizeAim(input, facing) {
  const rawX = input.aimX ?? 0;
  const rawY = input.aimY ?? 0;
  const x = rawX === 0 && rawY === 0 ? facing : rawX;
  const y = rawX === 0 && rawY === 0 ? 0 : rawY;
  const length = Math.hypot(x, y) || 1;
  return {
    x: x / length,
    y: y / length
  };
}

export function updateProjectiles(state, deltaSeconds) {
  if (state.status !== 'playing') {
    return state;
  }

  let defeatedDelta = 0;
  let scoreDelta = 0;
  const combat = state.combat ?? createCombatConfig({});
  const enemies = state.enemies.map((enemy) => ({ ...enemy }));
  const bullets = [];

  for (const bullet of state.bullets) {
    const nextBullet = {
      ...bullet,
      position: {
        x: bullet.position.x + bullet.velocity.x * deltaSeconds,
        y: bullet.position.y + bullet.velocity.y * deltaSeconds
      },
      ageSeconds: (bullet.ageSeconds ?? 0) + deltaSeconds
    };

    if (nextBullet.ageSeconds >= nextBullet.lifetimeSeconds) {
      continue;
    }

    const enemy = enemies.find((candidate) => (
      bullet.owner === 'player' &&
      !candidate.defeated &&
      intersects(
        centeredRect(nextBullet.position, combat.bulletBounds),
        centeredRect(candidate.position, combat.enemyBounds)
      )
    ));

    if (!enemy) {
      bullets.push(nextBullet);
      continue;
    }

    const health = Math.max(0, enemy.health - nextBullet.damage);
    const defeated = health === 0;
    if (defeated && !enemy.defeated) {
      defeatedDelta += 1;
      scoreDelta += enemy.score;
    }

    enemy.health = health;
    enemy.defeated = defeated;
  }

  return evaluateObjective({
    ...state,
    bullets,
    enemies,
    defeatedEnemies: state.defeatedEnemies + defeatedDelta,
    score: state.score + scoreDelta
  });
}

export function updateEnemies(state, deltaSeconds) {
  if (state.status !== 'playing') {
    return state;
  }

  let nextState = state;
  const combat = state.combat ?? createCombatConfig({});
  const enemies = state.enemies.map((enemy) => {
    if (enemy.defeated) {
      return enemy;
    }

    const originX = enemy.patrolOriginX ?? enemy.position.x;
    const distance = enemy.patrolDistance ?? 0;
    const left = originX - distance;
    const right = originX + distance;
    const direction = enemy.direction ?? -1;
    let nextX = enemy.position.x + direction * enemy.moveSpeed * deltaSeconds;
    let nextDirection = direction;

    if (nextX < left) {
      nextX = left;
      nextDirection = 1;
    }
    if (nextX > right) {
      nextX = right;
      nextDirection = -1;
    }

    return {
      ...enemy,
      position: {
        ...enemy.position,
        x: nextX
      },
      direction: nextDirection
    };
  });

  nextState = {
    ...nextState,
    enemies
  };

  const touchingEnemy = enemies.find((enemy) => (
    !enemy.defeated &&
    intersects(
      centeredRect(nextState.player.position, nextState.physics?.playerBounds ?? { width: 32, height: 48 }),
      centeredRect(enemy.position, combat.enemyBounds)
    )
  ));

  if (!touchingEnemy) {
    return nextState;
  }

  return damagePlayer(nextState, touchingEnemy.contactDamage, nextState.timeSeconds);
}

export function hitEnemy(state, enemyId, damage) {
  if (state.status !== 'playing') {
    return state;
  }

  let defeatedDelta = 0;
  let scoreDelta = 0;
  const enemies = state.enemies.map((enemy) => {
    if (enemy.id !== enemyId || enemy.defeated) {
      return enemy;
    }

    const health = Math.max(0, enemy.health - damage);
    const defeated = health === 0;
    if (defeated && !enemy.defeated) {
      defeatedDelta += 1;
      scoreDelta += enemy.score;
    }

    return {
      ...enemy,
      health,
      defeated
    };
  });

  return evaluateObjective({
    ...state,
    enemies,
    defeatedEnemies: state.defeatedEnemies + defeatedDelta,
    score: state.score + scoreDelta
  });
}

export function collectPickup(state, pickupId, nowSeconds) {
  if (state.status !== 'playing') {
    return state;
  }

  let coinDelta = 0;
  let weaponBoostUntil = state.player.weaponBoostUntil;
  const pickups = state.pickups.map((pickup) => {
    if (pickup.id !== pickupId || pickup.collected) {
      return pickup;
    }

    if (pickup.type === 'coin') {
      coinDelta += pickup.value ?? 1;
    }

    if (pickup.type === 'weaponBoost') {
      weaponBoostUntil = nowSeconds + state.weapon.boostDurationSeconds;
    }

    return {
      ...pickup,
      collected: true
    };
  });

  return {
    ...state,
    coins: state.coins + coinDelta,
    pickups,
    player: {
      ...state.player,
      weaponBoostUntil
    }
  };
}

export function updatePickups(state) {
  if (state.status !== 'playing') {
    return state;
  }

  let nextState = state;
  const combat = state.combat ?? createCombatConfig({});
  for (const pickup of state.pickups) {
    if (pickup.collected) {
      continue;
    }

    const overlapsPlayer = intersects(
      centeredRect(nextState.player.position, nextState.physics?.playerBounds ?? { width: 32, height: 48 }),
      centeredRect({ x: pickup.x, y: pickup.y }, combat.pickupBounds)
    );

    if (overlapsPlayer) {
      nextState = collectPickup(nextState, pickup.id, nextState.timeSeconds);
    }
  }

  return nextState;
}

export function damagePlayer(state, damage, nowSeconds) {
  if (state.status !== 'playing' || nowSeconds < state.player.invulnerableUntil) {
    return state;
  }

  const health = Math.max(0, state.player.health - damage);
  return {
    ...state,
    status: health === 0 ? 'lost' : state.status,
    player: {
      ...state.player,
      health,
      invulnerableUntil: nowSeconds + state.player.invulnerableSecondsAfterHit
    }
  };
}

function evaluateObjective(state) {
  const reachedExit = intersects(
    {
      x: state.player.position.x,
      y: state.player.position.y,
      width: 32,
      height: 48
    },
    state.exit
  );
  const defeatedEnough = state.defeatedEnemies >= state.objective.requiredDefeats;

  return {
    ...state,
    status: defeatedEnough && reachedExit ? 'won' : state.status
  };
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function centeredRect(position, bounds) {
  return {
    x: position.x - bounds.width / 2,
    y: position.y - bounds.height,
    width: bounds.width,
    height: bounds.height
  };
}
