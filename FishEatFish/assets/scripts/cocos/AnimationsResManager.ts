import { ImageAsset, resources, SpriteFrame, Texture2D } from 'cc';
import { shouldFlipArtFrame } from '../core/MovementSystem.ts';
import type { PlayerAppearanceConfig } from '../core/types.ts';

export interface AppearanceAnimationResources {
  config: PlayerAppearanceConfig;
  portrait: ImageAsset;
  swimFrames: SpriteFrame[];
  attackFrames: SpriteFrame[];
  hurtFrames: SpriteFrame[];
}

export interface AppearanceSelection {
  resources: AppearanceAnimationResources;
  changed: boolean;
}

/** Loads and owns every player-appearance animation resource set. */
export class AnimationsResManager {
  private readonly resourcesByAppearance = new Map<string, AppearanceAnimationResources>();
  private selectedAppearanceId: string;

  public constructor(private readonly defaultAppearanceId: string) {
    this.selectedAppearanceId = defaultAppearanceId;
  }

  public async load(configs: PlayerAppearanceConfig[]): Promise<void> {
    this.resourcesByAppearance.clear();
    for (const config of configs) {
      const [portrait, ...animationImages] = await Promise.all([
        this.loadImage(config.portraitPath),
        ...Array.from({ length: config.swimFrameCount }, (_, index) => this.loadImage(`${config.resourceRoot}/${config.animationPrefixes.swim}-${index}`)),
        ...Array.from({ length: config.attackFrameCount }, (_, index) => this.loadImage(`${config.resourceRoot}/${config.animationPrefixes.attack}-${index}`)),
        ...Array.from({ length: config.hurtFrameCount }, (_, index) => this.loadImage(`${config.resourceRoot}/${config.animationPrefixes.hurt}-${index}`))
      ]);
      const swimEnd = config.swimFrameCount;
      const attackEnd = swimEnd + config.attackFrameCount;
      this.resourcesByAppearance.set(config.id, {
        config,
        portrait,
        swimFrames: animationImages.slice(0, swimEnd).map((image) => this.createAnimationFrame(image, config.animationArtFacingDirections.swim, config.artFacingDirection)),
        attackFrames: animationImages.slice(swimEnd, attackEnd).map((image) => this.createAnimationFrame(image, config.animationArtFacingDirections.attack, config.artFacingDirection)),
        hurtFrames: animationImages.slice(attackEnd).map((image) => this.createAnimationFrame(image, config.animationArtFacingDirections.hurt, config.artFacingDirection))
      });
    }
    if (!this.resourcesByAppearance.has(this.defaultAppearanceId)) {
      throw new Error(`默认形象资源不存在：${this.defaultAppearanceId}`);
    }
    this.selectedAppearanceId = this.defaultAppearanceId;
  }

  public get defaultResources(): AppearanceAnimationResources {
    return this.get(this.defaultAppearanceId);
  }

  public get currentResources(): AppearanceAnimationResources {
    return this.get(this.selectedAppearanceId);
  }

  public get(appearanceId: string | undefined): AppearanceAnimationResources {
    return this.resourcesByAppearance.get(appearanceId ?? '')
      ?? this.resourcesByAppearance.get(this.defaultAppearanceId)
      ?? (() => { throw new Error('没有可用的玩家动作资源'); })();
  }

  public select(appearanceId: string): AppearanceSelection {
    const next = this.get(appearanceId);
    const changed = this.selectedAppearanceId !== next.config.id;
    if (changed) this.selectedAppearanceId = next.config.id;
    return { resources: next, changed };
  }

  public getPortraits(): Map<string, ImageAsset> {
    return new Map([...this.resourcesByAppearance].map(([id, value]) => [id, value.portrait]));
  }

  public clear(): void {
    this.resourcesByAppearance.clear();
    this.selectedAppearanceId = this.defaultAppearanceId;
  }

  private loadImage(path: string): Promise<ImageAsset> {
    return new Promise((resolve, reject) => {
      resources.load(path, ImageAsset, (error, image) => {
        if (error || !image) reject(error ?? new Error(`无法加载玩家动作资源：${path}`));
        else resolve(image);
      });
    });
  }

  private createAnimationFrame(image: ImageAsset, sourceFacingDirection: PlayerAppearanceConfig['artFacingDirection'], targetFacingDirection: PlayerAppearanceConfig['artFacingDirection']): SpriteFrame {
    const texture = new Texture2D();
    texture.image = image;
    const frame = new SpriteFrame();
    frame.texture = texture;
    frame.flipUVX = shouldFlipArtFrame(sourceFacingDirection, targetFacingDirection);
    return frame;
  }
}
