export class ServerClock { tick = 0; constructor(readonly tickRate: number) {} advance() { this.tick += 1; return this.tick; } }
