import type { ProtocolMessage } from './protocol-version.js';
export const encode = (message: ProtocolMessage): string => JSON.stringify(message);
export const decode = (value: string): unknown => JSON.parse(value);
