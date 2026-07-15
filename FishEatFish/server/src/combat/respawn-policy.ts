import { RESPAWN_DELAY_MS, RESPAWN_INVULNERABILITY_MS } from './combat-config.js';
export const respawnAt = (now: number) => now + RESPAWN_DELAY_MS;
export const invulnerableUntil = (now: number) => now + RESPAWN_INVULNERABILITY_MS;
