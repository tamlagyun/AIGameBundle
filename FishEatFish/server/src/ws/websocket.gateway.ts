import type { FastifyInstance } from 'fastify';
import type { AuthService } from '../auth/auth-service.js';
import type { RoomManager } from '../room/room-manager.js';
import { attachSession } from './websocket-session.js';
export async function registerWebsocketGateway(app: FastifyInstance, auth: AuthService, rooms: RoomManager, path: string) { app.get(path, { websocket: true }, (socket, request) => { const token = (request.query as { token?: string }).token; if (!token) return socket.close(1008, 'TOKEN_REQUIRED'); attachSession(socket, token, auth, rooms); }); }
