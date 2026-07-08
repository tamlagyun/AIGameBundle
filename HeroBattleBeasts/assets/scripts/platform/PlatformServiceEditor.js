export class PlatformServiceEditor {
  target = 'editor';

  constructor() {
    this._storage = new Map();
    this._pauseCallbacks = new Set();
    this._resumeCallbacks = new Set();
  }

  async init() {}

  async login() {
    return { ok: true, userId: 'editor-local-user' };
  }

  async share(payload) {
    return { ok: Boolean(payload?.title) };
  }

  async showRewardAd() {
    return { rewarded: false, reason: 'editor_ad_unavailable' };
  }

  async saveData(key, value) {
    this._storage.set(key, value);
  }

  async loadData(key) {
    return this._storage.has(key) ? this._storage.get(key) : null;
  }

  vibrate() {}

  getSafeArea() {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  onPause(callback) {
    this._pauseCallbacks.add(callback);
  }

  onResume(callback) {
    this._resumeCallbacks.add(callback);
  }
}
