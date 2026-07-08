import type { InputCommand } from '../shared/types';

export type KeyboardCodeSet = {
  has(code: string): boolean;
};

export function normalizeKeyboardInput(activeCodes: KeyboardCodeSet): InputCommand {
  const left = activeCodes.has('KeyA') || activeCodes.has('ArrowLeft');
  const right = activeCodes.has('KeyD') || activeCodes.has('ArrowRight');
  const up = activeCodes.has('KeyW') || activeCodes.has('ArrowUp');
  const down = activeCodes.has('KeyS') || activeCodes.has('ArrowDown');

  return {
    moveX: left === right ? 0 : right ? 1 : -1,
    aimX: left === right ? 0 : right ? 1 : -1,
    aimY: up === down ? 0 : up ? -1 : 1,
    jumpPressed: up || activeCodes.has('Space'),
    shootPressed: activeCodes.has('KeyJ') || activeCodes.has('KeyZ'),
    pausePressed: activeCodes.has('Escape') || activeCodes.has('KeyR')
  };
}
