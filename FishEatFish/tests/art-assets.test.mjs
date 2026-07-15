import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

test('正式海洋地图保持 16:9 高分辨率位图', () => {
  assert.deepEqual(readPngHeader('assets', 'resources', 'art', 'map', 'sea-background.png'), {
    width: 2048,
    height: 1152,
    colorType: 2
  });
});

test('UI 控件资源为带透明通道的正式 PNG', () => {
  for (const name of ['joystick-base', 'joystick-knob', 'basic-attack', 'skill-dash']) {
    const header = readPngHeader('assets', 'resources', 'art', 'ui', `${name}.png`);
    assert.equal(header.width, 1024);
    assert.equal(header.height, 1024);
    assert.equal(header.colorType, 6);
  }
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
