import {
  _decorator,
  Color,
  Component,
  EventTouch,
  Graphics,
  JsonAsset,
  Label,
  Node,
  Prefab,
  UITransform,
  instantiate,
  resources
} from 'cc';
import { GameApp } from '../core/GameApp.ts';
import { createLevelViewModel } from '../core/LevelViewModel.ts';
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
  private statusLabel: Label | null = null;

  async start(): Promise<void> {
    this.ensureRuntimeNodes();
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

    const view = createLevelViewModel(this.app);
    this.playfield.removeAllChildren();

    for (const mushroom of view.mushrooms) {
      const node = this.createMushroomNode(mushroom.id, mushroom.visible, mushroom.picked);
      node.setPosition(mushroom.x, mushroom.y);
      node.on(Node.EventType.TOUCH_END, () => this.pickMushroom(mushroom.id));
      this.playfield.addChild(node);
    }

    for (const pile of view.piles) {
      if (pile.remainingLayerCount === 0) {
        continue;
      }

      const node = this.createPileNode(pile.id, pile.topLayerLabel, pile.topLayerKind, pile.remainingLayerCount);
      node.setPosition(pile.x, pile.y);
      node.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
        event.propagationStopped = true;
        this.removeTopLayer(pile.id);
      });
      this.playfield.addChild(node);
    }
  }

  private renderHud(): void {
    const hud = createLevelViewModel(this.app).hud;
    if (this.targetLabel) {
      this.targetLabel.string = `目标 ${hud.targetText}`;
    }
    if (this.statusLabel) {
      this.statusLabel.string = hud.completedVisible ? '通关！菌子已经捡够了' : '点击草枝堆，露出菌子后拾取';
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

  private ensureRuntimeNodes(): void {
    if (!this.playfield) {
      this.playfield = new Node('Playfield');
      this.node.addChild(this.playfield);
    }

    if (!this.targetLabel) {
      const targetNode = this.createLabelNode('TargetLabel', '目标 0/0', 26, new Color(45, 39, 31, 255));
      targetNode.setPosition(-300, 260);
      this.node.addChild(targetNode);
      this.targetLabel = targetNode.getComponent(Label);
    }

    if (!this.statusLabel) {
      const statusNode = this.createLabelNode('StatusLabel', '', 20, new Color(70, 62, 50, 255));
      statusNode.setPosition(0, 225);
      this.node.addChild(statusNode);
      this.statusLabel = statusNode.getComponent(Label);
    }

    if (!this.completedPanel) {
      this.completedPanel = this.createCompletedPanel();
      this.completedPanel.active = false;
      this.node.addChild(this.completedPanel);
    }
  }

  private createPileNode(
    pileId: string,
    label: string,
    kind: string | null,
    remainingLayerCount: number
  ): Node {
    const node = this.createPlaceholderNode(this.pileLayerPrefab, pileId);
    this.ensureSize(node, 210, 130);

    if (!this.pileLayerPrefab) {
      const graphics = node.addComponent(Graphics);
      const color = kind === 'branch' ? new Color(122, 83, 52, 255) : new Color(178, 151, 88, 255);
      graphics.fillColor = color;
      graphics.roundRect(-105, -65, 210, 130, 18);
      graphics.fill();

      const title = this.createLabelNode('LayerLabel', `${label} x${remainingLayerCount}`, 18, Color.WHITE);
      title.setPosition(0, 8);
      node.addChild(title);

      const hint = this.createLabelNode('LayerHint', '点击移除', 14, new Color(255, 244, 207, 255));
      hint.setPosition(0, -26);
      node.addChild(hint);
    }

    return node;
  }

  private createMushroomNode(mushroomId: string, visible: boolean, picked: boolean): Node {
    const node = this.createPlaceholderNode(this.mushroomPrefab, mushroomId);
    this.ensureSize(node, 72, 72);
    node.active = visible || picked;

    if (!this.mushroomPrefab) {
      const graphics = node.addComponent(Graphics);
      graphics.fillColor = picked ? new Color(130, 130, 130, 120) : new Color(223, 72, 57, 255);
      graphics.circle(0, 10, 28);
      graphics.fill();
      graphics.fillColor = picked ? new Color(110, 110, 110, 120) : new Color(238, 213, 154, 255);
      graphics.roundRect(-10, -34, 20, 42, 8);
      graphics.fill();

      const label = this.createLabelNode('PickLabel', picked ? '已拾取' : '菌子', 14, Color.WHITE);
      label.setPosition(0, -48);
      node.addChild(label);
    }

    return node;
  }

  private createCompletedPanel(): Node {
    const panel = new Node('CompletedPanel');
    this.ensureSize(panel, 360, 96);

    const graphics = panel.addComponent(Graphics);
    graphics.fillColor = new Color(48, 114, 73, 235);
    graphics.roundRect(-180, -48, 360, 96, 16);
    graphics.fill();

    const label = this.createLabelNode('CompletedLabel', '通关', 30, Color.WHITE);
    label.setPosition(0, 8);
    panel.addChild(label);

    const subLabel = this.createLabelNode('CompletedSubLabel', '粗略版本闭环完成', 16, new Color(220, 255, 226, 255));
    subLabel.setPosition(0, -26);
    panel.addChild(subLabel);

    return panel;
  }

  private createLabelNode(name: string, text: string, fontSize: number, color: Color): Node {
    const node = new Node(name);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.color = color;
    return node;
  }

  private ensureSize(node: Node, width: number, height: number): void {
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
  }
}
