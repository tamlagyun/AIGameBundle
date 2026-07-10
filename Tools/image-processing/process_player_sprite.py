"""处理AI生成的游戏精灵图：去白底 + 缩放到各元素合理尺寸"""
from PIL import Image
import os
import sys

# 工作区根目录（Tools/image-processing/ → 上两级）
WORKSPACE_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

ART = os.path.join(WORKSPACE_ROOT, "HeroBattleBeasts", "assets", "resources", "art")

# 各精灵图配置：路径 → 目标宽度（物理碰撞盒参考，视觉略大于碰撞盒）
SPRITES = {
    # 玩家主角（碰撞盒 32x48）
    os.path.join(ART, "characters", "player_hero.png"): 80,
    # 森林史莱姆敌人（碰撞盒 48x48）
    os.path.join(ART, "enemies", "forest-slime.png"): 72,
    # 金币道具（碰撞盒 32x32）
    os.path.join(ART, "pickups", "coin.png"): 40,
    # 武器增强道具（碰撞盒 32x32）
    os.path.join(ART, "pickups", "weapon-boost.png"): 40,
    # 子弹（碰撞盒 18x12）
    os.path.join(ART, "weapons", "player-bullet.png"): 24,
    # 出口标志（碰撞盒 80x80）
    os.path.join(ART, "ui", "exit-sign.png"): 80,
}


def remove_white_bg(img: Image.Image, threshold: int = 235) -> Image.Image:
    """将白色/近白色像素转为透明"""
    img = img.convert("RGBA")
    data = img.getdata()
    new_data = []
    for item in data:
        r, g, b, a = item
        if r > threshold and g > threshold and b > threshold:
            new_data.append((r, g, b, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    return img


def process_sprite(src_path: str, target_width: int) -> bool:
    """处理单个精灵图：去白底 + 等比例缩放"""
    if not os.path.exists(src_path):
        print(f"[跳过] 文件不存在: {src_path}")
        return False

    img = Image.open(src_path)
    name = os.path.basename(src_path)
    print(f"处理: {name}")
    print(f"  原始: {img.size[0]}x{img.size[1]} ({img.mode})")

    # 去白底
    img = remove_white_bg(img)

    # 等比例缩放
    ratio = target_width / img.width
    new_h = int(img.height * ratio)
    img = img.resize((target_width, new_h), Image.LANCZOS)
    print(f"  缩放: {img.size[0]}x{img.size[1]}")

    img.save(src_path, "PNG")
    print(f"  已保存")
    return True


def main():
    if "--all" in sys.argv:
        # 处理全部精灵图
        for path, width in SPRITES.items():
            process_sprite(path, width)
        return

    if len(sys.argv) > 1:
        # 按名称匹配处理
        name = sys.argv[1].lower()
        for path, width in SPRITES.items():
            if name in os.path.basename(path).lower():
                process_sprite(path, width)
                return
        # 按完整路径匹配
        for path, width in SPRITES.items():
            if name in path.lower():
                process_sprite(path, width)
                return
        print(f"未找到匹配: {name}")
        print(f"可用: {[os.path.basename(p) for p in SPRITES]}")
    else:
        print("用法:")
        print("  python process_player_sprite.py --all       # 处理全部")
        print("  python process_player_sprite.py slime       # 按名称匹配")
        print(f"可用精灵图: {[os.path.basename(p) for p in SPRITES]}")


if __name__ == "__main__":
    main()
