import type { NetworkInput } from './NetworkInputBuffer.ts';
export interface PredictedPosition { x: number; y: number; rotation: number; }
export class ClientPredictionController { reconcile(current: PredictedPosition, authoritative: PredictedPosition, pending: NetworkInput[], simulate: (position: PredictedPosition, input: NetworkInput) => PredictedPosition) { let result = { ...authoritative }; for (const input of pending) result = simulate(result, input); return result; } }
