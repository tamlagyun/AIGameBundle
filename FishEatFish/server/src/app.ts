import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import type { ServerConfig } from './config/server-config.js';
import { AuthService } from './auth/auth-service.js';
import { RoomManager } from './room/room-manager.js';
import { MatchmakingService } from './matchmaking/matchmaking-service.js';
import { registerHealthRoute } from './http/routes/health.routes.js';
import { registerAuthRoutes } from './http/routes/auth.routes.js';
import { registerMatchRoutes } from './http/routes/match.routes.js';
import { registerWebsocketGateway } from './ws/websocket.gateway.js';
export function createApp(config: ServerConfig) { const app = Fastify({ logger: true }); const auth = new AuthService(); const rooms = new RoomManager(config); const matchmaking = new MatchmakingService(rooms, config); app.register(cors, { origin: true }); app.register(websocket); app.register(registerHealthRoute); app.register(async (instance) => registerAuthRoutes(instance, auth)); app.register(async (instance) => registerMatchRoutes(instance, auth, matchmaking)); app.register(async (instance) => registerWebsocketGateway(instance, auth, rooms, config.websocketPath)); app.addHook('onClose', async () => rooms.close()); return { app, auth, rooms, matchmaking }; }
