import type { RoomSnapshot } from '../protocol/server-messages.js';
import type { Room } from '../room/room.js';
export const buildSnapshot = (room: Room): RoomSnapshot => room.snapshot();
