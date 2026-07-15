import test from 'node:test';
import assert from 'node:assert/strict';
import { Room } from '../src/room/room.js';
import { defaultServerConfig } from '../src/config/server-config.js';
import { WebSocket } from 'ws';
test('room enforces capacity and removes players', () => { const room = new Room({ ...defaultServerConfig, roomCapacity: 1 }); const socket = { readyState: WebSocket.OPEN, send() {} } as unknown as WebSocket; const player = room.add('account', '玩家', socket); assert.equal(room.size, 1); room.remove(player.playerId); assert.equal(room.size, 0); });
