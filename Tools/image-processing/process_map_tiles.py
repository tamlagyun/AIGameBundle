"""处理AI生成的地图瓦片图片——冒险岛风格"""
import os
from PIL import Image

WORKSPACE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUTPUT_DIR = os.path.join(WORKSPACE, "output")
ART_DIR = os.path.join(WORKSPACE, "HeroBattleBeasts", "assets", "resources", "art", "map")

os.makedirs(ART_DIR, exist_ok=True)

# 源文件
SRC_GROUND = os.path.join(OUTPUT_DIR, "jimeng_1783672903_1.png")
SRC_PLATFORM = os.path.join(OUTPUT_DIR, "jimeng_1783672915_1.png")
SRC_BG = os.path.join(OUTPUT_DIR, "jimeng_1783672937_1.png")


def find_content_band(img: Image.Image, threshold: int = 230):
    """找到图像中非白色内容的纵向范围 (top_y, bottom_y)"""
    w, h = img.size
    pixels = img.load()
    top_y = h
    bottom_y = 0
    for y in range(h):
        non_white_count = 0
        for x in range(0, w, 5):  # 采样加速
            r, g, b = pixels[x, y][:3]
            if not (r > threshold and g > threshold and b > threshold):
                non_white_count += 1
        if non_white_count > w // 50:  # 超过2%非白即算内容
            top_y = min(top_y, y)
            bottom_y = max(bottom_y, y)
    return top_y, bottom_y


def process_ground():
    """地面瓦片：256x80，从内容带底部裁剪（排除天空）"""
    img = Image.open(SRC_GROUND).convert("RGBA")
    w, h = img.size  # 1024x1024

    # 找内容带
    top_y, bottom_y = find_content_band(img)
    content_h = bottom_y - top_y
    print(f"[ground] 内容区域: y={top_y}~{bottom_y} (高度{content_h}px)")

    # 内容带底部区域最富内容（天空在顶部），从底部向上取 320px
    crop_h = 320
    crop_top = max(0, bottom_y - crop_h)
    crop_bottom = bottom_y

    # 如果内容带不够320px，向上补充
    if crop_bottom - crop_top < crop_h:
        crop_top = max(0, crop_bottom - crop_h)

    strip = img.crop((0, crop_top, w, crop_bottom))
    print(f"  裁剪: y={crop_top}~{crop_bottom} ({strip.height}px)")

    ratio = 256 / w
    new_h = int(strip.height * ratio)
    strip = strip.resize((256, new_h), Image.LANCZOS)

    # 取底部80px
    if strip.height > 80:
        strip = strip.crop((0, strip.height - 80, 256, strip.height))
    elif strip.height < 80:
        padded = Image.new("RGBA", (256, 80), (0, 0, 0, 0))
        padded.paste(strip, (0, 80 - strip.height))
        strip = padded

    dst = os.path.join(ART_DIR, "ground_tile.png")
    strip.save(dst, "PNG")
    print(f"[ground] {img.size} -> {strip.size} -> {dst}")
    return dst


def process_platform():
    """浮空平台瓦片：256x36，从内容带颜色最丰富的区域裁剪"""
    img = Image.open(SRC_PLATFORM).convert("RGBA")
    w, h = img.size

    top_y, bottom_y = find_content_band(img)
    content_h = bottom_y - top_y
    print(f"[platform] 内容区域: y={top_y}~{bottom_y} (高度{content_h}px)")

    # 从内容带中心取 144px（颜色最丰富的区域）
    crop_h = 144
    center_y = (top_y + bottom_y) // 2
    crop_top = center_y - crop_h // 2
    crop_bottom = crop_top + crop_h

    # 边界修正
    if crop_top < 0:
        crop_top = 0
        crop_bottom = crop_h
    if crop_bottom > h:
        crop_bottom = h
        crop_top = max(0, h - crop_h)

    strip = img.crop((0, crop_top, w, crop_bottom))
    print(f"  裁剪: y={crop_top}~{crop_bottom} ({strip.height}px)")

    ratio = 256 / w
    new_h = int(strip.height * ratio)
    strip = strip.resize((256, new_h), Image.LANCZOS)

    if strip.height > 36:
        strip = strip.crop((0, strip.height - 36, 256, strip.height))
    elif strip.height < 36:
        padded = Image.new("RGBA", (256, 36), (0, 0, 0, 0))
        padded.paste(strip, (0, 36 - strip.height))
        strip = padded

    dst = os.path.join(ART_DIR, "platform_tile.png")
    strip.save(dst, "PNG")
    print(f"[platform] {img.size} -> {strip.size} -> {dst}")
    return dst


def process_background():
    """背景图：1280x720 全景"""
    img = Image.open(SRC_BG).convert("RGBA")
    img = img.resize((1280, 720), Image.LANCZOS)
    dst = os.path.join(ART_DIR, "background.png")
    img.save(dst, "PNG")
    print(f"[bg] → {img.size} → {dst}")
    return dst


def create_meta(asset_path: str):
    """为 Cocos Creator 资源创建 .meta 文件"""
    meta_path = asset_path + ".meta"
    if os.path.exists(meta_path):
        return
    import json
    meta = {
        "ver": "1.0.5",
        "importer": "image",
        "imported": True,
        "uuid": "",
        "files": [".png"],
        "subMetas": {},
        "userData": {"imageImportType": "sprite-frame"}
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(f"  .meta created: {os.path.basename(meta_path)}")


def main():
    results = {}

    r = process_ground()
    if r:
        results["ground_tile.png"] = r
        create_meta(r)

    r = process_platform()
    if r:
        results["platform_tile.png"] = r
        create_meta(r)

    r = process_background()
    if r:
        results["background.png"] = r
        create_meta(r)

    print("\n地图瓦片处理完成！")
    for name, path in results.items():
        print(f"  {name}: {path}")


if __name__ == "__main__":
    main()
