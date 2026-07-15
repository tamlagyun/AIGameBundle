import {
  _decorator,
  BlockInputEvents,
  Color,
  Component,
  EditBox,
  EventKeyboard,
  EventTouch,
  ImageAsset,
  input,
  Input,
  KeyCode,
  Label,
  Graphics,
  Node,
  resources,
  ResolutionPolicy,
  Sprite,
  SpriteFrame,
  Texture2D,
  UITransform,
  Vec2,
  Vec3,
  view,
  Widget,
  tween
} from 'cc';
import { movementAngleDegrees, moveWithinBounds } from '../core/MovementSystem.ts';
import { createPlatformService } from '../platform/PlatformAdapters.ts';
import { RealtimeSession } from '../network/RealtimeSession.ts';
import { RemotePlayerRegistry } from '../network/RemotePlayerRegistry.ts';
import { resolveNetworkEndpoint } from '../network/NetworkEnvironment.ts';
import type { NetworkMessage, RemotePlayerState, SkillEffect, SkillResolved, PlayerDamaged, PlayerDied, PlayerRespawned, CombatSettlement } from '../network/NetworkProtocol.ts';

const { ccclass } = _decorator;

@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
  private static readonly WORLD_WIDTH = 3840;
  private static readonly WORLD_HEIGHT = 2160;
  private static readonly PLAYER_SPEED = 260;
  private static readonly PLAYER_MARGIN = 96;
  private static readonly JOYSTICK_RADIUS = 120;

  private removePauseListener?: () => void;
  private removeResumeListener?: () => void;
  private playerNode?: Node;
  private playerSprite?: Sprite;
  private cameraNode?: Node;
  private hudRoot?: Node;
  private actionHint?: Label;
  private healthLabel?: Label;
  private fishHealthOverlay?: Node;
  private readonly fishHealthDisplays = new Map<string, { fish: Node; node: Node; label: Label }>();
  private readonly fishNameDisplays = new Map<string, { fish: Node; node: Node; label: Label }>();
  private skillCooldownRemaining = 0;
  private basicCooldownRemaining = 0;
  private joystickKnob?: Node;
  private joystickNode?: Node;
  private swimFrames: SpriteFrame[] = [];
  private swimFrameIndex = 0;
  private animationElapsed = 0;
  private fishActionState: 'swim' | 'bite' | 'dashBite' = 'swim';
  private fishActionElapsed = 0;
  private fishActionDuration = 0;
  private localHealth = 100;
  private localMaxHealth = 100;
  private localDead = false;
  private readonly pressedKeys = new Set<KeyCode>();
  private joystickTouchId: number | null = null;
  private readonly joystickOrigin = new Vec2();
  private readonly joystickDirection = new Vec2();
  private readonly realtime = new RealtimeSession();
  private remotePlayers?: RemotePlayerRegistry;
  private networkPlayerId?: string;
  private networkClientTick = 0;
  private networkInputElapsed = 0;
  private connectionDialog?: Node;
  private connectionDetailLabel?: Label;
  private connectionDetail = '';
  private offlineModeSelected = false;
  private isDestroying = false;
  private loginDom?: HTMLElement;
  private loginDialog?: Node;
  private testUsername = '';

  protected async start(): Promise<void> {
    view.setDesignResolutionSize(1280, 720, ResolutionPolicy.SHOW_ALL);
    const platform = createPlatformService('web');
    await platform.init();
    this.removePauseListener = platform.onPause(() => this.node.pauseSystemEvents(true));
    this.removeResumeListener = platform.onResume(() => this.node.resumeSystemEvents(true));
    await this.createOceanWorld();
    this.bindInput();
    this.showTestLoginDialog();
  }

  protected onDestroy(): void {
    this.isDestroying = true;
    this.unbindInput();
    this.removePauseListener?.();
    this.removeResumeListener?.();
    this.realtime.close();
    this.remotePlayers?.clear();
    this.fishHealthDisplays.clear();
    this.fishNameDisplays.clear();
    this.loginDom?.remove();
  }

  protected update(deltaTime: number): void {
    if (!this.playerNode || !this.playerSprite || !this.cameraNode) return;
    this.skillCooldownRemaining = Math.max(0, this.skillCooldownRemaining - deltaTime);
    this.basicCooldownRemaining = Math.max(0, this.basicCooldownRemaining - deltaTime);
    if (this.localDead) { this.updateFishHealthDisplays(); return; }

    const keyboard = this.readKeyboardDirection();
    const direction = {
      x: keyboard.x + this.joystickDirection.x,
      y: keyboard.y + this.joystickDirection.y
    };
    const moving = Math.hypot(direction.x, direction.y) > 0.01;
    const current = this.playerNode.position;
    const next = moveWithinBounds(
      { x: current.x, y: current.y },
      direction,
      GameBootstrap.PLAYER_SPEED,
      deltaTime,
      {
        minX: -GameBootstrap.WORLD_WIDTH / 2 + GameBootstrap.PLAYER_MARGIN,
        maxX: GameBootstrap.WORLD_WIDTH / 2 - GameBootstrap.PLAYER_MARGIN,
        minY: -GameBootstrap.WORLD_HEIGHT / 2 + GameBootstrap.PLAYER_MARGIN,
        maxY: GameBootstrap.WORLD_HEIGHT / 2 - GameBootstrap.PLAYER_MARGIN
      }
    );
    this.playerNode.setPosition(next.x, next.y, 0);

    const movementAngle = movementAngleDegrees(direction);
    if (movementAngle !== null) this.playerNode.angle = movementAngle;
    this.advanceSwimAnimation(deltaTime, moving);
    this.updateFishAction(deltaTime);
    this.followPlayer(next.x, next.y);
    this.updateFishHealthDisplays();
    this.networkInputElapsed += deltaTime;
    if (this.networkInputElapsed >= 0.05) {
      this.networkInputElapsed = 0;
      this.realtime.sendInput({ clientTick: ++this.networkClientTick, moveX: direction.x, moveY: direction.y, rotation: this.playerNode.angle });
    }
  }

  private async createOceanWorld(): Promise<void> {
    const worldRoot = this.node.getChildByName('WorldRoot');
    const playerLayer = worldRoot?.getChildByName('PlayerLayer');
    this.cameraNode = worldRoot?.getChildByName('MainCamera');
    this.hudRoot = this.node.getChildByName('HudRoot');
    if (!worldRoot || !playerLayer || !this.cameraNode || !this.hudRoot) {
      throw new Error('MainScene 缺少世界、玩家、镜头或 HUD 节点。');
    }
    // HUD 使用屏幕坐标，不能跟随世界相机移动。
    this.hudRoot.setPosition(-640, -360, 0);
    const safeArea = this.hudRoot.getChildByName('SafeAreaRoot');
    const inputLayer = safeArea?.getChildByName('InputLayer');
    if (inputLayer) {
      const uiTransform = inputLayer.getComponent(UITransform) ?? inputLayer.addComponent(UITransform);
      uiTransform.setAnchorPoint(0.5, 0.5);
      uiTransform.setContentSize(1280, 720);
      inputLayer.setPosition(0, 0, 0);
      this.fishHealthOverlay = this.createUiContainer(inputLayer, 'FishHealthOverlay', 1280, 720);
      this.fishHealthOverlay.getComponent(UITransform)?.setAnchorPoint(0.5, 0.5);
      this.fishHealthOverlay.setPosition(0, 0, 0);
    }

    const [backgroundImage, ...images] = await Promise.all([
      this.loadImage('art/map/sea-background'),
      ...Array.from({ length: 6 }, (_, index) => this.loadImage(`art/characters/player/swim-${index}`)),
      this.loadImage('art/ui/joystick-base'),
      this.loadImage('art/ui/joystick-knob'),
      this.loadImage('art/ui/basic-attack'),
      this.loadImage('art/ui/skill-dash')
    ]);
    const fishImages = images.slice(0, 6);
    const [joystickBase, joystickKnob, basicAttack, skillDash] = images.slice(6);

    const background = new Node('OceanMap');
    background.layer = worldRoot.layer;
    const backgroundTransform = background.addComponent(UITransform);
    backgroundTransform.setContentSize(GameBootstrap.WORLD_WIDTH, GameBootstrap.WORLD_HEIGHT);
    const backgroundSprite = background.addComponent(Sprite);
    backgroundSprite.sizeMode = Sprite.SizeMode.CUSTOM;
    backgroundSprite.spriteFrame = this.createSpriteFrame(backgroundImage);
    worldRoot.addChild(background);
    background.setSiblingIndex(0);

    this.swimFrames = fishImages.map((image) => this.createSpriteFrame(image));
    this.playerNode = new Node('PlayerFish');
    this.playerNode.layer = playerLayer.layer;
    const playerTransform = this.playerNode.addComponent(UITransform);
    playerTransform.setContentSize(196, 196);
    this.playerSprite = this.playerNode.addComponent(Sprite);
    this.playerSprite.sizeMode = Sprite.SizeMode.CUSTOM;
    this.playerSprite.spriteFrame = this.swimFrames[0];
    playerLayer.addChild(this.playerNode);
    this.createFishHealthDisplay('local-player', this.playerNode, this.localHealth, this.localMaxHealth);
    this.createFishNameDisplay('local-player', this.playerNode, '');
    this.remotePlayers = new RemotePlayerRegistry((state) => this.createRemotePlayerView(playerLayer, state));

    this.createControlHint(this.hudRoot);
    this.createCombatUi(this.hudRoot, joystickBase, joystickKnob, basicAttack, skillDash);
  }

  private createRemotePlayerView(parent: Node, state: RemotePlayerState) {
    const node = new Node(`RemotePlayer-${state.playerId}`);
    node.layer = parent.layer;
    const transform = node.addComponent(UITransform);
    transform.setContentSize(196, 196);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.spriteFrame = this.swimFrames[0];
    parent.addChild(node);
    this.createFishHealthDisplay(state.playerId, node, state.health, state.maxHealth);
    this.createFishNameDisplay(state.playerId, node, state.displayName);
    return { setPosition: (x: number, y: number) => node.setPosition(x, y, 0), setRotation: (angle: number) => { node.angle = angle; }, setHealth: (health: number, maxHealth: number) => this.setFishHealth(state.playerId, health, maxHealth), playSkill: (skillId: string) => { const scale = skillId === 'skill-dash-bite' ? 1.45 : 1.28; const angle = node.angle * Math.PI / 180; if (skillId === 'skill-dash-bite') this.createDashEffect(node.position.x, node.position.y, node.angle); this.createBiteEffect(node.position.x + Math.cos(angle) * 76, node.position.y + Math.sin(angle) * 76, node.angle, skillId === 'skill-dash-bite' ? 96 : 72, skillId === 'skill-dash-bite' ? new Color(120, 230, 255, 235) : new Color(255, 236, 120, 235), 0.2); tween(node).to(0.12, { scale: new Vec3(scale, 0.72, 1) }).to(0.18, { scale: new Vec3(1, 1, 1) }).start(); }, playHurt: () => { const original = sprite.color.clone(); sprite.color = new Color(255, 110, 110, 255); this.scheduleOnce(() => { if (sprite.isValid) sprite.color = original; }, 0.12); }, playDeath: () => { node.active = true; node.setScale(1, 1, 1); tween(node).to(0.25, { scale: new Vec3(0.6, 0.6, 1) }).start(); }, playRespawn: () => { node.active = true; node.setScale(1, 1, 1); }, destroy: () => { this.removeFishHealthDisplay(state.playerId); this.removeFishNameDisplay(state.playerId); node.destroy(); } };
  }

  private createFishHealthDisplay(id: string, fish: Node, health: number, maxHealth: number): void {
    if (!this.fishHealthOverlay || this.fishHealthDisplays.has(id)) return;
    const node = new Node(`FishHealth-${id}`); node.layer = this.fishHealthOverlay.layer;
    const transform = node.addComponent(UITransform); transform.setContentSize(132, 28);
    const label = node.addComponent(Label); label.fontSize = 18; label.lineHeight = 22; label.color = new Color(255, 245, 180, 255);
    this.fishHealthOverlay.addChild(node);
    this.fishHealthDisplays.set(id, { fish, node, label });
    this.setFishHealth(id, health, maxHealth);
  }

  private setFishHealth(id: string, health: number, maxHealth: number): void {
    const display = this.fishHealthDisplays.get(id); if (!display) return;
    display.label.string = `HP ${Math.max(0, Math.ceil(health))}/${maxHealth}`;
    display.label.color = health > maxHealth * 0.35 ? new Color(255, 245, 180, 255) : new Color(255, 130, 130, 255);
  }

  private removeFishHealthDisplay(id: string): void { const display = this.fishHealthDisplays.get(id); display?.node.destroy(); this.fishHealthDisplays.delete(id); }

  private createFishNameDisplay(id: string, fish: Node, name: string): void {
    if (!this.fishHealthOverlay || this.fishNameDisplays.has(id)) return;
    const node = new Node(`FishName-${id}`); node.layer = this.fishHealthOverlay.layer;
    const transform = node.addComponent(UITransform); transform.setContentSize(180, 30);
    const label = node.addComponent(Label); label.fontSize = 20; label.lineHeight = 24; label.horizontalAlign = Label.HorizontalAlign.CENTER; label.color = new Color(255, 255, 255, 255);
    this.fishHealthOverlay.addChild(node); this.fishNameDisplays.set(id, { fish, node, label }); this.setFishName(id, name);
  }

  private setFishName(id: string, name: string): void { const display = this.fishNameDisplays.get(id); if (display) display.label.string = name; }
  private removeFishNameDisplay(id: string): void { const display = this.fishNameDisplays.get(id); display?.node.destroy(); this.fishNameDisplays.delete(id); }

  private updateFishHealthDisplays(): void {
    const overlayTransform = this.fishHealthOverlay?.getComponent(UITransform); if (!overlayTransform) return;
    for (const display of this.fishHealthDisplays.values()) {
      const world = display.fish.worldPosition.clone(); world.y += 118;
      const screen = overlayTransform.convertToNodeSpaceAR(world);
      display.node.setPosition(screen.x, screen.y, 0);
      display.node.angle = 0;
    }
    for (const display of this.fishNameDisplays.values()) {
      const world = display.fish.worldPosition.clone(); world.y += 146;
      const screen = overlayTransform.convertToNodeSpaceAR(world);
      display.node.setPosition(screen.x, screen.y, 0);
      display.node.angle = 0;
    }
  }

  private async connectOnline(username = this.testUsername): Promise<void> {
    if (this.offlineModeSelected || this.isDestroying) return;
    try {
      const endpoint = resolveNetworkEndpoint();
      const baseUrl = endpoint.httpBaseUrl;
      const runtime = typeof window !== 'undefined' ? window.location.href : 'no-window-runtime';
      this.setConnectionDiagnostic(`runtime=${runtime}\nHTTP=${baseUrl}`);
      const authResponse = await fetch(`${baseUrl}/auth/test-login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username }) });
      if (!authResponse.ok) throw new Error(`AUTH_FAILED status=${authResponse.status}`);
      const auth = await authResponse.json() as { token: string };
      const matchResponse = await fetch(`${baseUrl}/match/join`, { method: 'POST', headers: { authorization: `Bearer ${auth.token}`, 'content-type': 'application/json' }, body: JSON.stringify({ mapId: 'sea-default-001' }) });
      if (!matchResponse.ok) throw new Error(`MATCH_FAILED status=${matchResponse.status}`);
      this.realtime.onMessage = (message) => this.handleNetworkMessage(message);
      this.realtime.onDiagnostic = (detail) => this.setConnectionDiagnostic(detail);
      this.realtime.onStatus = (status) => {
        if (status === 'open') { this.realtime.join(); this.hideConnectionDialog(); }
        if ((status === 'error' || status === 'closed') && !this.isDestroying && !this.offlineModeSelected) this.showConnectionDialog('在线服务连接已断开');
      };
      this.realtime.connect(endpoint.websocketUrl, auth.token);
      if (this.actionHint) this.actionHint.string = '已连接默认海域';
    } catch (error) { this.setConnectionDiagnostic(`Connection failed: ${error instanceof Error ? error.message : String(error)}`); this.showConnectionDialog('无法连接在线服务'); }
  }

  private setConnectionDiagnostic(detail: string): void { this.connectionDetail = detail; console.warn(`[FishEatFish] ${detail}`); if (this.connectionDetailLabel) this.connectionDetailLabel.string = detail; }

  private showTestLoginDialog(): void {
    if (typeof window !== 'undefined' && window.location.hostname === 'scene') {
      this.showEditorTestLoginDialog();
      return;
    }
    if (typeof document !== 'undefined') {
      if (this.loginDom) return;
      const overlay = document.createElement('div');
      overlay.id = 'fish-eat-fish-test-login';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(0,20,45,.74);font-family:Arial,"Microsoft YaHei",sans-serif;';
      const panel = document.createElement('div');
      panel.style.cssText = 'width:420px;max-width:calc(100vw - 48px);padding:32px;border-radius:20px;background:#11456a;color:#fff;box-shadow:0 16px 48px rgba(0,0,0,.45);text-align:center;box-sizing:border-box;';
      panel.innerHTML = '<div style="font-size:28px;font-weight:700;color:#fff5b4;margin-bottom:12px;">测试环境登录</div><div style="font-size:18px;margin-bottom:22px;">输入用户名后进入默认海域</div>';
      const input = document.createElement('input');
      input.type = 'text'; input.maxLength = 16; input.placeholder = '用户名（1-16 个字符）'; input.value = this.testUsername;
      input.style.cssText = 'display:block;width:100%;height:52px;padding:0 16px;box-sizing:border-box;border:0;border-radius:10px;background:#fff;color:#124260;font-size:20px;outline:none;';
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = '进入海域'; button.style.cssText = 'margin-top:22px;width:190px;height:56px;border:0;border-radius:14px;background:#2499c8;color:#fff;font-size:20px;cursor:pointer;';
      const submit = () => { const username = input.value.trim(); if (!username) { input.focus(); return; } this.testUsername = username; this.setFishName('local-player', username); overlay.remove(); this.loginDom = undefined; void this.connectOnline(username); };
      button.onclick = submit; input.onkeydown = (event) => { if (event.key === 'Enter') submit(); };
      panel.append(input, button); overlay.appendChild(panel); document.body.appendChild(overlay); input.focus(); this.loginDom = overlay;
      return;
    }
    if (this.loginDialog) return;
    const canvas = this.node;
    const canvasTransform = canvas.getComponent(UITransform);
    if (!canvasTransform) return;
    const canvasWidth = canvasTransform.width;
    const canvasHeight = canvasTransform.height;
    const dialog = new Node('TestLoginDialog'); dialog.layer = canvas.layer;
    const dialogTransform = dialog.addComponent(UITransform); dialogTransform.setContentSize(canvasWidth, canvasHeight); dialogTransform.setAnchorPoint(0, 0); dialog.addComponent(BlockInputEvents); canvas.addChild(dialog); dialog.setPosition(-canvasWidth / 2, -canvasHeight / 2, 0);
    const shade = dialog.addComponent(Graphics); shade.fillColor = new Color(0, 20, 45, 190); shade.rect(0, 0, canvasWidth, canvasHeight); shade.fill();
    const panel = new Node('TestLoginPanel'); panel.layer = dialog.layer; const panelTransform = panel.addComponent(UITransform); panelTransform.setContentSize(520, 300); panelTransform.setAnchorPoint(0.5, 0.5); const panelGraphics = panel.addComponent(Graphics); panelGraphics.fillColor = new Color(17, 69, 106, 248); panelGraphics.roundRect(-260, -150, 520, 300, 24); panelGraphics.fill(); dialog.addChild(panel); panel.setPosition(canvasWidth / 2, canvasHeight / 2, 0);
    const panelWidget = panel.addComponent(Widget); panelWidget.isAlignHorizontalCenter = true; panelWidget.isAlignVerticalCenter = true; panelWidget.horizontalCenter = 0; panelWidget.verticalCenter = 0; panelWidget.updateAlignment();
    this.createDialogLabel(panel, '测试环境登录', 30, new Color(255, 245, 180, 255), 0, 88);
    this.createDialogLabel(panel, '输入用户名后进入默认海域', 20, new Color(230, 245, 255, 255), 0, 42);
    const usernameBackground = new Node('UsernameInputBackground'); usernameBackground.layer = panel.layer; const usernameBackgroundTransform = usernameBackground.addComponent(UITransform); usernameBackgroundTransform.setContentSize(360, 56); usernameBackgroundTransform.setAnchorPoint(0.5, 0.5); const usernameGraphics = usernameBackground.addComponent(Graphics); usernameGraphics.fillColor = new Color(255, 255, 255, 245); usernameGraphics.roundRect(-180, -28, 360, 56, 12); usernameGraphics.fill(); panel.addChild(usernameBackground); usernameBackground.setPosition(0, -12, 0);
    const usernameNode = new Node('UsernameInput'); usernameNode.layer = panel.layer; const usernameTransform = usernameNode.addComponent(UITransform); usernameTransform.setContentSize(340, 46); usernameTransform.setAnchorPoint(0.5, 0.5); const usernameInput = usernameNode.addComponent(EditBox); usernameInput.placeholder = '用户名（1-16 个字符）'; usernameInput.maxLength = 16; usernameInput.fontSize = 22; usernameInput.fontColor = new Color(18, 66, 96, 255); usernameInput.placeholderFontSize = 20; usernameInput.placeholderFontColor = new Color(100, 132, 152, 255); usernameInput.string = this.testUsername; usernameBackground.addChild(usernameNode); usernameNode.setPosition(0, 0, 0);
    const submit = () => { const username = usernameInput.string.trim(); if (!username) { this.actionHint && (this.actionHint.string = '请输入用户名'); return; } this.testUsername = username; this.setFishName('local-player', username); dialog.destroy(); this.loginDialog = undefined; void this.connectOnline(username); };
    const enter = this.createDialogButton(panel, '进入海域', 0, -96, submit); enter.name = 'TestLoginSubmitButton';
    this.loginDialog = dialog;
  }

  private showEditorTestLoginDialog(): void {
    if (this.loginDialog) return;
    const inputLayer = this.hudRoot?.getChildByName('SafeAreaRoot')?.getChildByName('InputLayer');
    if (!inputLayer) return;
    const dialog = new Node('EditorTestLoginDialog'); dialog.layer = inputLayer.layer;
    const dialogTransform = dialog.addComponent(UITransform); dialogTransform.setContentSize(1280, 720); dialogTransform.setAnchorPoint(0.5, 0.5); dialog.addComponent(BlockInputEvents); inputLayer.addChild(dialog); dialog.setPosition(0, 0, 0);
    const shade = dialog.addComponent(Graphics); shade.fillColor = new Color(0, 20, 45, 190); shade.rect(-640, -360, 1280, 720); shade.fill();
    const panel = new Node('EditorTestLoginPanel'); panel.layer = dialog.layer; const panelTransform = panel.addComponent(UITransform); panelTransform.setContentSize(520, 300); panelTransform.setAnchorPoint(0.5, 0.5); const panelGraphics = panel.addComponent(Graphics); panelGraphics.fillColor = new Color(17, 69, 106, 248); panelGraphics.roundRect(-260, -150, 520, 300, 24); panelGraphics.fill(); dialog.addChild(panel); panel.setPosition(0, 0, 0);
    this.createDialogLabel(panel, '测试环境登录', 30, new Color(255, 245, 180, 255), 0, 88);
    this.createDialogLabel(panel, '输入用户名后进入默认海域', 20, new Color(230, 245, 255, 255), 0, 42);
    const background = new Node('EditorUsernameBackground'); background.layer = panel.layer; const backgroundTransform = background.addComponent(UITransform); backgroundTransform.setContentSize(360, 56); backgroundTransform.setAnchorPoint(0.5, 0.5); const backgroundGraphics = background.addComponent(Graphics); backgroundGraphics.fillColor = new Color(255, 255, 255, 245); backgroundGraphics.roundRect(-180, -28, 360, 56, 12); backgroundGraphics.fill(); panel.addChild(background); background.setPosition(0, -12, 0);
    const inputNode = new Node('EditorUsernameInput'); inputNode.layer = panel.layer; const inputTransform = inputNode.addComponent(UITransform); inputTransform.setContentSize(340, 46); inputTransform.setAnchorPoint(0.5, 0.5); const usernameInput = inputNode.addComponent(EditBox); usernameInput.placeholder = '用户名（1-16 个字符）'; usernameInput.maxLength = 16; usernameInput.fontSize = 22; usernameInput.fontColor = new Color(18, 66, 96, 255); usernameInput.placeholderFontSize = 20; usernameInput.placeholderFontColor = new Color(100, 132, 152, 255); usernameInput.string = this.testUsername; background.addChild(inputNode); inputNode.setPosition(0, 0, 0);
    const submit = () => { const username = usernameInput.string.trim(); if (!username) { this.actionHint && (this.actionHint.string = '请输入用户名'); return; } this.testUsername = username; this.setFishName('local-player', username); dialog.destroy(); this.loginDialog = undefined; void this.connectOnline(username); };
    const submitButton = this.createDialogButton(panel, '进入海域', 0, -96, submit); submitButton.name = 'EditorTestLoginSubmitButton';
    this.loginDialog = dialog;
  }

  private showConnectionDialog(reason: string): void {
    if (this.offlineModeSelected || this.isDestroying) return;
    this.actionHint && (this.actionHint.string = reason);
    if (this.connectionDialog) { this.connectionDialog.active = true; return; }
    const inputLayer = this.hudRoot?.getChildByName('SafeAreaRoot')?.getChildByName('InputLayer');
    if (!inputLayer) return;
    const dialog = new Node('NetworkConnectionDialog'); dialog.layer = inputLayer.layer;
    const dialogTransform = dialog.addComponent(UITransform); dialogTransform.setContentSize(1280, 720); dialogTransform.setAnchorPoint(0.5, 0.5); dialog.addComponent(BlockInputEvents); inputLayer.addChild(dialog); dialog.setPosition(0, 0, 0);
    const shade = dialog.addComponent(Graphics); shade.fillColor = new Color(0, 20, 45, 190); shade.rect(-640, -360, 1280, 720); shade.fill();
    const panel = new Node('ConnectionPanel'); panel.layer = dialog.layer; const panelTransform = panel.addComponent(UITransform); panelTransform.setContentSize(600, 330); panelTransform.setAnchorPoint(0.5, 0.5); const panelGraphics = panel.addComponent(Graphics); panelGraphics.fillColor = new Color(17, 69, 106, 248); panelGraphics.roundRect(-300, -165, 600, 330, 24); panelGraphics.fill(); dialog.addChild(panel);
    const title = this.createDialogLabel(panel, '联网服务不可用', 30, new Color(255, 245, 180, 255), 0, 78);
    title.name = 'ConnectionTitle';
    this.createDialogLabel(panel, '可继续尝试连接，或进入本地单机模式。', 20, new Color(230, 245, 255, 255), 0, 30);
    const detailNode = this.createDialogLabel(panel, this.connectionDetail || reason, 14, new Color(180, 225, 255, 255), 0, -18); const detailLabel = detailNode.getComponent(Label); if (detailLabel) { detailLabel.overflow = Label.Overflow.SHRINK; this.connectionDetailLabel = detailLabel; }
    const retry = this.createDialogButton(panel, '重新连接', -115, -112, () => { this.hideConnectionDialog(); this.realtime.close(); void this.connectOnline(); });
    const offline = this.createDialogButton(panel, '本地单机游玩', 115, -112, () => { this.offlineModeSelected = true; this.realtime.close(); this.hideConnectionDialog(); if (this.actionHint) this.actionHint.string = '当前为本地单机模式'; });
    retry.name = 'RetryConnectionButton'; offline.name = 'OfflineModeButton'; this.connectionDialog = dialog;
  }

  private hideConnectionDialog(): void { if (this.connectionDialog) this.connectionDialog.active = false; }

  private createDialogLabel(parent: Node, text: string, fontSize: number, color: Color, x: number, y: number): Node {
    const node = new Node('DialogLabel'); node.layer = parent.layer; const transform = node.addComponent(UITransform); transform.setContentSize(460, 42); transform.setAnchorPoint(0.5, 0.5); const label = node.addComponent(Label); label.string = text; label.fontSize = fontSize; label.lineHeight = fontSize + 8; label.horizontalAlign = Label.HorizontalAlign.CENTER; label.color = color; parent.addChild(node); node.setPosition(x, y, 0); return node;
  }

  private createDialogButton(parent: Node, text: string, x: number, y: number, action: () => void): Node {
    const node = new Node(`DialogButton-${text}`); node.layer = parent.layer; const transform = node.addComponent(UITransform); transform.setContentSize(190, 64); transform.setAnchorPoint(0.5, 0.5); const graphics = node.addComponent(Graphics); graphics.fillColor = new Color(36, 153, 200, 255); graphics.roundRect(-95, -32, 190, 64, 16); graphics.fill(); parent.addChild(node); node.setPosition(x, y, 0); this.createDialogLabel(node, text, 20, new Color(255, 255, 255, 255), 0, 0); this.bindActionButton(node, action); return node;
  }

  private handleNetworkMessage(message: NetworkMessage): void {
    if (message.type === 'roomSnapshot') {
      const snapshot = message.payload as { selfPlayerId?: string; players: RemotePlayerState[] };
      this.networkPlayerId = snapshot.selfPlayerId;
      const self = snapshot.players.find((player) => player.playerId === this.networkPlayerId);
      if (self) this.setFishName('local-player', self.displayName);
      this.applyRemotePlayers(snapshot.players);
    } else if (message.type === 'stateSnapshot') {
      const snapshot = message.payload as { players: RemotePlayerState[] };
      this.applyRemotePlayers(snapshot.players);
    } else if (message.type === 'playerJoined') {
      const player = message.payload as RemotePlayerState;
      if (player.playerId !== this.networkPlayerId) this.remotePlayers?.upsert(player);
    } else if (message.type === 'playerRemoved') {
      this.remotePlayers?.remove((message.payload as { playerId: string }).playerId);
    } else if (message.type === 'skillEffect') {
      const effect = message.payload as SkillEffect;
      if (effect.playerId !== this.networkPlayerId) {
        this.remotePlayers?.upsert({ playerId: effect.playerId, displayName: '远端玩家', x: effect.x, y: effect.y, rotation: effect.rotation, lastProcessedClientTick: effect.clientTick, health: 100, maxHealth: 100, level: 1, dead: false });
        this.remotePlayers?.playSkill(effect.playerId, effect.skillId);
      }
    } else if (message.type === 'skillResolved') {
      const result = message.payload as SkillResolved;
      if (result.playerId === this.networkPlayerId && this.actionHint) {
        if (!result.reason) this.actionHint.string = result.hitCount > 0 ? `命中 ${result.hitCount} 名玩家` : '未命中：靠近并面向对方后再撕咬';
        else if (result.reason === 'cooldown') this.actionHint.string = '技能冷却中';
        else if (result.reason === 'dead') this.actionHint.string = '死亡期间不能攻击';
        else this.actionHint.string = '攻击输入已过期，请重新释放';
      }
    } else if (message.type === 'playerDamaged') {
      const event = message.payload as PlayerDamaged;
      if (event.targetId === this.networkPlayerId) { this.localHealth = event.health; this.localMaxHealth = event.maxHealth; this.updateHealthHud(); this.actionHint && (this.actionHint.string = `受到撕咬伤害：${event.damage}，生命 ${event.health}/${event.maxHealth}`); this.startFishAction('bite', 0.2); }
      else { this.remotePlayers?.setHealth(event.targetId, event.health, event.maxHealth); this.remotePlayers?.playHurt(event.targetId); }
    } else if (message.type === 'playerDied') {
      const event = message.payload as PlayerDied;
      if (event.targetId === this.networkPlayerId) { this.localDead = true; this.playerNode?.setScale(0.6, 0.6, 1); this.actionHint && (this.actionHint.string = '你已被击败，3 秒后复活'); }
      else this.remotePlayers?.playDeath(event.targetId);
    } else if (message.type === 'playerRespawned') {
      const event = message.payload as PlayerRespawned;
      if (event.playerId === this.networkPlayerId) { this.localDead = false; this.localHealth = event.health; this.localMaxHealth = event.maxHealth; this.updateHealthHud(); this.playerNode?.setScale(1, 1, 1); this.playerNode?.setPosition(event.x, event.y, 0); this.actionHint && (this.actionHint.string = '已复活，3 秒无敌'); }
      else { this.remotePlayers?.upsert({ playerId: event.playerId, displayName: '远端玩家', x: event.x, y: event.y, rotation: 0, lastProcessedClientTick: 0, health: event.health, maxHealth: event.maxHealth, level: 1, dead: false }); this.remotePlayers?.playRespawn(event.playerId); }
    } else if (message.type === 'combatSettlement') {
      const event = message.payload as CombatSettlement;
      if (event.playerId === this.networkPlayerId) { this.localHealth = event.health; this.localMaxHealth = event.maxHealth; this.updateHealthHud(); this.actionHint && (this.actionHint.string = event.leveled ? `击败玩家，升级至 ${event.level} 级，生命上限 ${event.maxHealth}` : `击败玩家，获得经验，击杀 ${event.kills}`); }
    } else if (message.type === 'stateCorrection') {
      const state = message.payload as RemotePlayerState;
      if (state.playerId === this.networkPlayerId) { this.localHealth = state.health; this.localMaxHealth = state.maxHealth; this.localDead = state.dead; this.updateHealthHud(); this.playerNode?.setPosition(state.x, state.y, 0); if (this.playerNode) { this.playerNode.angle = state.rotation; this.playerNode.active = true; } }
    }
  }

  private applyRemotePlayers(players: RemotePlayerState[]): void {
    const seen = new Set<string>();
    for (const player of players) if (player.playerId !== this.networkPlayerId) { seen.add(player.playerId); this.remotePlayers?.upsert(player); }
    for (const id of this.remotePlayers?.ids() ?? []) if (!seen.has(id)) this.remotePlayers?.remove(id);
  }

  private createControlHint(hudRoot: Node): void {
    const hintNode = new Node('ControlHint');
    hintNode.layer = hudRoot.layer;
    const transform = hintNode.addComponent(UITransform);
    transform.setContentSize(720, 48);
    transform.setAnchorPoint(0, 1);
    const label = hintNode.addComponent(Label);
    this.actionHint = label;
    label.string = 'WASD / 方向键，或在屏幕左侧拖动游泳';
    label.fontSize = 25;
    label.lineHeight = 32;
    label.color = new Color(255, 255, 255, 230);
    hudRoot.addChild(hintNode);
    hintNode.setPosition(28, 690, 0);
    const healthNode = new Node('HealthLabel'); const healthTransform = healthNode.addComponent(UITransform); healthTransform.setContentSize(260, 36); this.healthLabel = healthNode.addComponent(Label); this.healthLabel.fontSize = 22; this.healthLabel.color = new Color(255, 245, 180, 245); hudRoot.addChild(healthNode); healthNode.setPosition(28, 648, 0); this.updateHealthHud();
  }

  private updateHealthHud(): void { if (this.healthLabel) this.healthLabel.string = `生命 ${Math.max(0, Math.ceil(this.localHealth))}/${this.localMaxHealth}`; this.setFishHealth('local-player', this.localHealth, this.localMaxHealth); }

  private createCombatUi(hudRoot: Node, base: ImageAsset, knob: ImageAsset, basic: ImageAsset, skill: ImageAsset): void {
    const inputLayer = hudRoot.getChildByName('SafeAreaRoot')?.getChildByName('InputLayer') ?? hudRoot;
    // 先对齐整体容器，再处理容器内部节点，避免显示坐标和触摸坐标分裂。
    const joystick = this.createUiSprite(inputLayer, 'JoystickControlRoot', base, 220, 220, 0, 0);
    this.joystickNode = joystick;
    joystick.getComponent(UITransform)?.setAnchorPoint(0, 0);
    this.alignContainerToScreen(joystick, { left: 60, bottom: 35 });
    this.joystickKnob = this.createUiSprite(joystick, 'JoystickKnob', knob, 120, 120, 110, 110);
    const actionRoot = this.createUiContainer(inputLayer, 'ActionControlsRoot', 360, 190);
    this.alignContainerToScreen(actionRoot, { right: 30, bottom: 30 });
    const attackButton = this.createUiSprite(actionRoot, 'BasicAttackButton', basic, 132, 132, 88, 72);
    const skillButton = this.createUiSprite(actionRoot, 'SkillDashButton', skill, 148, 148, 270, 92);
    this.createButtonLabel(attackButton, '普通攻击');
    this.createButtonLabel(skillButton, '技能');
    joystick.on(Node.EventType.TOUCH_START, this.onJoystickTouchStart, this);
    joystick.on(Node.EventType.TOUCH_MOVE, this.onJoystickTouchMove, this);
    joystick.on(Node.EventType.TOUCH_END, this.onJoystickTouchEnd, this);
    joystick.on(Node.EventType.TOUCH_CANCEL, this.onJoystickTouchEnd, this);
    this.bindActionButton(attackButton, () => {
      this.triggerBasicBite();
    });
    this.bindActionButton(skillButton, () => {
      this.triggerDashBite();
    });
  }

  private triggerBasicBite(): void {
    if (!this.playerNode || this.basicCooldownRemaining > 0) return;
    this.basicCooldownRemaining = 0.55;
    this.startFishAction('bite', 0.26);
    this.sendSkillEvent('skill-basic-bite');
    const angle = this.playerNode.angle * Math.PI / 180;
    const x = this.playerNode.position.x + Math.cos(angle) * 76;
    const y = this.playerNode.position.y + Math.sin(angle) * 76;
    this.createBiteEffect(x, y, this.playerNode.angle, 72, new Color(255, 236, 120, 235), 0.16);
    this.actionHint && (this.actionHint.string = '普通撕咬：攻击范围 72');
  }

  private triggerDashBite(): void {
    if (!this.playerNode || this.skillCooldownRemaining > 0) return;
    this.skillCooldownRemaining = 5;
    this.startFishAction('dashBite', 0.42);
    this.sendSkillEvent('skill-dash-bite');
    const angle = this.playerNode.angle * Math.PI / 180;
    const start = this.playerNode.position;
    const direction = { x: Math.cos(angle), y: Math.sin(angle) };
    const next = moveWithinBounds(
      { x: start.x, y: start.y }, direction, 240, 1,
      { minX: -GameBootstrap.WORLD_WIDTH / 2 + GameBootstrap.PLAYER_MARGIN, maxX: GameBootstrap.WORLD_WIDTH / 2 - GameBootstrap.PLAYER_MARGIN, minY: -GameBootstrap.WORLD_HEIGHT / 2 + GameBootstrap.PLAYER_MARGIN, maxY: GameBootstrap.WORLD_HEIGHT / 2 - GameBootstrap.PLAYER_MARGIN }
    );
    this.createDashEffect(start.x, start.y, this.playerNode.angle);
    this.playerNode.setPosition(next.x, next.y, 0);
    this.createBiteEffect(next.x + direction.x * 84, next.y + direction.y * 84, this.playerNode.angle, 96, new Color(120, 230, 255, 235), 0.22);
    this.actionHint && (this.actionHint.string = '冲刺撕咬：突进 240，冷却 5 秒');
  }

  private sendSkillEvent(skillId: 'skill-basic-bite' | 'skill-dash-bite'): void {
    if (!this.playerNode) return;
    const position = this.playerNode.position;
    // 服务端只信任它保存的朝向。技能前先发送当前朝向，确保快速转向后立即撕咬不会按旧朝向判定。
    this.realtime.sendInput({ clientTick: ++this.networkClientTick, moveX: 0, moveY: 0, rotation: this.playerNode.angle });
    this.realtime.sendSkill({ skillId, clientTick: ++this.networkClientTick, x: position.x, y: position.y, rotation: this.playerNode.angle });
  }

  private startFishAction(state: 'bite' | 'dashBite', duration: number): void {
    this.fishActionState = state;
    this.fishActionElapsed = 0;
    this.fishActionDuration = duration;
    if (this.playerSprite && this.swimFrames.length > 0) {
      // 使用动作状态对应的关键帧作为起始姿态，随后由缩放曲线完成前伸/回弹。
      this.playerSprite.spriteFrame = this.swimFrames[state === 'bite' ? 2 : 4] ?? this.swimFrames[0];
    }
  }

  private updateFishAction(deltaTime: number): void {
    if (!this.playerNode || this.fishActionState === 'swim') return;
    this.fishActionElapsed += deltaTime;
    const progress = Math.min(1, this.fishActionElapsed / this.fishActionDuration);
    const wave = Math.sin(progress * Math.PI);
    const stretch = this.fishActionState === 'dashBite' ? 0.48 : 0.32;
    this.playerNode.setScale(1 + stretch * wave, 1 - stretch * 0.42 * wave, 1);
    if (progress >= 1) {
      this.fishActionState = 'swim';
      this.fishActionElapsed = 0;
      this.fishActionDuration = 0;
      this.playerNode.setScale(1, 1, 1);
    }
  }

  private createBiteEffect(x: number, y: number, angle: number, radius: number, color: Color, duration: number): void {
    const node = new Node('BiteEffect');
    node.layer = this.node.layer;
    const transform = node.addComponent(UITransform);
    transform.setContentSize(radius * 2, radius * 2);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = color;
    graphics.moveTo(0, 0);
    graphics.arc(0, 0, radius, -0.58, 0.58, false);
    graphics.close();
    graphics.fill();
    this.node.getChildByName('WorldRoot')?.addChild(node);
    node.setPosition(x, y, 0);
    node.angle = angle;
    tween(node).to(duration, { scale: new Vec3(1.25, 1.25, 1) }).call(() => node.destroy()).start();
  }

  private createDashEffect(x: number, y: number, angle: number): void {
    const node = new Node('DashEffect');
    node.layer = this.node.layer;
    const transform = node.addComponent(UITransform);
    transform.setContentSize(180, 100);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = new Color(90, 220, 255, 150);
    graphics.ellipse(0, 0, 82, 34);
    graphics.fill();
    this.node.getChildByName('WorldRoot')?.addChild(node);
    node.setPosition(x, y, 0);
    node.angle = angle;
    tween(node).to(0.3, { scale: new Vec3(1.5, 0.55, 1) }).call(() => node.destroy()).start();
  }

  private createUiSprite(parent: Node, name: string, image: ImageAsset, width: number, height: number, x: number, y: number): Node {
    const node = new Node(name);
    node.layer = parent.layer;
    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, height);
    transform.setAnchorPoint(0.5, 0.5);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.spriteFrame = this.createSpriteFrame(image);
    parent.addChild(node);
    node.setPosition(x, y, 0);
    return node;
  }

  private createUiContainer(parent: Node, name: string, width: number, height: number): Node {
    const node = new Node(name);
    node.layer = parent.layer;
    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, height);
    transform.setAnchorPoint(0, 0);
    parent.addChild(node);
    node.setPosition(0, 0, 0);
    return node;
  }

  private createButtonLabel(parent: Node, text: string): void {
    const labelNode = new Node(`${parent.name}Label`);
    const transform = labelNode.addComponent(UITransform);
    transform.setContentSize(120, 28);
    const label = labelNode.addComponent(Label);
    label.string = text;
    label.fontSize = 20;
    label.lineHeight = 24;
    label.color = new Color(255, 255, 255, 245);
    parent.addChild(labelNode);
    labelNode.setPosition(0, -parent.getComponent(UITransform)!.height / 2 - 18, 0);
  }

  private alignContainerToScreen(node: Node, edges: { left?: number; right?: number; bottom: number }): void {
    const widget = node.addComponent(Widget);
    widget.isAlignLeft = edges.left !== undefined;
    widget.isAlignRight = edges.right !== undefined;
    widget.isAlignBottom = true;
    if (edges.left !== undefined) widget.left = edges.left;
    if (edges.right !== undefined) widget.right = edges.right;
    widget.bottom = edges.bottom;
    widget.updateAlignment();
  }

  private bindActionButton(node: Node, action: () => void): void {
    node.on(Node.EventType.TOUCH_START, () => node.setScale(0.92, 0.92, 1));
    node.on(Node.EventType.TOUCH_END, () => { node.setScale(1, 1, 1); action(); });
    node.on(Node.EventType.TOUCH_CANCEL, () => node.setScale(1, 1, 1));
  }

  private bindInput(): void {
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
  }

  private unbindInput(): void {
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
  }

  private readonly onKeyDown = (event: EventKeyboard): void => {
    this.pressedKeys.add(event.keyCode);
  };

  private readonly onKeyUp = (event: EventKeyboard): void => {
    this.pressedKeys.delete(event.keyCode);
  };

  private readonly onJoystickTouchStart = (event: EventTouch): void => {
    if (this.joystickTouchId !== null) return;
    const location = event.getUILocation();
    this.joystickTouchId = event.getID();
    this.joystickOrigin.set(location.x, location.y);
    this.joystickDirection.set(0, 0);
    this.joystickKnob?.setPosition(110, 110, 0);
  };

  private readonly onJoystickTouchMove = (event: EventTouch): void => {
    if (event.getID() !== this.joystickTouchId) return;
    const location = event.getUILocation();
    this.joystickDirection.set(
      (location.x - this.joystickOrigin.x) / GameBootstrap.JOYSTICK_RADIUS,
      (location.y - this.joystickOrigin.y) / GameBootstrap.JOYSTICK_RADIUS
    );
    if (this.joystickDirection.length() > 1) this.joystickDirection.normalize();
    this.joystickKnob?.setPosition(
      110 + this.joystickDirection.x * GameBootstrap.JOYSTICK_RADIUS * 0.55,
      110 + this.joystickDirection.y * GameBootstrap.JOYSTICK_RADIUS * 0.55,
      0
    );
  };

  private readonly onJoystickTouchEnd = (event: EventTouch): void => {
    if (event.getID() !== this.joystickTouchId) return;
    this.joystickTouchId = null;
    this.joystickDirection.set(0, 0);
    this.joystickKnob?.setPosition(110, 110, 0);
  };

  private readKeyboardDirection(): Vec2 {
    const left = this.pressedKeys.has(KeyCode.KEY_A) || this.pressedKeys.has(KeyCode.ARROW_LEFT);
    const right = this.pressedKeys.has(KeyCode.KEY_D) || this.pressedKeys.has(KeyCode.ARROW_RIGHT);
    const up = this.pressedKeys.has(KeyCode.KEY_W) || this.pressedKeys.has(KeyCode.ARROW_UP);
    const down = this.pressedKeys.has(KeyCode.KEY_S) || this.pressedKeys.has(KeyCode.ARROW_DOWN);
    return new Vec2(Number(right) - Number(left), Number(up) - Number(down));
  }

  private advanceSwimAnimation(deltaTime: number, moving: boolean): void {
    if (!this.playerSprite || this.swimFrames.length === 0 || this.fishActionState !== 'swim') return;
    this.animationElapsed += deltaTime;
    const frameDuration = moving ? 0.11 : 0.22;
    while (this.animationElapsed >= frameDuration) {
      this.animationElapsed -= frameDuration;
      this.swimFrameIndex = (this.swimFrameIndex + 1) % this.swimFrames.length;
      this.playerSprite.spriteFrame = this.swimFrames[this.swimFrameIndex];
    }
  }

  private followPlayer(playerX: number, playerY: number): void {
    if (!this.cameraNode || !this.hudRoot) return;
    const cameraX = Math.min(1280, Math.max(-1280, playerX));
    const cameraY = Math.min(720, Math.max(-720, playerY));
    this.cameraNode.setPosition(cameraX, cameraY, 1000);
    // MainCamera 同时承担 Canvas 渲染，因此 HUD 必须逐帧补偿相机位移。
    // 这样视觉上始终是屏幕空间 UI，不会停留在海底地图坐标中。
    this.hudRoot.setPosition(cameraX - 640, cameraY - 360, 0);
  }

  private loadImage(path: string): Promise<ImageAsset> {
    return new Promise((resolve, reject) => {
      resources.load(path, ImageAsset, (error, image) => {
        if (error || !image) reject(error ?? new Error(`无法加载图片：${path}`));
        else resolve(image);
      });
    });
  }

  private createSpriteFrame(image: ImageAsset): SpriteFrame {
    const texture = new Texture2D();
    texture.image = image;
    const spriteFrame = new SpriteFrame();
    spriteFrame.texture = texture;
    return spriteFrame;
  }
}
