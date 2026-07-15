import type { Room } from '../room/room.js';
export class RoomRegistry { private readonly rooms = new Map<string, Room>(); get(id: string) { return this.rooms.get(id); } set(room: Room) { this.rooms.set(room.id, room); } values() { return this.rooms.values(); } }
