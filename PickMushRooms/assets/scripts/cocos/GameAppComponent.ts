import { _decorator, Component, JsonAsset, Label, Node, Prefab, instantiate, resources } from 'cc';
import { GameApp } from '../core/GameApp.ts';
import type { LevelConfig } from '../core/types.ts';
import { PlatformServiceWeb } from '../platform/PlatformServiceWeb.ts';

const { ccclass, property } = _decorator;

@ccclass('GameAppComponent')
export class GameAppComponent extends Component {
  @property(Label)
  targetLabel: Label | null = null;

  @property(Node)
  completedPanel: Node | null = null;

  @property(Node)
  playfield: Node | null = null;

  @property(Prefab)
  pileLayerPrefab: Prefab | null = null;

  @property(Prefab)
  mushroomPrefab: Prefab | null = null;

  private readonly app = new GameApp(new PlatformServiceWeb());

  async start(): Promise<void> {
    await this.app.initialize();
    resources.load('levels/level-001', JsonAsset, (error, asset) => {
      if (error || !asset) {
        console.error('Failed to load level-001', error);
        return;
      }

      this.app.startLevel(asset.json as LevelConfig);
      this.renderLevel();
      this.renderHud();
    });
  }

  removeTopLayer(pileId: string): void {
    this.app.removeTopLayer(pileId);
    this.renderHud();
  }

  pickMushroom(mushroomId: string): void {
    this.app.pickMushroom(mushroomId);
    this.renderHud();
  }

  private renderLevel(): void {
    if (!this.playfield) {
      return;
    }

    this.playfield.removeAllChildren();

    for (const pile of this.app.levels.piles.getPiles()) {
      for (const layer of pile.layers) {
        const node = this.createPlaceholderNode(this.pileLayerPrefab, `${pile.id}:${layer.kind}`);
        node.setPosition(pile.x, pile.y);
        node.on(Node.EventType.TOUCH_END, () => this.removeTopLayer(pile.id));
        this.playfield.addChild(node);
      }
    }

    for (const mushroom of this.app.levels.mushrooms.getMushrooms()) {
      const node = this.createPlaceholderNode(this.mushroomPrefab, mushroom.id);
      node.active = mushroom.visible;
      node.setPosition(mushroom.x, mushroom.y);
      node.on(Node.EventType.TOUCH_END, () => this.pickMushroom(mushroom.id));
      this.playfield.addChild(node);
    }
  }

  private renderHud(): void {
    const hud = this.app.ui.renderHud(this.app.getState());
    if (this.targetLabel) {
      this.targetLabel.string = hud.targetText;
    }
    if (this.completedPanel) {
      this.completedPanel.active = hud.completedVisible;
    }
    this.renderLevel();
  }

  private createPlaceholderNode(prefab: Prefab | null, name: string): Node {
    const node = prefab ? instantiate(prefab) : new Node(name);
    node.name = name;
    return node;
  }
}
