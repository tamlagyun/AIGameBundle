import test from 'node:test';
import assert from 'node:assert/strict';
import { MatchmakingService } from '../src/matchmaking/matchmaking-service.js';
import { RoomManager } from '../src/room/room-manager.js';
import { defaultServerConfig } from '../src/config/server-config.js';
test('matchmaking returns default room ticket', () => { const result = new MatchmakingService(new RoomManager(defaultServerConfig), defaultServerConfig).join('account'); assert.equal(result.mapId, 'sea-default-001'); assert.ok(result.ticket); });
