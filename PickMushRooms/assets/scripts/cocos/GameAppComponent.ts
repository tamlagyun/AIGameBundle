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
  Sprite,
  SpriteFrame,
  Texture2D,
  UITransform,
  UIOpacity,
  Vec3,
  instantiate,
  resources,
  tween
} from 'cc';
import { GameApp } from '../core/GameApp.ts';
import { createLevelViewModel } from '../core/LevelViewModel.ts';
import type { LevelConfig } from '../core/types.ts';
import { PlatformServiceWeb } from '../platform/PlatformServiceWeb.ts';
import { getInteractionFeedbackPlan } from './InteractionFeedbackPlan.ts';
import { getPlaceholderArtManifest } from './PlaceholderArtManifest.ts';
import { getRuntimeLayerPlan, type RuntimeLayerKey } from './RuntimeLayerPlan.ts';

const { ccclass, property } = _decorator;

const TEXT = {
  targetPrefix: '\u76ee\u6807',
  statusPlaying: '\u70b9\u51fb\u8349\u679d\u5806\uff0c\u9732\u51fa\u83cc\u5b50\u540e\u62fe\u53d6',
  statusComplete: '\u901a\u5173\uff01\u83cc\u5b50\u5df2\u7ecf\u6361\u591f\u4e86',
  removeHint: '\u70b9\u51fb\u79fb\u9664',
  replay: '\u91cd\u73a9',
  mushroom: '\u83cc\u5b50',
  picked: '\u5df2\u62fe\u53d6',
  completedTitle: '\u901a\u5173',
  completedSubtitle: '\u7c97\u7565\u7248\u672c\u95ed\u73af\u5b8c\u6210'
};

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
  private readonly runtimeLayers = new Map<RuntimeLayerKey, Node>();
  private readonly artManifest = getPlaceholderArtManifest();
  private readonly feedbackPlan = getInteractionFeedbackPlan();
  private readonly spriteFrameCache = new Map<string, SpriteFrame | null>();
  private currentLevel: LevelConfig | null = null;
  private statusLabel: Label | null = null;

  async start(): Promise<void> {
    this.ensureRuntimeNodes();
    await this.app.initialize();
    resources.load('levels/level-001', JsonAsset, (error, asset) => {
      if (error || !asset) {
        console.error('Failed to load level-001', error);
        return;
      }

      this.currentLevel = asset.json as LevelConfig;
      this.app.startLevel(this.currentLevel);
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

  replayLevel(): void {
    if (!this.currentLevel) {
      return;
    }

    this.app.startLevel(this.currentLevel);
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
      node.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
        event.propagationStopped = true;
        this.playPickFeedback(mushroom.id, node);
      });
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
        this.playRemoveLayerFeedback(pile.id, node);
      });
      this.playfield.addChild(node);
    }
  }

  private renderHud(): void {
    const hud = createLevelViewModel(this.app).hud;
    if (this.targetLabel) {
      this.targetLabel.string = `${TEXT.targetPrefix} ${hud.targetText}`;
    }
    if (this.statusLabel) {
      this.statusLabel.string = hud.completedVisible ? TEXT.statusComplete : TEXT.statusPlaying;
    }
    if (this.completedPanel) {
      this.completedPanel.active = hud.completedVisible;
    }
    this.renderLevel();
  }

  private ensureRuntimeNodes(): void {
    this.ensureRuntimeLayers();
    this.ensureBackground();

    const playfieldLayer = this.getRuntimeLayer('playfield');
    this.playfield = this.playfield ?? playfieldLayer;

    const hudLayer = this.getRuntimeLayer('hud');
    if (!this.targetLabel) {
      const targetNode = this.createLabelNode('TargetLabel', `${TEXT.targetPrefix} 0/0`, 26, new Color(45, 39, 31, 255));
      targetNode.setPosition(-300, 260);
      hudLayer.addChild(targetNode);
      this.targetLabel = targetNode.getComponent(Label);
    }

    if (!this.statusLabel) {
      const statusNode = this.createLabelNode('StatusLabel', '', 20, new Color(70, 62, 50, 255));
      statusNode.setPosition(0, 225);
      hudLayer.addChild(statusNode);
      this.statusLabel = statusNode.getComponent(Label);
    }

    if (!this.completedPanel) {
      this.completedPanel = this.createCompletedPanel();
      this.completedPanel.active = false;
      this.getRuntimeLayer('modal').addChild(this.completedPanel);
    }
  }

  private ensureRuntimeLayers(): void {
    for (const layer of getRuntimeLayerPlan()) {
      let node = this.node.getChildByName(layer.nodeName);
      if (!node) {
        node = new Node(layer.nodeName);
        this.node.addChild(node);
      }
      this.runtimeLayers.set(layer.key, node);
    }
  }

  private ensureBackground(): void {
    const backgroundLayer = this.getRuntimeLayer('background');
    if (backgroundLayer.children.length > 0) {
      return;
    }

    const background = new Node('ForestPlaceholder');
    this.ensureSize(background, 960, 640);
    if (!this.applySprite(background, this.artManifest.background, 960, 640)) {
      const graphics = background.addComponent(Graphics);
      graphics.fillColor = new Color(198, 222, 180, 255);
      graphics.rect(-480, -320, 960, 640);
      graphics.fill();
      graphics.fillColor = new Color(114, 155, 91, 255);
      graphics.roundRect(-380, -260, 760, 110, 20);
      graphics.fill();
    }
    backgroundLayer.addChild(background);
  }

  private getRuntimeLayer(key: RuntimeLayerKey): Node {
    const layer = this.runtimeLayers.get(key);
    if (!layer) {
      throw new Error(`Runtime layer missing: ${key}`);
    }
    return layer;
  }

  private playRemoveLayerFeedback(pileId: string, node: Node): void {
    const result = this.app.removeTopLayer(pileId);
    if (!result.ok) {
      this.renderHud();
      return;
    }

    this.fadeAndScaleNode(
      node,
      this.feedbackPlan.removeLayer.durationSeconds,
      this.feedbackPlan.removeLayer.endScale,
      this.feedbackPlan.removeLayer.endOpacity,
      () => this.renderHud()
    );
  }

  private playPickFeedback(mushroomId: string, node: Node): void {
    const result = this.app.pickMushroom(mushroomId);
    if (!result.ok) {
      this.renderHud();
      return;
    }

    this.spawnFloatingText(node, this.feedbackPlan.floatingText.text);
    this.fadeAndScaleNode(
      node,
      this.feedbackPlan.pickMushroom.durationSeconds,
      this.feedbackPlan.pickMushroom.endScale,
      this.feedbackPlan.pickMushroom.endOpacity,
      () => this.renderHud()
    );
  }

  private fadeAndScaleNode(
    node: Node,
    durationSeconds: number,
    endScale: number,
    endOpacity: number,
    onComplete: () => void
  ): void {
    const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
    tween(node)
      .to(durationSeconds, { scale: new Vec3(endScale, endScale, 1) })
      .start();
    tween(opacity)
      .to(durationSeconds, { opacity: endOpacity })
      .call(onComplete)
      .start();
  }

  private spawnFloatingText(sourceNode: Node, text: string): void {
    const floating = this.createLabelNode('FloatingFeedback', text, 22, new Color(255, 246, 166, 255));
    floating.setPosition(sourceNode.position.x, sourceNode.position.y + 34);
    this.getRuntimeLayer('hud').addChild(floating);

    const opacity = floating.addComponent(UIOpacity);
    tween(floating)
      .to(this.feedbackPlan.floatingText.durationSeconds, {
        position: new Vec3(sourceNode.position.x, sourceNode.position.y + this.feedbackPlan.floatingText.yOffset, 0)
      })
      .start();
    tween(opacity)
      .to(this.feedbackPlan.floatingText.durationSeconds, { opacity: 0 })
      .call(() => floating.destroy())
      .start();
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
      const assetPath = kind === 'branch' ? this.artManifest.branchPile : this.artManifest.thatchPile;
      const hasSprite = this.applySprite(node, assetPath, 210, 130);
      if (!hasSprite) {
        const graphics = node.addComponent(Graphics);
        const color = kind === 'branch' ? new Color(122, 83, 52, 255) : new Color(178, 151, 88, 255);
        graphics.fillColor = color;
        graphics.roundRect(-105, -65, 210, 130, 18);
        graphics.fill();
      }

      const title = this.createLabelNode('LayerLabel', `${label} x${remainingLayerCount}`, 18, Color.WHITE);
      title.setPosition(0, 8);
      node.addChild(title);

      const hint = this.createLabelNode('LayerHint', TEXT.removeHint, 14, new Color(255, 244, 207, 255));
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
      if (!this.applySprite(node, this.artManifest.mushroom, 72, 72)) {
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = picked ? new Color(130, 130, 130, 120) : new Color(223, 72, 57, 255);
        graphics.circle(0, 10, 28);
        graphics.fill();
        graphics.fillColor = picked ? new Color(110, 110, 110, 120) : new Color(238, 213, 154, 255);
        graphics.roundRect(-10, -34, 20, 42, 8);
        graphics.fill();
      }

      const label = this.createLabelNode('PickLabel', picked ? TEXT.picked : TEXT.mushroom, 14, Color.WHITE);
      label.setPosition(0, -48);
      node.addChild(label);
    }

    return node;
  }

  private createCompletedPanel(): Node {
    const panel = new Node('CompletedPanel');
    this.ensureSize(panel, 360, 142);

    const graphics = panel.addComponent(Graphics);
    graphics.fillColor = new Color(48, 114, 73, 235);
    graphics.roundRect(-180, -71, 360, 142, 16);
    graphics.fill();

    const label = this.createLabelNode('CompletedLabel', TEXT.completedTitle, 30, Color.WHITE);
    label.setPosition(0, 34);
    panel.addChild(label);

    const subLabel = this.createLabelNode('CompletedSubLabel', TEXT.completedSubtitle, 16, new Color(220, 255, 226, 255));
    subLabel.setPosition(0, 0);
    panel.addChild(subLabel);

    const replayButton = this.createTextButton('ReplayButton', TEXT.replay, 132, 40, new Color(236, 197, 93, 255));
    replayButton.setPosition(0, -42);
    replayButton.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
      event.propagationStopped = true;
      this.replayLevel();
    });
    panel.addChild(replayButton);

    return panel;
  }

  private createTextButton(name: string, text: string, width: number, height: number, color: Color): Node {
    const button = new Node(name);
    this.ensureSize(button, width, height);

    const graphics = button.addComponent(Graphics);
    graphics.fillColor = color;
    graphics.roundRect(-width / 2, -height / 2, width, height, 10);
    graphics.fill();

    const label = this.createLabelNode(`${name}Label`, text, 18, new Color(54, 42, 24, 255));
    label.setPosition(0, -2);
    button.addChild(label);
    return button;
  }

  private applySprite(node: Node, assetPath: string, width: number, height: number): boolean {
    const cached = this.spriteFrameCache.get(assetPath);
    if (cached) {
      const sprite = node.addComponent(Sprite);
      sprite.spriteFrame = cached;
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      this.ensureSize(node, width, height);
      return true;
    }

    if (cached === undefined) {
      this.spriteFrameCache.set(assetPath, null);
      resources.load(assetPath, Texture2D, (error, texture) => {
        if (error || !texture) {
          console.warn(`Placeholder art missing: ${assetPath}`, error);
          return;
        }
        const spriteFrame = new SpriteFrame();
        spriteFrame.texture = texture;
        this.spriteFrameCache.set(assetPath, spriteFrame);
      });
    }

    return false;
  }

  private createPlaceholderNode(prefab: Prefab | null, name: string): Node {
    const node = prefab ? instantiate(prefab) : new Node(name);
    node.name = name;
    return node;
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
