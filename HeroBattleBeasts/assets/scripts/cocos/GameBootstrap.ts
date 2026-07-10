import {
  Color,
  Director,
  Graphics,
  HorizontalTextAlignment,
  ImageAsset,
  Input,
  KeyCode,
  Label,
  Node,
  Sprite,
  SpriteFrame,
  Texture2D,
  UITransform,
  director,
  input,
  resources
} from 'cc';
import { GameRuntime } from '../runtime/GameRuntime';
import { normalizeKeyboardInput, cocosKeyCodeToWebCode, KEY_BINDINGS } from '../runtime/InputAdapter';
import type { RuntimeViewModel } from '../runtime/RuntimeViewModel';
import {
  VIEW_WIDTH,
  VIEW_HEIGHT,
  DEFAULT_TILE_STANDING_RATIO,
  worldToScreenX,
  worldToScreenY,
  calcTileCocosY,
} from '../renderer/RenderConfig';
import { ConfigManager } from '../data/ConfigManager';
import { createDefaultRegistry } from '../data/GameDefaults';

const BOOTSTRAP_FLAG = '__heroBattleBeastsCocosBootstrapStarted';

// 模块级玩家精灵节点引用
let sPlayerSpriteNode: Node | null = null;

// AI精灵图缓存：资源路径 → SpriteFrame
const sSpriteFrameCache = new Map<string, SpriteFrame>();
// 动态精灵节点池：用于敌人/道具/子弹的复用
let sSpritePoolParent: Node | null = null;
const sEnemyNodes: Node[] = [];       // 闲置池
const sPickupNodes: Node[] = [];      // 闲置池
const sBulletNodes: Node[] = [];      // 闲置池
// 当前帧活跃节点（用于回收上一帧残留）
const sActiveEnemyNodes: Node[] = [];
const sActivePickupNodes: Node[] = [];
const sActiveBulletNodes: Node[] = [];
let sExitNode: Node | null = null;
// 冒险岛风格地图
let sBackgroundNode: Node | null = null;
let sMapTileParent: Node | null = null;
const sGroundTileNodes: Node[] = [];
const sPlatformTileNodes: Node[] = [];
const sActiveGroundTileNodes: Node[] = [];
const sActivePlatformTileNodes: Node[] = [];

// 资源名 → SpriteFrame 的快速查找
function getCachedSpriteFrame(resPath: string): SpriteFrame | null {
  return sSpriteFrameCache.get(resPath) ?? null;
}

// 从池中获取或创建精灵节点
function ensureSpriteNode(parent: Node, nameBase: string, pool: Node[]): Node {
  let node = pool.pop();
  if (!node) {
    node = new Node(nameBase);
    parent.addChild(node);
    node.layer = parent.layer;
  }
  node.active = true;
  return node;
}

// 归还精灵节点到池
function releaseSpriteNode(node: Node, pool: Node[]): void {
  node.active = false;
  pool.push(node);
}

export class GameBootstrap {
  readonly sceneName = 'MainScene';

  start(): void {
    startCocosRuntimePreview();
  }
}

export function startCocosRuntimePreview(): void {
  const globalState = globalThis as Record<string, unknown>;
  if (globalState[BOOTSTRAP_FLAG]) {
    return;
  }
  globalState[BOOTSTRAP_FLAG] = true;

  const run = () => {
    const scene = director.getScene();
    if (!scene || scene.name !== 'MainScene') {
      return;
    }

    const canvas = ensureCanvasRoot(scene);

    // ═══ 底层：背景图 + 地图瓦片（必须在游戏对象之前创建，确保不遮挡） ═══
    const bgNode = ensureNode(canvas, 'BackgroundSprite');
    sBackgroundNode = bgNode;
    bgNode.setPosition(0, 0);
    const bgTransform = bgNode.getComponent(UITransform) ?? bgNode.addComponent(UITransform);
    bgTransform.setContentSize(1280, 720);
    const bgSprite = bgNode.getComponent(Sprite) ?? bgNode.addComponent(Sprite);
    bgSprite.sizeMode = Sprite.SizeMode.CUSTOM;

    const mapTileParent = ensureNode(canvas, 'MapTilePool');
    sMapTileParent = mapTileParent;
    // ═══ 底层结束 ═══

    const graphicsNode = ensureRenderNode(canvas, 'HeroBattleBeastsRuntimeGraphics');
    const graphics = graphicsNode.getComponent(Graphics) ?? graphicsNode.addComponent(Graphics);

    // 精灵节点池父节点
    const poolParent = ensureNode(canvas, 'SpritePool');
    sSpritePoolParent = poolParent;

    const hudNode = ensureNode(canvas, 'HeroBattleBeastsRuntimeHud');
    const statusLabel = ensureLabel(hudNode, 'StatusLabel', 24, -626, 310);
    const helpLabel = ensureLabel(hudNode, 'HelpLabel', 18, -626, -320);

    // 结果面板（初始隐藏，游戏结束时显示）
    const resultRoot = ensureNode(canvas, 'ResultOverlay');
    resultRoot.active = false;
    const resultTitle = ensureCenteredLabel(resultRoot, 'ResultTitle', 38, 0, 90);
    const resultScore = ensureCenteredLabel(resultRoot, 'ResultScore', 18, 0, 45);
    const resultCoins = ensureCenteredLabel(resultRoot, 'ResultCoins', 18, 0, 20);
    const resultDefeats = ensureCenteredLabel(resultRoot, 'ResultDefeats', 18, 0, -5);
    const resultTime = ensureCenteredLabel(resultRoot, 'ResultTime', 18, 0, -30);
    const resultHint = ensureCenteredLabel(resultRoot, 'ResultHint', 16, 0, -65);
    resultHint.color = new Color(255, 213, 76, 255);

    // AI生成的玩家精灵节点
    const playerSpriteNode = ensureNode(canvas, 'PlayerSprite');
    sPlayerSpriteNode = playerSpriteNode;
    playerSpriteNode.setPosition(0, 0);
    const playerTransform = playerSpriteNode.getComponent(UITransform) ?? playerSpriteNode.addComponent(UITransform);
    playerTransform.setContentSize(64, 64);  // 正方形图片保持比例
    playerTransform.setAnchorPoint(0.5, 0);  // 底部中心锚点：脚底对齐物理位置
    const playerSprite = playerSpriteNode.getComponent(Sprite) ?? playerSpriteNode.addComponent(Sprite);
    playerSprite.sizeMode = Sprite.SizeMode.CUSTOM;

    // 出口精灵节点
    sExitNode = ensureNode(canvas, 'ExitSprite');
    sExitNode.setPosition(0, 0);
    const exitTransform = sExitNode.getComponent(UITransform) ?? sExitNode.addComponent(UITransform);
    exitTransform.setContentSize(64, 64);
    const exitSprite = sExitNode.getComponent(Sprite) ?? sExitNode.addComponent(Sprite);
    exitSprite.sizeMode = Sprite.SizeMode.CUSTOM;

    // 强制设定节点层级顺序，防止热重载/二次运行时旧顺序残留
    // Cocos 按 siblingIndex 递增渲染，数字大的在上面
    if (sBackgroundNode) sBackgroundNode.setSiblingIndex(0);   // 最底层
    if (sMapTileParent) sMapTileParent.setSiblingIndex(1);     // 地图瓦片
    graphicsNode.setSiblingIndex(2);                            // Graphics 后备绘制
    if (sSpritePoolParent) sSpritePoolParent.setSiblingIndex(3);// 敌人/子弹/金币
    if (sPlayerSpriteNode) sPlayerSpriteNode.setSiblingIndex(4);// 玩家
    if (sExitNode) sExitNode.setSiblingIndex(5);               // 出口
    hudNode.setSiblingIndex(6);                                 // HUD
    resultRoot.setSiblingIndex(7);                              // 结果面板（最顶层）

    // 构建配置管理器
    const registry = createDefaultRegistry();
    const configManager = new ConfigManager(registry);

    // 获取运行时配置
    const levelConfig = configManager.getLevelConfig('level-001');
    const playerConfig = configManager.getPlayerConfig();
    const weaponConfig = configManager.getWeaponTemplate(playerConfig.startWeaponId);
    // 关卡中所有敌人的默认配置（取第一个 enemyId）
    const firstEnemyId = levelConfig.encounters[0]?.enemyId ?? 'forest-slime';
    const enemyConfig = configManager.getEnemyTemplate(firstEnemyId);

    // 批量加载所有精灵图（由 ConfigManager 统一管理路径列表）
    const spritePaths = configManager.getAllSpritePaths();
    console.log(`[HeroBattleBeasts] Loading ${spritePaths.length} sprite assets...`);
    for (const path of spritePaths) {
      resources.load(path, ImageAsset, (err: Error | null, imageAsset: ImageAsset) => {
        if (err || !imageAsset) {
          console.warn(`[HeroBattleBeasts] Failed: ${path}`, err?.message || '');
          return;
        }
        try {
          const texture = new Texture2D();
          texture.image = imageAsset;
          const spriteFrame = new SpriteFrame();
          spriteFrame.texture = texture;
          sSpriteFrameCache.set(path, spriteFrame);

          // 根据路径自动绑定到对应节点
          if (path.includes('player_hero')) {
            playerSprite.spriteFrame = spriteFrame;
          } else if (path.includes('exit-sign')) {
            exitSprite.spriteFrame = spriteFrame;
          } else if (path.includes('background')) {
            if (bgSprite) bgSprite.spriteFrame = spriteFrame;
          }
          console.log(`[HeroBattleBeasts] Loaded: ${path} (${texture.width}x${texture.height})`);
        } catch (e2) {
          console.warn(`[HeroBattleBeasts] Create failed: ${path}`, e2);
        }
      });
    }

    const runtime = new GameRuntime({
      levelConfig,
      playerConfig,
      weaponConfig,
      enemyConfig
    });
    const activeKeys = new Set<string>();

    bindKeyboard(activeKeys, runtime);
    let lastTimeMs = Date.now();

    const update = () => {
      const now = Date.now();
      const deltaSeconds = Math.min(0.033, Math.max(0.001, (now - lastTimeMs) / 1000));
      lastTimeMs = now;

      const inputCommand = normalizeKeyboardInput(activeKeys);
      const viewModel = runtime.step(inputCommand, deltaSeconds);

      if (inputCommand.restartPressed) {
        activeKeys.delete('KeyR');
        runtime.restart();
      }

      renderGame(configManager, levelConfig, graphics, viewModel,
        resultRoot, resultTitle, resultScore, resultCoins, resultDefeats, resultTime, resultHint);
      renderHud(statusLabel, helpLabel, viewModel);
    };

    director.on(Director.EVENT_BEFORE_UPDATE, update);
    update();
    console.info('[HeroBattleBeasts] Cocos runtime preview started.');
  };

  director.once(Director.EVENT_AFTER_SCENE_LAUNCH, run);
  setTimeout(run, 0);
}

function ensureCanvasRoot(scene: Node): Node {
  let canvas = scene.getChildByName('Canvas');
  if (!canvas) {
    canvas = new Node('Canvas');
    scene.addChild(canvas);
  }

  const transform = canvas.getComponent(UITransform) ?? canvas.addComponent(UITransform);
  transform.setContentSize(VIEW_WIDTH, VIEW_HEIGHT);
  return canvas;
}

function ensureNode(parent: Node, name: string): Node {
  let node = parent.getChildByName(name);
  if (!node) {
    node = new Node(name);
    parent.addChild(node);
  }
  node.layer = parent.layer;
  return node;
}

function ensureRenderNode(parent: Node, name: string): Node {
  const node = ensureNode(parent, name);
  node.setPosition(0, 0);

  const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  transform.setContentSize(VIEW_WIDTH, VIEW_HEIGHT);
  return node;
}

function ensureLabel(parent: Node, name: string, fontSize: number, x: number, y: number): Label {
  const node = ensureNode(parent, name);
  node.setPosition(x, y);
  const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  transform.setContentSize(1180, fontSize + 10);
  transform.setAnchorPoint(0, 0.5);
  const label = node.getComponent(Label) ?? node.addComponent(Label);
  label.fontSize = fontSize;
  label.lineHeight = fontSize + 6;
  label.horizontalAlign = HorizontalTextAlignment.LEFT;
  label.color = new Color(35, 40, 48, 255);
  return label;
}

// 居中 Label（用于结果面板）
function ensureCenteredLabel(parent: Node, name: string, fontSize: number, x: number, y: number): Label {
  const node = ensureNode(parent, name);
  node.setPosition(x, y);
  const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  transform.setContentSize(440, fontSize + 10);
  const label = node.getComponent(Label) ?? node.addComponent(Label);
  label.fontSize = fontSize;
  label.lineHeight = fontSize + 6;
  label.horizontalAlign = HorizontalTextAlignment.CENTER;
  label.color = new Color(207, 216, 220, 255);
  return label;
}

function bindKeyboard(activeKeys: Set<string>, runtime: GameRuntime): void {
  input.on(Input.EventType.KEY_DOWN, (event) => {
    const webCode = cocosKeyCodeToWebCode(event.keyCode);
    if (webCode) {
      activeKeys.add(webCode);
    }
  });

  input.on(Input.EventType.KEY_UP, (event) => {
    const webCode = cocosKeyCodeToWebCode(event.keyCode);
    if (webCode) {
      activeKeys.delete(webCode);
    }
  });
}

function renderHud(statusLabel: Label, helpLabel: Label, viewModel: RuntimeViewModel): void {
  statusLabel.string = [
    'HP ' + viewModel.hud.healthText,
    'Coin ' + viewModel.hud.coinText,
    'Score ' + viewModel.hud.scoreText,
    'Goal ' + viewModel.hud.objectiveText,
    viewModel.status.toUpperCase()
  ].join('   ');
  helpLabel.string = 'Move/Aim: WASD or Arrow  Jump: W/Space  Shoot: J/Z  Restart: R';
}

function renderGame(
  configManager: ConfigManager,
  levelConfig: ReturnType<ConfigManager['getLevelConfig']>,
  graphics: Graphics,
  viewModel: RuntimeViewModel,
  resultRoot: Node,
  resultTitle: Label,
  resultScore: Label,
  resultCoins: Label,
  resultDefeats: Label,
  resultTime: Label,
  resultHint: Label
): void {
  const cameraX = clamp(viewModel.player.position.x - 360, 0, levelConfig.size.width - VIEW_WIDTH);

  graphics.clear();
  updateBackgroundSprite();
  updatePlatformSprites(configManager, levelConfig, cameraX);
  updateExitSprite(cameraX, viewModel);
  updatePickupSprites(configManager, cameraX, viewModel);
  updateEnemySprites(configManager, cameraX, viewModel);
  updateBulletSprites(cameraX, viewModel);
  updatePlayerSprite(graphics, cameraX, viewModel);
  drawResultOverlay(graphics, viewModel, resultRoot, resultTitle, resultScore, resultCoins, resultDefeats, resultTime, resultHint);
}

function updateBackgroundSprite(): void {
  // 背景精灵始终显示，由资源加载时自动绑定
  if (sBackgroundNode) {
    sBackgroundNode.active = true;
  }
}

function updatePlatformSprites(configManager: ConfigManager, levelConfig: ReturnType<ConfigManager['getLevelConfig']>, cameraX: number): void {
  if (!sMapTileParent) return;

  // 回收上一帧所有活跃瓦片节点
  for (const node of sActiveGroundTileNodes.splice(0)) {
    releaseTileNode(node, sGroundTileNodes);
  }
  for (const node of sActivePlatformTileNodes.splice(0)) {
    releaseTileNode(node, sPlatformTileNodes);
  }

  for (const platform of levelConfig.platforms) {
    // 从平台配置获取 tileType（兼容旧数据：无 tileType 时用 id 推断）
    const tileType = platform.tileType ?? platform.id;
    const tileInfo = configManager.getTileSprite(tileType);
    if (!tileInfo) continue;

    const sf = getCachedSpriteFrame(tileInfo.path);
    if (!sf) continue;

    const tileW = tileInfo.size[0];
    const tileH = tileInfo.size[1];
    const isGround = tileType === 'ground';
    const tilePool = isGround ? sGroundTileNodes : sPlatformTileNodes;
    const activePool = isGround ? sActiveGroundTileNodes : sActivePlatformTileNodes;

    const numTiles = Math.ceil(platform.width / tileW);
    // 根据 tileType 查找站立比例
    const standingRatio = DEFAULT_TILE_STANDING_RATIO[tileType] ?? 0.5;
    const tileScreenY = calcTileCocosY(platform.y, standingRatio, tileH);

    for (let i = 0; i < numTiles; i++) {
      const tileCenterX = platform.x + i * tileW + tileW / 2;
      const screenX = worldToScreenX(tileCenterX, cameraX);

      const node = ensureTileNode(sMapTileParent, isGround ? 'GroundTile' : 'PlatformTile', tilePool);
      const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
      transform.setContentSize(tileW, tileH);
      transform.setAnchorPoint(0.5, 0);

      const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      if (sprite.spriteFrame !== sf) {
        sprite.spriteFrame = sf;
      }

      node.setPosition(screenX, tileScreenY);
      activePool.push(node);
    }
  }
}

function ensureTileNode(parent: Node, nameBase: string, pool: Node[]): Node {
  let node = pool.pop();
  if (!node) {
    node = new Node(nameBase);
    parent.addChild(node);
    node.layer = parent.layer;
  }
  node.active = true;
  return node;
}

function releaseTileNode(node: Node, pool: Node[]): void {
  node.active = false;
  pool.push(node);
}

function updateExitSprite(cameraX: number, viewModel: RuntimeViewModel): void {
  if (!sExitNode) return;
  const sf = getCachedSpriteFrame('art/ui/exit-sign');
  const sprite = sExitNode.getComponent(Sprite);
  if (sf && sprite && sprite.spriteFrame !== sf) {
    sprite.spriteFrame = sf;
  }
  // 出口传送门：中心锚点，位置在出口区域中心
  const x = worldToScreenX(viewModel.exit.x + viewModel.exit.width / 2, cameraX);
  const y = worldToScreenY(viewModel.exit.y + viewModel.exit.height / 2);
  sExitNode.setPosition(x, y);
}

function updatePickupSprites(configManager: ConfigManager, cameraX: number, viewModel: RuntimeViewModel): void {
  if (!sSpritePoolParent) return;

  // 回收上一帧所有活跃节点到闲置池
  for (const node of sActivePickupNodes.splice(0)) {
    releaseSpriteNode(node, sPickupNodes);
  }

  for (const pickup of viewModel.pickups) {
    if (pickup.collected) continue;

    // 从配置管理器获取实体精灵信息（支持任意道具类型扩展）
    const spriteInfo = configManager.getEntitySprite(pickup.type);
    if (!spriteInfo) continue;

    const node = ensureSpriteNode(sSpritePoolParent, `Pickup_${pickup.id}`, sPickupNodes);
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(spriteInfo.size[0], spriteInfo.size[1]);
    transform.setAnchorPoint(0.5, 0);
    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;

    const sf = getCachedSpriteFrame(spriteInfo.spritePath);
    if (sf && sprite.spriteFrame !== sf) {
      sprite.spriteFrame = sf;
    }

    // 拾取物位置 y 在关卡数据中比平台顶面高 50，补偿后底部对齐平台顶面
    node.setPosition(
      worldToScreenX(pickup.position.x, cameraX),
      worldToScreenY(pickup.position.y + 50)
    );
    // 标记为当前帧活跃
    sActivePickupNodes.push(node);
  }
}

function updateEnemySprites(configManager: ConfigManager, cameraX: number, viewModel: RuntimeViewModel): void {
  if (!sSpritePoolParent) return;

  // 回收上一帧所有活跃节点到闲置池
  for (const node of sActiveEnemyNodes.splice(0)) {
    releaseSpriteNode(node, sEnemyNodes);
  }

  for (const enemy of viewModel.enemies) {
    if (enemy.defeated) continue;

    // 根据 enemyId 从配置管理器获取精灵信息（支持不同敌人不同精灵）
    const spriteInfo = configManager.getEntitySprite(enemy.enemyId);
    if (!spriteInfo) continue;

    const node = ensureSpriteNode(sSpritePoolParent, `Enemy_${enemy.id}`, sEnemyNodes);
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(spriteInfo.size[0], spriteInfo.size[1]);
    transform.setAnchorPoint(0.5, 0);
    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;

    const sf = getCachedSpriteFrame(spriteInfo.spritePath);
    if (sf && sprite.spriteFrame !== sf) {
      sprite.spriteFrame = sf;
    }

    // 敌人位置 y 在关卡数据中比平台顶面高 40，补偿后底部对齐平台顶面
    node.setPosition(
      worldToScreenX(enemy.position.x, cameraX),
      worldToScreenY(enemy.position.y + 40)
    );
    // 面向玩家
    node.setScale(enemy.position.x > viewModel.player.position.x ? -1 : 1, 1, 1);
    // 标记为当前帧活跃
    sActiveEnemyNodes.push(node);
  }
}

function updateBulletSprites(cameraX: number, viewModel: RuntimeViewModel): void {
  if (!sSpritePoolParent) return;

  // 回收上一帧所有活跃节点到闲置池
  for (const node of sActiveBulletNodes.splice(0)) {
    releaseSpriteNode(node, sBulletNodes);
  }

  for (const bullet of viewModel.bullets) {
    const node = ensureSpriteNode(sSpritePoolParent, 'Bullet', sBulletNodes);
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(20, 14);
    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;

    const sf = getCachedSpriteFrame('art/weapons/player-bullet');
    if (sf && sprite.spriteFrame !== sf) {
      sprite.spriteFrame = sf;
    }

    node.setPosition(
      worldToScreenX(bullet.position.x, cameraX),
      worldToScreenY(bullet.position.y)
    );
    // 子弹朝向：根据速度方向旋转（物理Y向下 → 屏幕Y向上，取反）
    node.setScale(1, 1, 1);  // 复位缩放（旧代码用 scale 翻转，现改用 rotation）
    const angleDeg = Math.atan2(-bullet.velocity.y, bullet.velocity.x) * (180 / Math.PI);
    node.angle = angleDeg;
    // 标记为当前帧活跃
    sActiveBulletNodes.push(node);
  }
}

function updatePlayerSprite(graphics: Graphics, cameraX: number, viewModel: RuntimeViewModel): void {
  const x = worldToScreenX(viewModel.player.position.x, cameraX);
  const y = worldToScreenY(viewModel.player.position.y);

  // 检查精灵节点及其 Sprite 组件是否已加载精灵帧
  if (sPlayerSpriteNode) {
    const sprite = sPlayerSpriteNode.getComponent(Sprite);
    if (sprite && sprite.spriteFrame) {
      // 精灵已加载，用节点位置渲染
      sPlayerSpriteNode.setPosition(x, y);
      sPlayerSpriteNode.setScale(viewModel.player.facing, 1, 1);
      return;
    }
  }

  // 精灵未加载时，用 Graphics 画色块作为后备
  graphics.fillColor = new Color(244, 94, 89, 255);
  graphics.roundRect(x - 18, y - 48, 36, 48, 12);
  graphics.fill();
  graphics.fillColor = new Color(48, 76, 161, 255);
  graphics.roundRect(x - 22, y - 18, 44, 16, 8);
  graphics.fill();
}

function drawResultOverlay(
  graphics: Graphics,
  viewModel: RuntimeViewModel,
  resultRoot: Node,
  resultTitle: Label,
  resultScore: Label,
  resultCoins: Label,
  resultDefeats: Label,
  resultTime: Label,
  resultHint: Label
): void {
  if (!viewModel.result) {
    resultRoot.active = false;
    return;
  }

  // 显示结果面板
  resultRoot.active = true;

  // 半透明背景
  graphics.fillColor = new Color(10, 15, 30, 190);
  graphics.rect(-VIEW_WIDTH / 2, -VIEW_HEIGHT / 2, VIEW_WIDTH, VIEW_HEIGHT);
  graphics.fill();

  // 面板背景
  graphics.fillColor = new Color(30, 40, 65, 240);
  graphics.roundRect(-280, -150, 560, 300, 16);
  graphics.fill();

  // 底部色条
  graphics.fillColor = viewModel.result.status === 'won'
    ? new Color(80, 172, 104, 255)
    : new Color(205, 80, 80, 255);
  graphics.roundRect(-280, 150 - 30, 560, 30, 16);
  graphics.fill();

  // 标题
  resultTitle.string = viewModel.result.title;
  resultTitle.color = viewModel.result.status === 'won'
    ? new Color(102, 187, 106, 255)
    : new Color(239, 83, 80, 255);

  // 统计数据
  resultScore.string = `分数: ${viewModel.result.score}`;
  resultCoins.string = `金币: ${viewModel.result.coins}`;
  resultDefeats.string = `击败: ${viewModel.result.defeatedEnemies}`;
  resultTime.string = `用时: ${viewModel.result.elapsedSeconds}s`;
  resultHint.string = '按 R 重新开始';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
