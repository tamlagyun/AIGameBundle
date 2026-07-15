export interface PlatformUserInfo { platform: 'wechat' | 'douyin' | 'android' | 'ios' | 'harmony' | 'self'; platformUserId: string; displayName?: string; }
export interface PlatformAuthPort { exchangeToken(platformToken: string): Promise<PlatformUserInfo>; }
