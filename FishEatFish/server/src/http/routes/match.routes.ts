import type { FastifyInstance } from 'fastify';
import type { AuthService } from '../../auth/auth-service.js';
import type { MatchmakingService } from '../../matchmaking/matchmaking-service.js';
export async function registerMatchRoutes(app: FastifyInstance, auth: AuthService, matchmaking: MatchmakingService) { app.post('/match/join', async (request, reply) => { const header = request.headers.authorization; const accountId = header?.startsWith('Bearer ') ? auth.verify(header.slice(7)) : null; if (!accountId) return reply.code(401).send({ error: 'UNAUTHORIZED' }); try { return matchmaking.join(accountId); } catch { return reply.code(409).send({ error: 'ROOM_FULL' }); } }); }
