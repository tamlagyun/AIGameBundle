import { NETWORK_PROTOCOL_VERSION, type NetworkMessage } from './NetworkProtocol.ts';
export const createNetworkMessage = <T>(type: NetworkMessage['type'], payload: T, requestId?: string): NetworkMessage<T> => ({ protocolVersion: NETWORK_PROTOCOL_VERSION, type, payload, ...(requestId ? { requestId } : {}) });
