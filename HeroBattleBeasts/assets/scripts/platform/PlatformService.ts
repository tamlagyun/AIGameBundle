import type { PlatformTarget, SafeAreaInsets } from '../shared/types';

export type LoginResult = {
  ok: boolean;
  userId?: string;
  reason?: string;
};

export type SharePayload = {
  title: string;
  imageUrl?: string;
};

export type ShareResult = {
  ok: boolean;
  reason?: string;
};

export type RewardAdResult = {
  rewarded: boolean;
  reason?: string;
};

export interface PlatformService {
  readonly target: PlatformTarget;
  init(): Promise<void>;
  login(): Promise<LoginResult>;
  share(payload: SharePayload): Promise<ShareResult>;
  showRewardAd(placementId: string): Promise<RewardAdResult>;
  saveData(key: string, value: unknown): Promise<void>;
  loadData<T>(key: string): Promise<T | null>;
  vibrate(durationMs: number): void;
  getSafeArea(): SafeAreaInsets;
  onPause(callback: () => void): void;
  onResume(callback: () => void): void;
}
