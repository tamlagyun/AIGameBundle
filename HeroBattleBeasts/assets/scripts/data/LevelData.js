export function readJsonConfig(path) {
  throw new Error(`readJsonConfig 不能在 Cocos 运行时使用，请由平台资源加载层读取配置：${path}`);
}

export function createRuntimeConfigs(configs) {
  return {
    ...configs,
    levelConfig: createGameplayLevelConfig(configs.levelConfig)
  };
}

export function createGameplayLevelConfig(levelConfig) {
  if (levelConfig.playerSpawn && levelConfig.enemies && levelConfig.pickups && levelConfig.exit) {
    return levelConfig;
  }

  const spawnPoints = levelConfig.spawnPoints ?? {};
  return {
    ...levelConfig,
    playerSpawn: { ...spawnPoints.playerStart },
    enemies: flattenEncounters(levelConfig.encounters ?? []),
    pickups: flattenPickupGroups(levelConfig.pickupGroups ?? []),
    exit: { ...spawnPoints.exit }
  };
}

function flattenEncounters(encounters) {
  return encounters.flatMap((encounter) =>
    encounter.points.map((point) => ({
      id: point.id,
      enemyId: point.enemyId ?? encounter.enemyId,
      x: point.x,
      y: point.y,
      encounterId: encounter.id
    }))
  );
}

function flattenPickupGroups(pickupGroups) {
  return pickupGroups.flatMap((group) =>
    group.points.map((point) => {
      const pickup = {
        id: point.id,
        type: point.type ?? group.type,
        x: point.x,
        y: point.y,
        groupId: group.id
      };

      if (pickup.type === 'coin') {
        pickup.value = point.value ?? group.value ?? 1;
      }

      if (pickup.type === 'weaponBoost') {
        pickup.weaponId = point.weaponId ?? group.weaponId;
      }

      return pickup;
    })
  );
}
