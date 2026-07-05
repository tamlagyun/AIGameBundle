import type { ActionResult, MushroomConfig } from './types.ts';
import type { PileSystem } from './PileSystem.ts';

export interface MushroomState {
  id: string;
  pileId: string;
  x: number;
  y: number;
  picked: boolean;
  visible: boolean;
}

export class MushroomSystem {
  private readonly mushrooms = new Map<string, MushroomState>();

  load(items: MushroomConfig[], privatePileSystem: PileSystem): void {
    this.mushrooms.clear();

    for (const item of items) {
      this.mushrooms.set(item.id, {
        id: item.id,
        pileId: item.pileId,
        x: item.x,
        y: item.y,
        picked: false,
        visible: privatePileSystem.isPileClear(item.pileId)
      });
    }
  }

  refreshVisibility(pileSystem: PileSystem): void {
    for (const mushroom of this.mushrooms.values()) {
      if (!mushroom.picked) {
        mushroom.visible = pileSystem.isPileClear(mushroom.pileId);
      }
    }
  }

  pick(mushroomId: string): ActionResult {
    const mushroom = this.mushrooms.get(mushroomId);
    if (!mushroom) {
      return { ok: false, reason: 'mushroom_not_found' };
    }

    if (mushroom.picked) {
      return { ok: false, reason: 'mushroom_already_picked' };
    }

    if (!mushroom.visible) {
      return { ok: false, reason: 'mushroom_hidden' };
    }

    mushroom.picked = true;
    mushroom.visible = false;
    return { ok: true };
  }

  getPickedCount(): number {
    return [...this.mushrooms.values()].filter((mushroom) => mushroom.picked).length;
  }

  getMushrooms(): MushroomState[] {
    return [...this.mushrooms.values()].map((mushroom) => ({ ...mushroom }));
  }
}
