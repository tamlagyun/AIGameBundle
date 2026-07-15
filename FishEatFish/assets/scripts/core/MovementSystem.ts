import type { Vec2Value } from './types.ts';

export interface MovementBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const normalizeMovement = (value: Vec2Value): Vec2Value => {
  const length = Math.hypot(value.x, value.y);
  if (length <= 1) return { x: value.x, y: value.y };
  return { x: value.x / length, y: value.y / length };
};

/** Returns the world-facing angle for a right-facing fish sprite. */
export const movementAngleDegrees = (value: Vec2Value): number | null => {
  if (Math.hypot(value.x, value.y) <= 0.01) return null;
  return Math.atan2(value.y, value.x) * 180 / Math.PI;
};

export const moveWithinBounds = (
  position: Vec2Value,
  direction: Vec2Value,
  speed: number,
  deltaSeconds: number,
  bounds: MovementBounds
): Vec2Value => {
  const normalized = normalizeMovement(direction);
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, position.x + normalized.x * speed * deltaSeconds)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, position.y + normalized.y * speed * deltaSeconds))
  };
};
