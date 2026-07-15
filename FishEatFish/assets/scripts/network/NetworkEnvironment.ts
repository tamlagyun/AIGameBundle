const EDITOR_INTERNAL_HOSTS = new Set(['', 'scene', 'editor']);

export interface NetworkEndpoint { host: string; httpBaseUrl: string; websocketUrl: string; }

/** Cocos Editor game-view reports `scene` as its hostname; it is not a routable server address. */
export const resolveNetworkEndpoint = (): NetworkEndpoint => {
  const runtime = globalThis as typeof globalThis & { FISH_EAT_FISH_SERVER_HOST?: string };
  const explicitHost = runtime.FISH_EAT_FISH_SERVER_HOST?.trim();
  const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const host = explicitHost || (EDITOR_INTERNAL_HOSTS.has(runtimeHost) ? 'localhost' : runtimeHost) || 'localhost';
  return { host, httpBaseUrl: `http://${host}:3000`, websocketUrl: `ws://${host}:3000/ws` };
};
