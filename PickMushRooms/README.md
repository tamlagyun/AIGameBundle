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
- `assets/resources/art/placeholder`：粗略占位美术资源，当前包含背景、树枝堆、草堆和菌子。
- `assets/scenes/GameScene.scene`：粗略可玩场景，Canvas 上绑定 `GameAppComponent`，运行时动态生成 HUD、遮挡层、菌子和通关提示。

## 粗略可玩版本

当前版本已经具备一局最小闭环：
- 打开 `GameScene.scene` 后进入测试关卡 `level-001`。
- 当前测试关卡包含 3 个堆、5 个菌子，目标拾取数量为 4。
- 点击草枝/茅草堆，逐层移除各自堆上的遮挡。
- 某个堆的遮挡移除完后，只显示该堆下面的菌子。
- 点击菌子更新拾取进度。
- 拾取达到目标数量后显示通关提示。
- 通关面板提供“重玩”按钮，可重置当前关卡。
- 点击遮挡层会有短暂缩小淡出反馈；拾取菌子会有放大淡出和 `+1` 浮动提示。

运行时节点层级固定为：
- `BackgroundLayer`：粗略背景占位。
- `PlayfieldLayer`：遮挡层和菌子等可交互玩法节点。
- `HudLayer`：目标进度和操作提示。
- `ModalLayer`：通关面板等弹窗内容。

占位美术加载策略：
- 优先加载 `assets/resources/art/placeholder` 下的 PNG texture，并在运行时转换为 `SpriteFrame`。
- 如果资源缺失，组件会回退到 `Graphics` 绘制的简单形状，保证玩法闭环仍可运行。

交互反馈策略：
- 遮挡层移除和菌子拾取使用短时 `tween`，动画结束后刷新玩法节点。
- 菌子拾取会在 HUD 层生成短暂浮动文字，提示本次拾取成功。

## Cocos 预览

1. 使用 Cocos Creator 3.8.8 打开 `F:\AIworkspace\AIGameBundle\PickMushRooms`。
2. 打开 `assets/scenes/GameScene.scene`。
3. 点击编辑器预览按钮，选择 Web 预览。
4. 在预览窗口依次点击左、中、右三个堆的遮挡层，再点击露出的菌子。
5. 通关后点击“重玩”按钮，可恢复遮挡层和菌子初始状态。

## 本地验证

```bash
node --test tests/*.test.ts
```

预览前项目检查：

```bash
npm run check
```

该命令会检查关卡结构、关键资源和 `.meta`、Cocos 脚本 `.meta`、场景挂载。若提示某个文件尚未出现在 Cocos asset-db 日志中，通常表示编辑器还没刷新导入；打开或刷新 Cocos Creator 后再运行即可。

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
