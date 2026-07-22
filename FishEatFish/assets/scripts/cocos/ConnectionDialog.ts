import { BlockInputEvents, Color, Graphics, Label, Node, UITransform } from 'cc';

export interface ConnectionDialogOptions { parent: Node; onRetry: () => void; onOffline: () => void; }

/** 固定 HUD 层上的联网恢复弹窗，只负责视觉与按钮事件。 */
export class ConnectionDialog {
  private readonly root: Node;
  private readonly detailLabel: Label;

  public constructor(private readonly options: ConnectionDialogOptions) {
    this.root = new Node('NetworkConnectionDialog'); this.root.layer = options.parent.layer;
    const transform = this.root.addComponent(UITransform); transform.setContentSize(1280, 720); transform.setAnchorPoint(0.5, 0.5); this.root.addComponent(BlockInputEvents); options.parent.addChild(this.root); this.root.setPosition(0, 0, 0);
    const shade = this.root.addComponent(Graphics); shade.fillColor = new Color(0, 20, 45, 190); shade.rect(-640, -360, 1280, 720); shade.fill();
    const panel = new Node('ConnectionPanel'); panel.layer = this.root.layer; const panelTransform = panel.addComponent(UITransform); panelTransform.setContentSize(600, 330); panelTransform.setAnchorPoint(0.5, 0.5); const panelGraphics = panel.addComponent(Graphics); panelGraphics.fillColor = new Color(17, 69, 106, 248); panelGraphics.roundRect(-300, -165, 600, 330, 24); panelGraphics.fill(); this.root.addChild(panel);
    this.createLabel(panel, '联网服务不可用', 30, new Color(255, 245, 180, 255), 0, 78).name = 'ConnectionTitle';
    this.createLabel(panel, '可继续尝试连接，或进入本地单机模式。', 20, new Color(230, 245, 255, 255), 0, 30);
    this.detailLabel = this.createLabel(panel, '', 14, new Color(180, 225, 255, 255), 0, -18).getComponent(Label)!; this.detailLabel.overflow = Label.Overflow.SHRINK;
    this.createButton(panel, '重新连接', -115, -112, options.onRetry).name = 'RetryConnectionButton';
    this.createButton(panel, '本地单机游玩', 115, -112, options.onOffline).name = 'OfflineModeButton';
    this.root.active = false;
  }
  public show(detail: string): void { this.detailLabel.string = detail; this.root.active = true; }
  public hide(): void { this.root.active = false; }
  public destroy(): void { this.root.destroy(); }
  private createLabel(parent: Node, text: string, size: number, color: Color, x: number, y: number): Node { const node = new Node('DialogLabel'); node.layer = parent.layer; const t = node.addComponent(UITransform); t.setContentSize(460, 42); t.setAnchorPoint(0.5, 0.5); const label = node.addComponent(Label); label.string = text; label.fontSize = size; label.lineHeight = size + 8; label.horizontalAlign = Label.HorizontalAlign.CENTER; label.color = color; parent.addChild(node); node.setPosition(x, y, 0); return node; }
  private createButton(parent: Node, text: string, x: number, y: number, action: () => void): Node { const node = new Node(`DialogButton-${text}`); node.layer = parent.layer; const t = node.addComponent(UITransform); t.setContentSize(190, 64); t.setAnchorPoint(0.5, 0.5); const g = node.addComponent(Graphics); g.fillColor = new Color(36,153,200,255); g.roundRect(-95,-32,190,64,16); g.fill(); parent.addChild(node); node.setPosition(x,y,0); this.createLabel(node,text,20,new Color(255,255,255,255),0,0); node.on(Node.EventType.TOUCH_START,()=>node.setScale(.92,.92,1)); node.on(Node.EventType.TOUCH_CANCEL,()=>node.setScale(1,1,1)); node.on(Node.EventType.TOUCH_END,()=>{node.setScale(1,1,1);action();}); return node; }
}
