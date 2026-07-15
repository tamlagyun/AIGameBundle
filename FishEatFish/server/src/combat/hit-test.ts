export interface HitTarget { x: number; y: number; radius?: number; }
export const isWithinAttackCone = (source: { x: number; y: number; rotation: number }, target: HitTarget, range: number, angleRadians: number, sourceRadius = 0): boolean => {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.hypot(dx, dy);
  if (distance > range + sourceRadius + (target.radius ?? 24)) return false;
  if (distance <= 0.001) return true;
  let delta = Math.atan2(dy, dx) - source.rotation * Math.PI / 180;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return Math.abs(delta) <= angleRadians / 2;
};
