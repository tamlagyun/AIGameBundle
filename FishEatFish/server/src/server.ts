import { createApp } from './app.js';
import { loadServerConfig } from './config/env.js';
const config = await loadServerConfig();
const { app } = createApp(config);
await app.listen({ host: config.host, port: config.httpPort });
