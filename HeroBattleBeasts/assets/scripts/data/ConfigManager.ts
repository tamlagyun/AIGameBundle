/**
 * ConfigManager — 游戏配置中心
 *
 * 职责：
 * 1. 接收原始 JSON 配置（由平台加载层传入，避免直接依赖 Cocos resources API）
 * 2. 缓存并索引所有配置
 * 3. 提供统一的配置查询接口
 * 4. 将关卡中的 enemyId / pickupType 映射到完整的实体模板
 *
 * 后续新增关卡/敌人/武器只需新增 JSON 文件并注册，不修改任何逻辑代码
 */

import type { Rect, Vector2 } from '../shared/types';

// ═══════════════════════════════════════════════
// 原始配置类型（与 JSON 文件结构一致）
// ═══════════════════════════════════════════════

export interface PlayerConfig {
  id: string;
  displayName: string;
  maxHealth: number;
  moveSpeed: number;
  jumpVelocity: number;
  invulnerableSecondsAfterHit: number;
  startWeaponId: string;
}

export interface EnemyTemplate {
  id: string;
  displayName: string;
  maxHealth: number;
  contactDamage: number;
  moveSpeed: number;
  patrolDistance: number;
  score: number;
}

export interface WeaponTemplate {
  id: string;
  displayName: string;
  damage: number;
  bulletSpeed: number;
  fireCooldownSeconds: number;
  boostedFireCooldownSeconds: number;
  boostDurationSeconds: number;
}

export interface PlatformConfig {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** 瓦片类型：决定使用的 tile 精灵和站立比例 */
  tileType?: string;
  /** 瓦片精灵路径（可选，默认根据 tileType 查找） */
  tileSprite?: string;
}

export interface EncounterPoint {
  id: string;
  enemyId?: string;
  x: number;
  y: number;
}

export interface EncounterGroup {
  id: string;
  enemyId: string;
  points: EncounterPoint[];
}

export interface PickupPoint {
  id: string;
  type?: string;
  value?: number;
  weaponId?: string;
  x: number;
  y: number;
}

export interface PickupGroup {
  id: string;
  type: string;
  value?: number;
  weaponId?: string;
  points: PickupPoint[];
}

export interface SpawnPoints {
  playerStart: Vector2;
  exit: Rect;
}

export interface Objective {
  type: string;
  requiredDefeats: number;
}

export interface PhysicsConfig {
  gravity: number;
  maxFallSpeed: number;
  playerBounds: { width: number; height: number };
}

export interface CombatConfig {
  bulletBounds: { width: number; height: number };
  enemyBounds: { width: number; height: number };
  pickupBounds: { width: number; height: number };
  bulletLifetimeSeconds: number;
}

export interface RawLevelConfig {
  schemaVersion?: number;
  id: string;
  displayName: string;
  size: { width: number; height: number };
  spawnPoints: SpawnPoints;
  objective: Objective;
  physics?: PhysicsConfig;
  combat?: CombatConfig;
  platforms: PlatformConfig[];
  encounters: EncounterGroup[];
  pickupGroups: PickupGroup[];
  /** 背景精灵 key（如 "forest-bg"，对应 art/map/background_forest） */
  backgroundId?: string;
}

// ═══════════════════════════════════════════════
// 实体精灵信息（用于动态渲染）
// ═══════════════════════════════════════════════

export interface EntitySpriteInfo {
  /** 实体标识：enemyId 或 pickupType */
  entityId: string;
  /** resources 下的精灵图路径 */
  spritePath: string;
  /** 渲染尺寸 [width, height] */
  size: [number, number];
}

// ═══════════════════════════════════════════════
// 配置容器类型
// ═══════════════════════════════════════════════

export interface ConfigRegistry {
  levels: RawLevelConfig[];
  enemies: EnemyTemplate[];
  weapons: WeaponTemplate[];
  player: PlayerConfig;
  /** 实体精灵映射表（可选，不传则用内置默认值） */
  entitySprites?: EntitySpriteInfo[];
  /** 瓦片精灵路径映射（可选） */
  tileSprites?: Record<string, { path: string; size: [number, number] }>;
}

// ═══════════════════════════════════════════════
// ConfigManager
// ═══════════════════════════════════════════════

export class ConfigManager {
  private _levelMap = new Map<string, RawLevelConfig>();
  private _enemyMap = new Map<string, EnemyTemplate>();
  private _weaponMap = new Map<string, WeaponTemplate>();
  private _playerConfig: PlayerConfig;
  private _spriteMap = new Map<string, EntitySpriteInfo>();
  private _tileSpriteMap = new Map<string, { path: string; size: [number, number] }>();

  constructor(registry: ConfigRegistry) {
    // 索引关卡
    for (const level of registry.levels) {
      this._levelMap.set(level.id, level);
    }
    // 索引敌人模板
    for (const enemy of registry.enemies) {
      this._enemyMap.set(enemy.id, enemy);
    }
    // 索引武器模板
    for (const weapon of registry.weapons) {
      this._weaponMap.set(weapon.id, weapon);
    }
    // 索引精灵
    if (registry.entitySprites) {
      for (const sprite of registry.entitySprites) {
        this._spriteMap.set(sprite.entityId, sprite);
      }
    }
    // 索引瓦片精灵
    if (registry.tileSprites) {
      for (const [key, info] of Object.entries(registry.tileSprites)) {
        this._tileSpriteMap.set(key, info);
      }
    }
    this._playerConfig = registry.player;
  }

  // ─── 查询接口 ───

  getLevelConfig(id: string): RawLevelConfig {
    const level = this._levelMap.get(id);
    if (!level) throw new Error(`关卡不存在: ${id}`);
    return level;
  }

  getEnemyTemplate(id: string): EnemyTemplate {
    const template = this._enemyMap.get(id);
    if (!template) throw new Error(`敌人模板不存在: ${id}`);
    return template;
  }

  getWeaponTemplate(id: string): WeaponTemplate {
    const template = this._weaponMap.get(id);
    if (!template) throw new Error(`武器模板不存在: ${id}`);
    return template;
  }

  getPlayerConfig(): PlayerConfig {
    return this._playerConfig;
  }

  /** 根据 entityId 获取精灵信息 */
  getEntitySprite(entityId: string): EntitySpriteInfo | null {
    return this._spriteMap.get(entityId) ?? null;
  }

  /** 根据 tileType 获取瓦片精灵信息 */
  getTileSprite(tileType: string): { path: string; size: [number, number] } | null {
    return this._tileSpriteMap.get(tileType) ?? null;
  }

  /** 列出所有需要预加载的精灵资源路径 */
  getAllSpritePaths(): string[] {
    const paths = new Set<string>();
    // 实体精灵
    for (const sprite of this._spriteMap.values()) {
      paths.add(sprite.spritePath);
    }
    // 瓦片精灵
    for (const tile of this._tileSpriteMap.values()) {
      paths.add(tile.path);
    }
    // 背景
    for (const level of this._levelMap.values()) {
      if (level.backgroundId) {
        const bgPath = this._spriteMap.get(level.backgroundId)?.spritePath
          ?? `art/map/${level.backgroundId}`;
        paths.add(bgPath);
      }
    }
    // 默认加载常用资源
    paths.add('art/ui/exit-sign');
    return [...paths];
  }
}
