export type ConfigResource =
  | 'player.json'
  | 'weapon-basic.json'
  | 'enemy-slime.json'
  | 'level-001.json';

export const INITIAL_CONFIGS: ConfigResource[] = [
  'player.json',
  'weapon-basic.json',
  'enemy-slime.json',
  'level-001.json'
];

export type {
  ExpandedLevelConfig,
  GameplayLevelConfig,
  GameplayEnemySpawn,
  GameplayPickupSpawn,
  LevelEncounter,
  LevelPickupGroup
} from './LevelData';

export {
  createGameplayLevelConfig,
  createRuntimeConfigs,
  readJsonConfig
} from './LevelData';
