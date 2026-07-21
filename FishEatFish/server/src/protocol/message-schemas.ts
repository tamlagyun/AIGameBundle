import { z } from 'zod';
import { appearanceSchema, clientMessageSchema, inputSchema, skillSchema } from './client-messages.js';
export const parseClientMessage = (value: unknown) => clientMessageSchema.parse(value);
export const parseInput = (value: unknown) => inputSchema.parse(value);
export const parseSkill = (value: unknown) => skillSchema.parse(value);
export const parseAppearance = (value: unknown) => appearanceSchema.parse(value);
