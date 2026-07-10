/**
 * 共享渲染配置 —— Cocos Creator 和 Canvas Preview 共用
 * 修改站�?位置、坐标变换等只需改这一处
 */

// ─── 画布尺寸 ───
export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;

// ─── 路基站立位置比例（0=图片下沿, 0.5=图片中间, 1=图片上沿）───
export const TILE_STANDING_RATIO = {
  'ground': 1.0,    // 草地在上沿 → 人物站在图片顶部
  'platform': 0.5,  // 木板居中 → 人物站在图片中间
};

// ─── 精灵资源配置（路径 + 尺寸）───
export const SPRITE_ASSETS = [
  { path: 'art/characters/player_hero', size: [56, 80] },
  { path: 'art/enemies/forest-slime', size: [56, 56] },
  { path: 'art/pickups/coin', size: [32, 32] },
  { path: 'art/pickups/weapon-boost', size: [32, 32] },
  { path: 'art/weapons/player-bullet', size: [20, 14] },
  { path: 'art/ui/exit-sign', size: [64, 64] },
  { path: 'art/map/background', size: [1280, 720] },
  { path: 'art/map/ground_tile', size: [256, 80] },
  { path: 'art/map/platform_tile', size: [256, 36] },
];

// ─── 坐标变换（物理坐标 → 屏幕座位）───
// 物理坐标系：原点左上，X 向右，Y 向下
// Cocos 屏幕座标：原点画布中心，X 向右，Y 向上
// Canvas 屏幕座标：原点左上，X 向右，Y 向下

/**
 * 物理 X → 屏幕 X（两个渲染器通用）
 */
export function worldToScreenX(x, cameraX) {
  return x - cameraX - VIEW_WIDTH / 2;
}

/**
 * 物理 Y → Cocos 屏幕 Y（Y 轴翻转）
 */
export function worldToScreenY(y) {
  return VIEW_HEIGHT / 2 - y;
}

/**
 * 计算瓦片节点在 Cocos 屏幕上的 Y 位置
 * @param {number} platformY - 平台顶面物理 Y
 * @param {number} standingRatio - 站立比例（0~1）
 * @param {number} tileH - 瓦片图片高度（像素）
 * @returns {number} 瓦片底部在 Cocos 屏幕上的 Y
 */
export function calcTileCocosY(platformY, standingRatio, tileH) {
  return worldToScreenY(platformY + standingRatio * tileH);
}

/**
 * 计算瓦片在 Canvas 上的绘制 Y（drawImage 左上角定位）
 * @param {number} platformY - 平台顶面物理 Y
 * @param {number} standingRatio - 站立比例（0~1）
 * @param {number} platformH - 平台厚度（物理）
 * @returns {number} Canvas drawImage 的 Y 参数
 */
export function calcTileCanvasY(platformY, standingRatio, platformH) {
  return platformY - (1 - standingRatio) * platformH;
}
