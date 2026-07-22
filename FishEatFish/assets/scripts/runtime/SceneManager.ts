import { ImageAsset, Node, Sprite, SpriteFrame, Texture2D, UITransform } from 'cc';

export interface GameSceneNodes {
  worldRoot: Node;
  playerLayer: Node;
  cameraNode: Node;
  hudRoot: Node;
}

/** 管理大世界场景节点、地图背景、镜头与 HUD 的空间关系。 */
export class SceneManager {
  public constructor(private readonly rootNode: Node) {}

  public resolveNodes(): GameSceneNodes {
    const worldRoot = this.rootNode.getChildByName('WorldRoot');
    const playerLayer = worldRoot?.getChildByName('PlayerLayer');
    const cameraNode = worldRoot?.getChildByName('MainCamera');
    const hudRoot = this.rootNode.getChildByName('HudRoot');
    if (!worldRoot || !playerLayer || !cameraNode || !hudRoot) throw new Error('MainScene 缺少世界、玩家、镜头或 HUD 节点。');
    hudRoot.setPosition(0, 0, 0);
    return { worldRoot, playerLayer, cameraNode, hudRoot };
  }

  public createOceanBackground(worldRoot: Node, image: ImageAsset, width: number, height: number): void {
    const background = new Node('OceanMap');
    background.layer = worldRoot.layer;
    const transform = background.addComponent(UITransform);
    transform.setContentSize(width, height);
    const sprite = background.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.spriteFrame = SceneManager.createSpriteFrame(image);
    worldRoot.addChild(background);
    background.setSiblingIndex(0);
  }

  public follow(cameraNode: Node, hudRoot: Node, playerX: number, playerY: number): void {
    const cameraX = Math.min(1280, Math.max(-1280, playerX));
    const cameraY = Math.min(720, Math.max(-720, playerY));
    cameraNode.setPosition(cameraX, cameraY, 1000);
    hudRoot.setPosition(cameraX, cameraY, 0);
  }

  public static createSpriteFrame(image: ImageAsset): SpriteFrame {
    const texture = new Texture2D();
    texture.image = image;
    const frame = new SpriteFrame();
    frame.texture = texture;
    return frame;
  }
}
