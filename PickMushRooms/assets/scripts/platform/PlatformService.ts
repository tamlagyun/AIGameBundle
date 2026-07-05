export interface PlatformLoginResult {
  ok: boolean;
  userId: string;
}

export interface PlatformShareResult {
  ok: boolean;
}

export interface PlatformRewardAdResult {
  ok: boolean;
  rewarded: boolean;
}

export interface PlatformService {
  login(): Promise<PlatformLoginResult>;
  share(): Promise<PlatformShareResult>;
  showRewardAd(): Promise<PlatformRewardAdResult>;
  saveData(key: string, value: unknown): Promise<void>;
  loadData<T>(key: string): Promise<T | undefined>;
}
