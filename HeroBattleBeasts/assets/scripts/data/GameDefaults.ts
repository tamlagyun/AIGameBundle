/**
 * GameDefaults — 游戏默认配置数据
 *
 * 所有关卡/敌人/武器/精灵映射的默认配置集中于此。
 * 后续从 JSON 文件加载后，此文件可逐步精简为 fallback 默认值。
 *
 * ═══ 新增内容规则 ═══
 * - 新增敌人：在 ENEMY_TEMPLATES 数组追加 + 在 ENTITY_SPRITES 注册精灵
 * - 新增武器：在 WEAPON_TEMPLATES 数组追加
 * - 新增道具类型：在 ENTITY_SPRITES 注册新 entityId → spritePath
 * - 新增瓦片类型：在 TILE_SPRITES 注册 tileType → 精灵
 * - 新增关卡：在 LEVEL_CONFIGS 数组追加
 */

import type { ConfigRegistry } from './ConfigManager';

// ═══════════════════════════════════════════════
// 玩家
// ═══════════════════════════════════════════════

const PLAYER_CONFIG = {
  id: 'hero-ranger',
  displayName: '森林小勇士',
  maxHealth: 5,
  moveSpeed: 260,
  jumpVelocity: 640,
  invulnerableSecondsAfterHit: 1.0,
  startWeaponId: 'starter-blaster',
} as const;

// ═══════════════════════════════════════════════
// 武器模板
// ═══════════════════════════════════════════════

const WEAPON_TEMPLATES = [
  {
    id: 'starter-blaster',
    displayName: '星光玩具枪',
    damage: 1,
    bulletSpeed: 720,
    fireCooldownSeconds: 0.22,
    boostedFireCooldownSeconds: 0.11,
    boostDurationSeconds: 8,
  },
] as const;

// ═══════════════════════════════════════════════
// 敌人模板（每个模板定义一个 enemyId 的通用属性）
// ═══════════════════════════════════════════════

const ENEMY_TEMPLATES = [
  {
    id: 'forest-slime',
    displayName: '圆滚史莱姆',
    maxHealth: 2,
    contactDamage: 1,
    moveSpeed: 90,
    patrolDistance: 160,
    score: 100,
  },
] as const;

// ═══════════════════════════════════════════════
// 关卡配置
// ═══════════════════════════════════════════════

const LEVEL_CONFIGS = [
  {
    schemaVersion: 2,
    id: 'level-001',
    displayName: '怪兽森林入口',
    size: { width: 2400, height: 720 },
    backgroundId: 'forest-bg',
    spawnPoints: {
      playerStart: { x: 120, y: 640 },
      exit: { x: 2260, y: 560, width: 80, height: 80 },
    },
    objective: { type: 'defeatEnemiesAndReachExit', requiredDefeats: 3 },
    physics: { gravity: 1400, maxFallSpeed: 900, playerBounds: { width: 32, height: 48 } },
    combat: {
      bulletBounds: { width: 18, height: 12 },
      enemyBounds: { width: 48, height: 48 },
      pickupBounds: { width: 32, height: 32 },
      bulletLifetimeSeconds: 1.2,
    },
    platforms: [
      { id: 'ground', x: 0, y: 640, width: 2400, height: 80, tileType: 'ground' },
      { id: 'bridge-left', x: 420, y: 500, width: 360, height: 36, tileType: 'platform' },
      { id: 'tree-root-mid', x: 980, y: 420, width: 320, height: 36, tileType: 'platform' },
      { id: 'bridge-right', x: 1500, y: 520, width: 420, height: 36, tileType: 'platform' },
    ],
    encounters: [{
      id: 'forest-slime-line',
      enemyId: 'forest-slime',
      points: [
        { id: 'slime-a', x: 620, y: 460 },
        { id: 'slime-b', x: 1160, y: 380 },
        { id: 'slime-c', x: 1740, y: 480 },
      ],
    }],
    pickupGroups: [
      {
        id: 'coin-line-a', type: 'coin', value: 1,
        points: [
          { id: 'coin-a', x: 500, y: 450 },
          { id: 'coin-b', x: 1080, y: 370 },
        ],
      },
      {
        id: 'weapon-boost-a', type: 'weaponBoost', weaponId: 'starter-blaster',
        points: [{ id: 'weapon-boost-a', x: 1580, y: 470 }],
      },
    ],
  },
] as const;

// ═══════════════════════════════════════════════
// 实体 → 精灵映射（entityId → resources 路径 + 渲染尺寸）
// 新增敌人/道具时在此注册即可被渲染器正确显示
// ═══════════════════════════════════════════════

const ENTITY_SPRITES = [
  { entityId: 'player_hero',   spritePath: 'art/characters/player_hero', size: [56, 80] as [number, number] },
  { entityId: 'forest-slime',  spritePath: 'art/enemies/forest-slime',   size: [56, 56] as [number, number] },
  { entityId: 'coin',          spritePath: 'art/pickups/coin',           size: [28, 28] as [number, number] },
  { entityId: 'weaponBoost',   spritePath: 'art/pickups/weapon-boost',   size: [28, 28] as [number, number] },
  { entityId: 'player-bullet', spritePath: 'art/weapons/player-bullet',  size: [20, 14] as [number, number] },
  { entityId: 'exit-sign',     spritePath: 'art/ui/exit-sign',           size: [64, 64] as [number, number] },
  { entityId: 'forest-bg',     spritePath: 'art/map/background',         size: [1280, 720] as [number, number] },
] as const;

// ═══════════════════════════════════════════════
// 瓦片类型 → 精灵路径 + 尺寸
// tileType 由关卡 platform.tileType 引用
// ═══════════════════════════════════════════════

const TILE_SPRITES: Record<string, { path: string; size: [number, number] }> = {
  'ground':   { path: 'art/map/ground_tile',   size: [256, 80] },
  'platform': { path: 'art/map/platform_tile',  size: [256, 36] },
};

// ═══════════════════════════════════════════════
// 导出：构建 ConfigRegistry
// ═══════════════════════════════════════════════

export function createDefaultRegistry(): ConfigRegistry {
  return {
    player: PLAYER_CONFIG,
    weapons: [...WEAPON_TEMPLATES],
    enemies: [...ENEMY_TEMPLATES],
    levels: [...LEVEL_CONFIGS],
    entitySprites: [...ENTITY_SPRITES],
    tileSprites: { ...TILE_SPRITES },
  };
}
