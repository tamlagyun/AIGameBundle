export type CoreModuleName =
  | 'PlayerModel'
  | 'WeaponSystem'
  | 'EnemySystem'
  | 'PickupSystem'
  | 'ObjectiveSystem'
  | 'LevelSystem'
  | 'CombatSystem';

export const CORE_MODULES: CoreModuleName[] = [
  'PlayerModel',
  'WeaponSystem',
  'EnemySystem',
  'PickupSystem',
  'ObjectiveSystem',
  'LevelSystem',
  'CombatSystem'
];

export type {
  BulletState,
  EnemyState,
  GameState,
  GameStatus,
  PickupState,
  PlayerState,
  Rect
} from './GameState';
