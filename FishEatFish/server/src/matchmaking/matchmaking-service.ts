import type { ServerConfig } from '../config/server-config.js';
import { createRoomTicket } from './room-ticket.js';
import type { RoomManager } from '../room/room-manager.js';
export class MatchmakingService { constructor(private readonly rooms: RoomManager, private readonly config: ServerConfig) {} join(accountId: string) { const room = this.rooms.defaultRoom(); if (room.size >= this.config.roomCapacity) throw new Error('ROOM_FULL'); return { ...createRoomTicket(room.id, accountId), mapId: this.config.mapId, websocketPath: this.config.websocketPath }; } }
