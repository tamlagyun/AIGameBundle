import type { ServerConfig } from '../config/server-config.js';
import { RoomRegistry } from '../matchmaking/room-registry.js';
import { Room } from './room.js';
import { RoomLoop } from './room-loop.js';
export class RoomManager { readonly registry = new RoomRegistry(); private readonly loops = new Map<string, RoomLoop>(); constructor(private readonly config: ServerConfig) {} defaultRoom() { let room = [...this.registry.values()][0]; if (!room) { room = new Room(this.config); this.registry.set(room); const loop = new RoomLoop(room, this.config.tickRate, this.config.snapshotRate); loop.start(); this.loops.set(room.id, loop); } return room; } close() { for (const loop of this.loops.values()) loop.stop(); this.loops.clear(); } }
