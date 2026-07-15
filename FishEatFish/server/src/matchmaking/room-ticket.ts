import { randomUUID } from 'node:crypto';
export const createRoomTicket = (roomId: string, accountId: string) => ({ ticket: randomUUID(), roomId, accountId, expiresAt: Date.now() + 60_000 });
