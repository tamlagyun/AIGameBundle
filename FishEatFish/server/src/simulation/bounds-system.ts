export interface Bounds { minX: number; maxX: number; minY: number; maxY: number; }
export const clampPosition = (x: number, y: number, bounds: Bounds) => ({ x: Math.min(bounds.maxX, Math.max(bounds.minX, x)), y: Math.min(bounds.maxY, Math.max(bounds.minY, y)) });
