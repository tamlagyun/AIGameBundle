import test from 'node:test';
import assert from 'node:assert/strict';
import { AppearanceStore } from '../assets/scripts/data/AppearanceStore.ts';

const appearance = (id) => ({
  schemaVersion: 2,
  id,
  displayName: id,
  portraitPath: `art/${id}`,
  resourceRoot: `art/${id}`,
  artFacingDirection: 'right',
  animationArtFacingDirections: { swim: 'right', attack: 'right', hurt: 'right' },
  animationPrefixes: { swim: 'swim', attack: 'attack', hurt: 'hurt' },
  swimFrameCount: 6,
  attackFrameCount: 8,
  hurtFrameCount: 8
});

test('形态存档可选择大王乌贼并在损坏时回退小鲫鱼', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const all = [appearance('appearance-crucian'), appearance('appearance-giant-squid')];
  const store = new AppearanceStore(all, 'appearance-crucian', storage);
  assert.equal(store.getSelected().id, 'appearance-crucian');
  assert.equal(store.select('appearance-giant-squid'), true);
  assert.equal(new AppearanceStore(all, 'appearance-crucian', storage).getSelected().id, 'appearance-giant-squid');
  values.set('fish-eat-fish.appearance.v1', JSON.stringify({ schemaVersion: 1, appearanceId: 'missing' }));
  assert.equal(new AppearanceStore(all, 'appearance-crucian', storage).getSelected().id, 'appearance-crucian');
});
