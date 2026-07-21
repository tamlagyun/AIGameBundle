export const PROTOCOL_VERSION = 1;
export type ProtocolType = 'joinRoom' | 'input' | 'skill' | 'appearance' | 'ping' | 'leaveRoom' | 'roomSnapshot' | 'playerJoined' | 'playerRemoved' | 'appearanceChanged' | 'stateSnapshot' | 'stateCorrection' | 'skillEffect' | 'skillResolved' | 'hitConfirmed' | 'playerDamaged' | 'playerDied' | 'playerRespawned' | 'combatSettlement' | 'pong' | 'error';
export interface ProtocolMessage<T = unknown> { protocolVersion: number; type: ProtocolType; requestId?: string; payload: T; }
