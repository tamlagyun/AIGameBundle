import { BlockInputEvents, Color, Graphics, ImageAsset, Label, Node, Sprite, SpriteFrame, Texture2D, UITransform } from 'cc';
import type { PlayerAppearanceConfig } from '../core/types.ts';

export interface TransformDialogOptions {
  entryParent: Node;
  dialogParent: Node;
  entryX: number;
  entryImage: ImageAsset;
  appearances: PlayerAppearanceConfig[];
  portraits: Map<string, ImageAsset>;
  initialAppearanceId: string;
  onSelect: (appearanceId: string) => boolean;
  onOpen?: () => void;
}

/** Fixed-screen appearance selector. Gameplay state is not mutated beyond the selected visual ID. */
export class TransformDialog {
  private readonly dialogRoot: Node;
  private readonly contentRoot: Node;
  private selectedAppearanceId: string;

  public constructor(private readonly options: TransformDialogOptions) {
    this.selectedAppearanceId = options.initialAppearanceId;
    this.createEntry();
    this.dialogRoot = this.createDialog();
    this.contentRoot = this.createContainer(this.dialogRoot.getChildByName('TransformPanel') as Node, 'TransformContent', 800, 390);
    this.contentRoot.setPosition(0, -36, 0);
    this.dialogRoot.active = false;
  }

  public open(): void {
    this.options.onOpen?.();
    this.refresh();
    this.dialogRoot.active = true;
  }

  public close(): void { this.dialogRoot.active = false; }

  private refresh(): void {
    for (const child of [...this.contentRoot.children]) child.destroy();
    this.options.appearances.forEach((appearance, index) => this.createAppearanceCard(appearance, index));
    this.createLabel(this.contentRoot, 'TransformHint', '变身只更换角色形象和动作，不改变属性、位置或技能', 20, 0, -160, 720, 36);
  }

  private createEntry(): void {
    const root = this.createContainer(this.options.entryParent, 'TransformEntryRoot', 104, 116);
    root.setPosition(this.options.entryX, -58, 0);
    this.createSprite(root, 'TransformEntryIcon', this.options.entryImage, 82, 82, 0, 15);
    this.createLabel(root, 'TransformEntryLabel', '变身', 20, 0, -43, 104, 28);
    this.bindTouch(root, () => this.open());
  }

  private createDialog(): Node {
    const root = this.createContainer(this.options.dialogParent, 'TransformDialog', 1280, 720);
    root.setPosition(0, 0, 0);
    root.addComponent(BlockInputEvents);
    const shade = root.addComponent(Graphics);
    shade.fillColor = new Color(3, 19, 34, 205);
    shade.rect(-640, -360, 1280, 720);
    shade.fill();
    const panel = this.createContainer(root, 'TransformPanel', 880, 560);
    const panelGraphics = panel.addComponent(Graphics);
    panelGraphics.fillColor = new Color(15, 73, 111, 252);
    panelGraphics.roundRect(-440, -280, 880, 560, 28);
    panelGraphics.fill();
    this.createLabel(panel, 'TransformTitle', '选择变身形象', 36, 0, 226, 420, 52);
    this.createLabel(panel, 'TransformDescription', '选择后本地与同房间其他玩家都会看到新形象', 22, 0, 184, 720, 38);
    this.createTextButton(panel, 'TransformCloseButton', '关闭', 370, 224, () => this.close(), 100, 48);
    return root;
  }

  private createAppearanceCard(appearance: PlayerAppearanceConfig, index: number): void {
    const x = -205 + index * 410;
    const root = this.createContainer(this.contentRoot, `AppearanceCard-${appearance.id}`, 330, 300);
    root.setPosition(x, 22, 0);
    const selected = this.selectedAppearanceId === appearance.id;
    const border = root.addComponent(Graphics);
    border.lineWidth = selected ? 7 : 3;
    border.strokeColor = selected ? new Color(255, 219, 88, 255) : new Color(99, 183, 222, 230);
    border.roundRect(-160, -142, 320, 284, 22);
    border.stroke();
    const portrait = this.options.portraits.get(appearance.id);
    if (portrait) this.createSprite(root, `AppearancePortrait-${appearance.id}`, portrait, 248, 190, 0, 34);
    this.createLabel(root, `AppearanceName-${appearance.id}`, appearance.displayName, 27, 0, -84, 280, 40);
    this.createLabel(root, `AppearanceState-${appearance.id}`, selected ? '当前形象' : '点击变身', 20, 0, -120, 220, 32);
    this.bindTouch(root, () => {
      if (!this.options.onSelect(appearance.id)) return;
      this.selectedAppearanceId = appearance.id;
      this.refresh();
    });
  }

  private createContainer(parent: Node, name: string, width: number, height: number): Node {
    const node = new Node(name);
    node.layer = parent.layer;
    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, height);
    transform.setAnchorPoint(0.5, 0.5);
    parent.addChild(node);
    return node;
  }

  private createSprite(parent: Node, name: string, image: ImageAsset, width: number, height: number, x: number, y: number): Node {
    const node = this.createContainer(parent, name, width, height);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.spriteFrame = this.createSpriteFrame(image);
    node.setPosition(x, y, 0);
    return node;
  }

  private createLabel(parent: Node, name: string, text: string, fontSize: number, x: number, y: number, width: number, height: number): Label {
    const node = this.createContainer(parent, name, width, height);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 7;
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.color = new Color(255, 255, 255, 255);
    label.useSystemFont = true;
    label.cacheMode = Label.CacheMode.NONE;
    label.enableOutline = true;
    label.outlineColor = new Color(4, 18, 34, 255);
    label.outlineWidth = 2;
    node.setPosition(x, y, 0);
    return label;
  }

  private createTextButton(parent: Node, name: string, text: string, x: number, y: number, action: () => void, width: number, height: number): Node {
    const node = this.createContainer(parent, name, width, height);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = new Color(30, 151, 204, 255);
    graphics.roundRect(-width / 2, -height / 2, width, height, 10);
    graphics.fill();
    this.createLabel(node, `${name}Label`, text, 18, 0, 0, width, height);
    node.setPosition(x, y, 0);
    this.bindTouch(node, action);
    return node;
  }

  private bindTouch(node: Node, action: () => void): void {
    node.on(Node.EventType.TOUCH_START, () => node.setScale(0.94, 0.94, 1));
    node.on(Node.EventType.TOUCH_END, () => { node.setScale(1, 1, 1); action(); });
    node.on(Node.EventType.TOUCH_CANCEL, () => node.setScale(1, 1, 1));
  }

  private createSpriteFrame(image: ImageAsset): SpriteFrame {
    const texture = new Texture2D();
    texture.image = image;
    const frame = new SpriteFrame();
    frame.texture = texture;
    return frame;
  }
}
