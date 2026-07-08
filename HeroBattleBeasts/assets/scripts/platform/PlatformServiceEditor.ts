import type {
  LoginResult,
  PlatformService,
  RewardAdResult,
  SharePayload,
  ShareResult
} from './PlatformService';
import type { SafeAreaInsets } from '../shared/types';

export class PlatformServiceEditor implements PlatformService {
  readonly target = 'editor';
  private readonly storage = new Map<string, unknown>();
  private readonly pauseCallbacks = new Set<() => void>();
  private readonly resumeCallbacks = new Set<() => void>();

  async init(): Promise<void> {}

  async login(): Promise<LoginResult> {
    return { ok: true, userId: 'editor-local-user' };
  }

  async share(payload: SharePayload): Promise<ShareResult> {
    return { ok: Boolean(payload.title) };
  }

  async showRewardAd(): Promise<RewardAdResult> {
    return { rewarded: false, reason: 'editor_ad_unavailable' };
  }

  async saveData(key: string, value: unknown): Promise<void> {
    this.storage.set(key, value);
  }

  async loadData<T>(key: string): Promise<T | null> {
    return this.storage.has(key) ? (this.storage.get(key) as T) : null;
  }

  vibrate(): void {}

  getSafeArea(): SafeAreaInsets {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  onPause(callback: () => void): void {
    this.pauseCallbacks.add(callback);
  }

  onResume(callback: () => void): void {
    this.resumeCallbacks.add(callback);
  }
}
