/**
 * 渲染配置 —— 坐标变换 + 默认参数
 * 精灵资源/实体映射已迁移至 ConfigManager + EntityRegistry
 */

// ─── 画布尺寸 ───
export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;

// ─── 路基站立位置默认比例（具体值由 ConfigManager 的 tileSprites 覆盖）───
// 格式: tileType → standingRatio (0=图片下沿, 0.5=图片中间, 1=图片上沿)
export const DEFAULT_TILE_STANDING_RATIO: Record<string, number> = {
  'ground': 1.0,
  'platform': 0.5,
};

// ─── 坐标变换（物理坐标 → 屏幕坐标）───
// 物理坐标系：原点左上，X 向右，Y 向下
// Cocos 屏幕坐标：原点画布中心，X 向右，Y 向上

/** 物理 X → 屏幕 X */
export function worldToScreenX(x: number, cameraX: number): number {
  return x - cameraX - VIEW_WIDTH / 2;
}

/** 物理 Y → Cocos 屏幕 Y（Y 轴翻转） */
export function worldToScreenY(y: number): number {
  return VIEW_HEIGHT / 2 - y;
}

/** 计算瓦片节点在 Cocos 屏幕上的 Y 位置 */
export function calcTileCocosY(platformY: number, standingRatio: number, tileH: number): number {
  return worldToScreenY(platformY + standingRatio * tileH);
}
