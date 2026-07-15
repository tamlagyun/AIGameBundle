import type { Room } from './room.js';
export class RoomLoop { private timer?: NodeJS.Timeout; constructor(private readonly room: Room, private readonly tickRate: number, private readonly snapshotRate: number) {} start() { this.timer = setInterval(() => this.room.tick(), 1000 / this.tickRate); this.timer.unref(); } stop() { if (this.timer) clearInterval(this.timer); } }
