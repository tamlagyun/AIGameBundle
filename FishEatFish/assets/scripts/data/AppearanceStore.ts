import type { PlayerAppearanceConfig } from '../core/types.ts';

interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface StoredAppearance {
  schemaVersion: 1;
  appearanceId: string;
}

const STORAGE_KEY = 'fish-eat-fish.appearance.v1';

/** Validates and persists the locally selected player appearance. */
export class AppearanceStore {
  private readonly appearances = new Map<string, PlayerAppearanceConfig>();
  private readonly defaultAppearanceId: string;
  private readonly storage: StoragePort | undefined;
  private selectedId: string;

  public constructor(
    appearances: PlayerAppearanceConfig[],
    defaultAppearanceId: string,
    storage: StoragePort | undefined = AppearanceStore.resolveStorage()
  ) {
    this.defaultAppearanceId = defaultAppearanceId;
    this.storage = storage;
    for (const appearance of appearances) this.appearances.set(appearance.id, appearance);
    if (!this.appearances.has(defaultAppearanceId)) throw new Error(`default appearance does not exist: ${defaultAppearanceId}`);
    this.selectedId = this.readStored();
  }

  public getSelected(): PlayerAppearanceConfig {
    return this.appearances.get(this.selectedId) as PlayerAppearanceConfig;
  }

  public getAll(): PlayerAppearanceConfig[] {
    return [...this.appearances.values()];
  }

  public select(appearanceId: string): boolean {
    if (!this.appearances.has(appearanceId)) return false;
    this.selectedId = appearanceId;
    this.persist();
    return true;
  }

  private readStored(): string {
    try {
      const text = this.storage?.getItem(STORAGE_KEY);
      if (!text) return this.defaultAppearanceId;
      const value = JSON.parse(text) as Partial<StoredAppearance>;
      return value.schemaVersion === 1 && typeof value.appearanceId === 'string' && this.appearances.has(value.appearanceId)
        ? value.appearanceId
        : this.defaultAppearanceId;
    } catch {
      return this.defaultAppearanceId;
    }
  }

  private persist(): void {
    try {
      const value: StoredAppearance = { schemaVersion: 1, appearanceId: this.selectedId };
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Native/IDE storage may be unavailable; the current session remains usable.
    }
  }

  private static resolveStorage(): StoragePort | undefined {
    try { return (globalThis as { localStorage?: StoragePort }).localStorage; }
    catch { return undefined; }
  }
}
