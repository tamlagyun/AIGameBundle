import { Color, Graphics, Node, tween, UITransform, Vec3 } from 'cc';

/** 只管理战斗特效的 Cocos 表现，不含技能规则、命中或网络同步。 */
export class CombatEffectPresenter {
  public constructor(private readonly worldRoot: Node) {}
  public playBite(x: number, y: number, angle: number, radius: number, color: Color, duration: number): void {
    const node = this.create('BiteEffect', radius * 2, radius * 2); const graphics = node.addComponent(Graphics); graphics.fillColor = color; graphics.moveTo(0, 0); graphics.arc(0, 0, radius, -0.58, 0.58, false); graphics.close(); graphics.fill(); this.place(node, x, y, angle); tween(node).to(duration, { scale: new Vec3(1.25, 1.25, 1) }).call(() => node.destroy()).start();
  }
  public playDash(x: number, y: number, angle: number): void {
    const node = this.create('DashEffect', 180, 100); const graphics = node.addComponent(Graphics); graphics.fillColor = new Color(90, 220, 255, 150); graphics.ellipse(0, 0, 82, 34); graphics.fill(); this.place(node, x, y, angle); tween(node).to(0.3, { scale: new Vec3(1.5, .55, 1) }).call(() => node.destroy()).start();
  }
  public playInkSplash(x: number, y: number, radius: number, rayCount: number, rayLength: number, color: Color, sprayDuration: number, expansionDelay: number, expansionDuration: number): void {
    const node = this.create('InkSplashEffect', rayLength * 2 + 40, rayLength * 2 + 40); const graphics = node.addComponent(Graphics); graphics.fillColor = color; const count = Math.max(1, Math.floor(rayCount));
    const blob = (cx: number, cy: number, r: number, seed: number): void => { for (let p = 0; p < 9; p += 1) { const a = p * Math.PI * 2 / 9; const wobble = .76 + ((seed * 13 + p * 7) % 11) / 22; const px = cx + Math.cos(a) * r * wobble; const py = cy + Math.sin(a) * r * wobble; if (!p) graphics.moveTo(px, py); else graphics.lineTo(px, py); } graphics.close(); graphics.fill(); };
    for (let i = 0; i < count; i += 1) { const a = i * Math.PI * 2 / count; const dx = Math.cos(a); const dy = Math.sin(a); for (let s = 0; s < 6; s += 1) { const progress = (s + 1) / 6; const distance = rayLength * (.12 + progress * .84); blob(dx * distance, dy * distance, Math.max(7, rayLength * (.047 - progress * .026)), i * 17 + s); } }
    blob(0, 0, Math.max(28, radius * .08), 97); this.place(node, x, y, 0); node.setScale(.05, .05, 1); tween(node).to(Math.max(.05, sprayDuration), { scale: new Vec3(1, 1, 1) }).delay(Math.max(0, expansionDelay)).to(Math.max(.05, expansionDuration), { scale: new Vec3(1.32, 1.32, 1) }).call(() => node.destroy()).start();
  }
  private create(name: string, width: number, height: number): Node { const node = new Node(name); node.layer = this.worldRoot.layer; const transform = node.addComponent(UITransform); transform.setContentSize(width, height); this.worldRoot.addChild(node); return node; }
  private place(node: Node, x: number, y: number, angle: number): void { node.setPosition(x, y, 0); node.angle = angle; }
}
