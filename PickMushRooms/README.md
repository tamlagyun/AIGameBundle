# 上山捡菌子

轻度 2D 休闲游戏原型。玩家通过点击或拖拽拆解树枝、茅草等堆叠层，露出隐藏菌子并拾取，达到目标数量后通关。

## 技术路线

- 引擎：Cocos Creator 3.8.8
- 语言：TypeScript
- 第一阶段目标：Web 预览优先
- 后续平台顺序：微信小游戏、抖音小游戏、Android/iOS、HarmonyOS

## 当前基础能力

- `assets/scripts/core`：不依赖 Cocos 的核心玩法逻辑，可用 Node 测试。
- `assets/scripts/platform`：平台能力抽象，当前实现 `PlatformServiceWeb` 本地模拟版本。
- `assets/scripts/cocos`：Cocos 入口组件骨架，用于连接场景节点、资源加载和核心玩法。
- `assets/resources/levels`：关卡 JSON 配置。
- `assets/scenes/GameScene.scene`：粗略可玩场景，Canvas 上绑定 `GameAppComponent`，运行时动态生成 HUD、遮挡层、菌子和通关提示。

## 粗略可玩版本

当前版本已经具备一局最小闭环：
- 打开 `GameScene.scene` 后进入测试关卡 `level-001`。
- 点击草枝/茅草堆，逐层移除遮挡。
- 遮挡移除完后显示两个菌子。
- 点击菌子更新拾取进度。
- 拾取达到目标数量后显示通关提示。

## Cocos 预览

1. 使用 Cocos Creator 3.8.8 打开 `F:\AIworkspace\AIGameBundle\PickMushRooms`。
2. 打开 `assets/scenes/GameScene.scene`。
3. 点击编辑器预览按钮，选择 Web 预览。
4. 在预览窗口点击场景中央的遮挡层，再点击露出的菌子。

## 本地验证

```bash
node --test tests/*.test.ts
```

当前测试覆盖：
- 隐藏菌子不可拾取。
- 拆完堆叠层后菌子可见并可拾取。
- 拾取目标数量后关卡完成。
- Web 平台服务返回本地模拟结果。
- 关卡视图模型能反映粗略可玩场景状态。

## 项目卫生

- 需要纳入版本控制：`assets/`、`assets/**/*.meta`、`settings/`、`tests/`、`package.json`、`tsconfig.json`、`README.md`、`AGENTS.md`。
- 不纳入版本控制：`library/`、`temp/`、`local/`、`build/`、`profiles/`、`node_modules/`、日志和本地编辑器缓存。
- Cocos 资源对应的 `.meta` 文件必须和资源文件一起提交，避免 UUID 丢失导致场景引用断开。
