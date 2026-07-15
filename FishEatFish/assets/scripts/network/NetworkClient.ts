import { createNetworkMessage } from './NetworkMessage.ts';
import type { NetworkMessage } from './NetworkProtocol.ts';
export class NetworkClient {
  private socket?: WebSocket;
  onMessage?: (message: NetworkMessage) => void;
  onStatus?: (status: 'open' | 'closed' | 'error') => void;
  onDiagnostic?: (detail: string) => void;
  connect(url: string) {
    this.onDiagnostic?.(`WebSocket connecting: ${url}`);
    this.socket = new WebSocket(url);
    this.socket.onopen = () => { this.onDiagnostic?.('WebSocket connected'); this.onStatus?.('open'); };
    this.socket.onclose = (event) => { this.onDiagnostic?.(`WebSocket closed: code=${event.code}, reason=${event.reason || 'none'}`); this.onStatus?.('closed'); };
    this.socket.onerror = (event) => { const detail = (event as unknown as { message?: string }).message || 'browser/editor WebSocket error'; this.onDiagnostic?.(`WebSocket error: ${detail}`); this.onStatus?.('error'); };
    this.socket.onmessage = (event) => this.onMessage?.(JSON.parse(String(event.data)) as NetworkMessage);
  }
  send<T>(type: NetworkMessage['type'], payload: T, requestId?: string) { if (this.socket?.readyState !== WebSocket.OPEN) return false; this.socket.send(JSON.stringify(createNetworkMessage(type, payload, requestId))); return true; }
  close() { this.socket?.close(); this.socket = undefined; }
}
