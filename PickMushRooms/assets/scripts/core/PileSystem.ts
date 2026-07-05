import type { ActionResult, PileConfig, PileLayerConfig } from './types.ts';

export interface PileState {
  id: string;
  x: number;
  y: number;
  layers: PileLayerConfig[];
  removedLayerIds: string[];
}

export class PileSystem {
  private readonly piles = new Map<string, PileState>();

  load(piles: PileConfig[]): void {
    this.piles.clear();

    for (const pile of piles) {
      this.piles.set(pile.id, {
        id: pile.id,
        x: pile.x,
        y: pile.y,
        layers: [...pile.layers],
        removedLayerIds: []
      });
    }
  }

  removeTopLayer(pileId: string): ActionResult {
    const pile = this.piles.get(pileId);
    if (!pile) {
      return { ok: false, reason: 'pile_not_found' };
    }

    const remaining = this.getRemainingLayers(pileId);
    if (remaining.length === 0) {
      return { ok: false, reason: 'pile_already_clear' };
    }

    const topLayer = remaining[0];
    pile.removedLayerIds.push(topLayer.id);
    return { ok: true };
  }

  isPileClear(pileId: string): boolean {
    return this.getRemainingLayers(pileId).length === 0;
  }

  getPile(pileId: string): PileState | undefined {
    const pile = this.piles.get(pileId);
    if (!pile) {
      return undefined;
    }

    return {
      ...pile,
      layers: [...pile.layers],
      removedLayerIds: [...pile.removedLayerIds]
    };
  }

  getPiles(): PileState[] {
    return [...this.piles.keys()].map((id) => this.getPile(id)!);
  }

  getRemainingLayers(pileId: string): PileLayerConfig[] {
    const pile = this.piles.get(pileId);
    if (!pile) {
      return [];
    }

    const removed = new Set(pile.removedLayerIds);
    return pile.layers.filter((layer) => !removed.has(layer.id));
  }
}
