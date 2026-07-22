import { Node, SpriteFrame, UITransform } from 'cc';
import { FishHealthBarOverlay } from './FishHealthBarOverlay.ts';
import { FishNameOverlay } from './FishNameOverlay.ts';

/** 管理全部角色的头顶血条、数值与名字 HUD Overlay。 */
export class FishOverlayManager {
  private readonly healthDisplays = new Map<string, FishHealthBarOverlay>();
  private readonly nameDisplays = new Map<string, FishNameOverlay>();

  public constructor(private readonly overlayRoot: Node, private readonly healthFrame: SpriteFrame, private readonly healthFill: SpriteFrame) {}

  public add(id: string, fish: Node, health: number, maxHealth: number, name: string): void {
    const hasHealthDisplay = this.healthDisplays.has(id);
    if (!hasHealthDisplay) this.healthDisplays.set(id, new FishHealthBarOverlay(this.overlayRoot, fish, id, this.healthFrame, this.healthFill));
    if (!this.nameDisplays.has(id)) this.nameDisplays.set(id, new FishNameOverlay(this.overlayRoot, fish, id, name));
    if (!hasHealthDisplay) this.setHealth(id, health, maxHealth);
  }

  public setHealth(id: string, health: number, maxHealth: number): void { this.healthDisplays.get(id)?.setHealth(health, maxHealth); }
  public setName(id: string, name: string): void { this.nameDisplays.get(id)?.setName(name); }
  public remove(id: string): void { this.healthDisplays.get(id)?.destroy(); this.nameDisplays.get(id)?.destroy(); this.healthDisplays.delete(id); this.nameDisplays.delete(id); }
  public update(): void {
    const transform = this.overlayRoot.getComponent(UITransform); if (!transform) return;
    for (const display of this.healthDisplays.values()) display.updatePosition(transform);
    for (const display of this.nameDisplays.values()) display.updatePosition(transform);
  }
  public clear(): void { for (const id of new Set([...this.healthDisplays.keys(), ...this.nameDisplays.keys()])) this.remove(id); }
}
