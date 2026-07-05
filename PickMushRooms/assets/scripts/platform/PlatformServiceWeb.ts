import type {
  PlatformLoginResult,
  PlatformRewardAdResult,
  PlatformService,
  PlatformShareResult
} from './PlatformService.ts';

export class PlatformServiceWeb implements PlatformService {
  private readonly storage = new Map<string, unknown>();

  async login(): Promise<PlatformLoginResult> {
    return { ok: true, userId: 'web-local-user' };
  }

  async share(): Promise<PlatformShareResult> {
    return { ok: true };
  }

  async showRewardAd(): Promise<PlatformRewardAdResult> {
    return { ok: true, rewarded: true };
  }

  async saveData(key: string, value: unknown): Promise<void> {
    this.storage.set(key, value);
  }

  async loadData<T>(key: string): Promise<T | undefined> {
    return this.storage.get(key) as T | undefined;
  }
}
