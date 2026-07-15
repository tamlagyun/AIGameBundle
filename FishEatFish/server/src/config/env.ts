import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ServerConfig } from './server-config.js';
import { defaultServerConfig } from './server-config.js';

export async function loadServerConfig(root = process.cwd()): Promise<ServerConfig> {
  const file = process.env.NODE_ENV === 'test' ? 'test.json' : 'development.json';
  const value = JSON.parse(await readFile(join(root, 'config', file), 'utf8')) as Partial<ServerConfig>;
  return { ...defaultServerConfig, ...value, httpPort: Number(process.env.PORT ?? value.httpPort ?? 3000) };
}
