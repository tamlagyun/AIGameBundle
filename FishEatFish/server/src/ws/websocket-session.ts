import type { WebSocket } from 'ws';
import type { AuthService } from '../auth/auth-service.js';
import type { RoomManager } from '../room/room-manager.js';
import { decode, encode } from '../protocol/protocol-codec.js';
import { parseAppearance, parseClientMessage, parseInput, parseSkill } from '../protocol/message-schemas.js';
import { message, type RoomSnapshot } from '../protocol/server-messages.js';

export function attachSession(socket: WebSocket, token: string, auth: AuthService, rooms: RoomManager) {
  const accountId = auth.verify(token);
  if (!accountId) { socket.close(1008, 'UNAUTHORIZED'); return; }
  const room = rooms.defaultRoom();
  let playerId: string | undefined;
  const displayName = auth.displayNameForAccount(accountId) ?? `玩家-${accountId.slice(0, 6)}`;
  socket.on('message', (raw) => {
    try {
      const parsed = parseClientMessage(decode(raw.toString()));
      if (parsed.protocolVersion !== 1) throw new Error('UNSUPPORTED_PROTOCOL');
      if (parsed.type === 'joinRoom') {
        const player = room.add(accountId, displayName, socket);
        playerId = player.playerId;
        socket.send(encode(message('roomSnapshot', room.snapshot(player.playerId) as RoomSnapshot)));
      } else if (parsed.type === 'input' && playerId) room.input(playerId, parseInput(parsed.payload));
      else if (parsed.type === 'skill' && playerId) room.skill(playerId, parseSkill(parsed.payload));
      else if (parsed.type === 'appearance' && playerId) room.appearance(playerId, parseAppearance(parsed.payload));
      else if (parsed.type === 'ping') socket.send(encode(message('pong', { now: Date.now() }, parsed.requestId)));
      else if (parsed.type === 'leaveRoom' && playerId) { room.remove(playerId); playerId = undefined; socket.close(1000); }
    } catch { socket.send(encode(message('error', { code: 'INVALID_MESSAGE' }))); }
  });
  socket.on('close', () => { if (playerId) room.remove(playerId); });
}
