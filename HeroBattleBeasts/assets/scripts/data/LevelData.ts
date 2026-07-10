import type { Vector2 } from '../shared/types';

export type Rect = Vector2 & {
  width: number;
  height: number;
};

export type PhysicsConfig = {
  gravity: number;
  maxFallSpeed: number;
  playerBounds: { width: number; height: number };
};

export type CombatConfig = {
  bulletBounds: { width: number; height: number };
  enemyBounds: { width: number; height: number };
  pickupBounds: { width: number; height: number };
  bulletLifetimeSeconds: number;
};

export type PlatformConfig = Rect & {
  id: string;
  tileType?: string;
  tileSprite?: string;
};

export type LevelEncounterPoint = Vector2 & {
  id: string;
  enemyId?: string;
};

export type LevelEncounter = {
  id: string;
  enemyId: string;
  points: LevelEncounterPoint[];
};

export type LevelPickupPoint = Vector2 & {
  id: string;
  type?: 'coin' | 'weaponBoost';
  value?: number;
  weaponId?: string;
};

export type LevelPickupGroup = {
  id: string;
  type: 'coin' | 'weaponBoost';
  value?: number;
  weaponId?: string;
  points: LevelPickupPoint[];
};

export type ExpandedLevelConfig = {
  schemaVersion?: number;
  id: string;
  displayName?: string;
  size?: { width: number; height: number };
  spawnPoints?: {
    playerStart: Vector2;
    exit: Rect;
  };
  objective: {
    type: string;
    requiredDefeats: number;
  };
  physics?: PhysicsConfig;
  combat?: CombatConfig;
  platforms?: PlatformConfig[];
  encounters?: LevelEncounter[];
  pickupGroups?: LevelPickupGroup[];
  backgroundId?: string;
};

export type GameplayEnemySpawn = Vector2 & {
  id: string;
  enemyId: string;
  encounterId?: string;
};

export type GameplayPickupSpawn = Vector2 & {
  id: string;
  type: 'coin' | 'weaponBoost';
  value?: number;
  weaponId?: string;
  groupId?: string;
};

export type GameplayLevelConfig = ExpandedLevelConfig & {
  playerSpawn: Vector2;
  enemies: GameplayEnemySpawn[];
  pickups: GameplayPickupSpawn[];
  exit: Rect;
};

export function readJsonConfig(path: string): never {
  throw new Error(`readJsonConfig 不能在 Cocos 运行时使用，请由平台资源加载层读取配置：${path}`);
}

export function createRuntimeConfigs<T extends { levelConfig: ExpandedLevelConfig | GameplayLevelConfig }>(configs: T): Omit<T, 'levelConfig'> & {
  levelConfig: GameplayLevelConfig;
} {
  return {
    ...configs,
    levelConfig: createGameplayLevelConfig(configs.levelConfig)
  };
}

export function createGameplayLevelConfig(levelConfig: ExpandedLevelConfig | GameplayLevelConfig): GameplayLevelConfig {
  if ('playerSpawn' in levelConfig && 'enemies' in levelConfig && 'pickups' in levelConfig && 'exit' in levelConfig) {
    return levelConfig;
  }

  const spawnPoints = levelConfig.spawnPoints;
  if (!spawnPoints) {
    throw new Error(`关卡 ${levelConfig.id} 缺少 spawnPoints。`);
  }

  return {
    ...levelConfig,
    playerSpawn: { ...spawnPoints.playerStart },
    enemies: flattenEncounters(levelConfig.encounters ?? []),
    pickups: flattenPickupGroups(levelConfig.pickupGroups ?? []),
    exit: { ...spawnPoints.exit }
  };
}

function flattenEncounters(encounters: LevelEncounter[]): GameplayEnemySpawn[] {
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

function flattenPickupGroups(pickupGroups: LevelPickupGroup[]): GameplayPickupSpawn[] {
  return pickupGroups.flatMap((group) =>
    group.points.map((point) => {
      const type = point.type ?? group.type;
      const pickup: GameplayPickupSpawn = {
        id: point.id,
        type,
        x: point.x,
        y: point.y,
        groupId: group.id
      };

      if (type === 'coin') {
        pickup.value = point.value ?? group.value ?? 1;
      }

      if (type === 'weaponBoost') {
        pickup.weaponId = point.weaponId ?? group.weaponId;
      }

      return pickup;
    })
  );
}
