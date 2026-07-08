import type { InputCommand, Vector2 } from '../shared/types';

export type GameStatus = 'playing' | 'won' | 'lost';

export type PlayerState = {
  id: string;
  health: number;
  maxHealth: number;
  moveSpeed: number;
  jumpVelocity: number;
  invulnerableSecondsAfterHit: number;
  position: Vector2;
  velocity: Vector2;
  facing: -1 | 1;
  grounded: boolean;
  groundPlatformId: string | null;
  weaponId: string;
  weaponBoostUntil: number;
  invulnerableUntil: number;
};

export type EnemyState = {
  id: string;
  enemyId: string;
  position: Vector2;
  health: number;
  maxHealth: number;
  contactDamage: number;
  moveSpeed: number;
  patrolDistance: number;
  patrolOriginX: number;
  direction: -1 | 1;
  score: number;
  defeated: boolean;
};

export type BulletState = {
  id: string;
  position: Vector2;
  velocity: Vector2;
  damage: number;
  owner: 'player' | 'enemy';
  lifetimeSeconds: number;
  ageSeconds: number;
};

export type PickupState = {
  id: string;
  type: 'coin' | 'gem' | 'weaponBoost' | 'health';
  x: number;
  y: number;
  value?: number;
  weaponId?: string;
  collected: boolean;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PhysicsConfig = {
  gravity: number;
  maxFallSpeed: number;
  playerBounds: {
    width: number;
    height: number;
  };
};

export type CombatConfig = {
  bulletBounds: {
    width: number;
    height: number;
  };
  enemyBounds: {
    width: number;
    height: number;
  };
  pickupBounds: {
    width: number;
    height: number;
  };
  bulletLifetimeSeconds: number;
};

export type GameState = {
  status: GameStatus;
  timeSeconds: number;
  score: number;
  coins: number;
  defeatedEnemies: number;
  physics: PhysicsConfig;
  combat: CombatConfig;
  platforms: Rect[];
  objective: {
    type: string;
    requiredDefeats: number;
  };
  player: PlayerState;
  weapon: {
    id: string;
    damage: number;
    bulletSpeed: number;
    fireCooldownSeconds: number;
    boostedFireCooldownSeconds: number;
    boostDurationSeconds: number;
    nextFireAt: number;
  };
  enemies: EnemyState[];
  bullets: BulletState[];
  pickups: PickupState[];
  exit: Rect;
};

export {
  collectPickup,
  createInitialGameState,
  damagePlayer,
  fireWeapon,
  hitEnemy,
  updateEnemies,
  updatePickups,
  updatePlayer,
  updateProjectiles
} from './GameState.js';
