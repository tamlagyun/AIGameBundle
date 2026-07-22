import { ImageAsset, JsonAsset, resources } from 'cc';

/** Cocos Resources 资源读取适配器：只负责加载，不负责配置校验与业务解释。 */
export class GameResourceLoader {
  public loadImage(path: string): Promise<ImageAsset> {
    return new Promise((resolve, reject) => resources.load(path, ImageAsset, (error, image) => {
      if (error || !image) reject(error ?? new Error(`无法加载图片：${path}`));
      else resolve(image);
    }));
  }

  public loadJson(path: string): Promise<unknown> {
    return new Promise((resolve, reject) => resources.load(path, JsonAsset, (error, asset) => {
      if (error || !asset) reject(error ?? new Error(`无法加载配置：${path}`));
      else resolve(asset.json);
    }));
  }
}
