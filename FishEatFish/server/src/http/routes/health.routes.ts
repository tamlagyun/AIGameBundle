import type { FastifyInstance } from 'fastify';
export async function registerHealthRoute(app: FastifyInstance) { app.get('/health', async () => ({ ok: true, service: 'fish-eat-fish-server' })); }
