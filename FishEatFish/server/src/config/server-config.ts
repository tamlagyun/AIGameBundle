export interface ServerConfig {
  host: string; httpPort: number; websocketPath: string; tickRate: number; snapshotRate: number;
  roomCapacity: number; mapId: string; mapWidth: number; mapHeight: number; playerSpeed: number;
  authMode: 'memory'; disconnectPolicy: 'remove-immediately';
}

export const defaultServerConfig: ServerConfig = {
  host: '0.0.0.0', httpPort: 3000, websocketPath: '/ws', tickRate: 20, snapshotRate: 10,
  roomCapacity: 50, mapId: 'sea-default-001', mapWidth: 3840, mapHeight: 2160,
  playerSpeed: 260, authMode: 'memory', disconnectPolicy: 'remove-immediately'
};
