import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const root = fileURLToPath(new URL('..', import.meta.url));

const readPngHeader = (...parts) => {
  const bytes = readFileSync(join(root, ...parts));
  assert.equal(bytes.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    colorType: bytes[25]
  };
};

const readRgbaPng = (...parts) => {
  const bytes = readFileSync(join(root, ...parts));
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  assert.equal(bytes[24], 8, '只支持 8 位 PNG 测试资源');
  assert.equal(bytes[25], 6, '只支持 RGBA PNG 测试资源');
  const idat = [];
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString('ascii');
    if (type === 'IDAT') idat.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
  }
  const encoded = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const rgba = Buffer.alloc(stride * height);
  const paeth = (left, up, upperLeft) => {
    const estimate = left + up - upperLeft;
    const leftDistance = Math.abs(estimate - left);
    const upDistance = Math.abs(estimate - up);
    const upperLeftDistance = Math.abs(estimate - upperLeft);
    return leftDistance <= upDistance && leftDistance <= upperLeftDistance ? left : upDistance <= upperLeftDistance ? up : upperLeft;
  };
  for (let y = 0; y < height; y += 1) {
    const filter = encoded[y * (stride + 1)];
    for (let x = 0; x < stride; x += 1) {
      const raw = encoded[y * (stride + 1) + 1 + x];
      const left = x >= 4 ? rgba[y * stride + x - 4] : 0;
      const up = y > 0 ? rgba[(y - 1) * stride + x] : 0;
      const upperLeft = y > 0 && x >= 4 ? rgba[(y - 1) * stride + x - 4] : 0;
      const value = filter === 0 ? raw
        : filter === 1 ? raw + left
        : filter === 2 ? raw + up
        : filter === 3 ? raw + Math.floor((left + up) / 2)
        : filter === 4 ? raw + paeth(left, up, upperLeft)
        : (() => { throw new Error(`未知 PNG filter：${filter}`); })();
      rgba[y * stride + x] = value & 0xff;
    }
  }
  return { width, height, rgba };
};

test('正式海洋地图保持 16:9 高分辨率位图', () => {
  assert.deepEqual(readPngHeader('assets', 'resources', 'art', 'map', 'sea-background.png'), {
    width: 2048,
    height: 1152,
    colorType: 2
  });
});

test('UI 控件资源为带透明通道的正式 PNG', () => {
  for (const name of ['joystick-base', 'joystick-knob', 'basic-attack', 'skill-dash', 'skill-whale-swallow', 'skill-death-roll', 'skill-ink-splash', 'skill-loadout-entry', 'skill-orca-charge', 'transform-entry']) {
    const header = readPngHeader('assets', 'resources', 'art', 'ui', `${name}.png`);
    assert.equal(header.width, 1024);
    assert.equal(header.height, 1024);
    assert.equal(header.colorType, 6);
  }
  readFileSync(join(root, 'assets', 'resources', 'art', 'ui', 'skill-whale-swallow.png.meta'));
  readFileSync(join(root, 'assets', 'resources', 'art', 'ui', 'skill-death-roll.png.meta'));
  readFileSync(join(root, 'assets', 'resources', 'art', 'ui', 'skill-ink-splash.png.meta'));
  readFileSync(join(root, 'assets', 'resources', 'art', 'ui', 'skill-loadout-entry.png.meta'));
  readFileSync(join(root, 'assets', 'resources', 'art', 'ui', 'skill-orca-charge.png.meta'));
  readFileSync(join(root, 'assets', 'resources', 'art', 'ui', 'transform-entry.png.meta'));
});

test('大王乌贼包含标准形象、游动、技能攻击和受击透明序列帧', () => {
  const directory = ['assets', 'resources', 'art', 'characters', 'giant-squid'];
  assert.deepEqual(readPngHeader(...directory, 'portrait.png'), { width: 1024, height: 1024, colorType: 6 });
  readFileSync(join(root, ...directory, 'portrait.png.meta'));
  for (const [prefix, count] of [['swim', 6], ['attack', 8], ['hurt', 8]]) {
    for (let index = 0; index < count; index += 1) {
      assert.deepEqual(readPngHeader(...directory, `${prefix}-${index}.png`), { width: 512, height: 512, colorType: 6 });
      readFileSync(join(root, ...directory, `${prefix}-${index}.png.meta`));
    }
  }
});

test('大王乌贼游动主体保留透明安全边距且不再跨格截断', () => {
  const directory = ['assets', 'resources', 'art', 'characters', 'giant-squid'];
  for (let frameIndex = 0; frameIndex < 6; frameIndex += 1) {
    const { width, height, rgba } = readRgbaPng(...directory, `swim-${frameIndex}.png`);
    const opaque = (x, y) => rgba[(y * width + x) * 4 + 3] > 8;
    for (let x = 0; x < width; x += 1) {
      assert.equal(opaque(x, 0), false, `swim-${frameIndex} 顶边存在被截断像素`);
      assert.equal(opaque(x, height - 1), false, `swim-${frameIndex} 底边存在被截断像素`);
    }
    for (let y = 0; y < height; y += 1) {
      assert.equal(opaque(0, y), false, `swim-${frameIndex} 左边存在被截断像素`);
      assert.equal(opaque(width - 1, y), false, `swim-${frameIndex} 右边存在被截断像素`);
    }
  }
});

test('鱼儿生命条边框和动态填充为横向透明 PNG', () => {
  assert.deepEqual(readPngHeader('assets', 'resources', 'art', 'ui', 'health-bar-frame.png'), {
    width: 876,
    height: 310,
    colorType: 6
  });
  assert.deepEqual(readPngHeader('assets', 'resources', 'art', 'ui', 'health-bar-fill.png'), {
    width: 820,
    height: 190,
    colorType: 6
  });
  readFileSync(join(root, 'assets', 'resources', 'art', 'ui', 'health-bar-frame.png.meta'));
  readFileSync(join(root, 'assets', 'resources', 'art', 'ui', 'health-bar-fill.png.meta'));
});

test('玩家游泳动画包含六张统一尺寸的透明 PNG', () => {
  for (let index = 0; index < 6; index += 1) {
    assert.deepEqual(readPngHeader('assets', 'resources', 'art', 'characters', 'player', `swim-${index}.png`), {
      width: 256,
      height: 256,
      colorType: 6
    });
  }
});

test('玩家撕咬与甩头攻击动画包含八张统一尺寸的透明 PNG 和 .meta', () => {
  for (let index = 0; index < 8; index += 1) {
    assert.deepEqual(readPngHeader('assets', 'resources', 'art', 'characters', 'player', `bite-${index}.png`), {
      width: 256,
      height: 256,
      colorType: 6
    });
    readFileSync(join(root, 'assets', 'resources', 'art', 'characters', 'player', `bite-${index}.png.meta`));
  }
});

test('玩家翻肚受击动画包含八张统一尺寸的透明 PNG 和 .meta', () => {
  for (let index = 0; index < 8; index += 1) {
    assert.deepEqual(readPngHeader('assets', 'resources', 'art', 'characters', 'player', `hurt-${index}.png`), {
      width: 256,
      height: 256,
      colorType: 6
    });
    readFileSync(join(root, 'assets', 'resources', 'art', 'characters', 'player', `hurt-${index}.png.meta`));
  }
});
