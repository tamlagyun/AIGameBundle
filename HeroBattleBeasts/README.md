# HeroBattleBeasts

`HeroBattleBeasts` 是一个计划发布到 Android、iOS、微信小游戏、抖音小游戏和鸿蒙平台的卡通 2D 横版动作小游戏。

项目目标是融合魂斗罗式跑跳射击和冒险岛式平台探索，先完成一个短关卡可玩闭环，再逐步扩展平台适配、美术、音效和发布能力。

## 当前状态

已完成：

- 第 1 步：创建独立项目目录和基础协作规则。
- 第 2 步：编写中文游戏设计文档。
- 第 3 步：编写中文跨平台技术架构文档。
- 第 4 步：创建 Cocos 兼容工程骨架、初始配置、平台抽象占位和基础测试。
- 第 5 步：实现第一批核心玩法纯逻辑，包括玩家状态、移动/跳跃意图、射击冷却、敌人受击、道具收集、伤害无敌时间和胜负条件。
- 第 6 步：实现 Cocos 运行时连接层，包括 `GameRuntime`、输入归一化和运行时视图模型。
- 第 7 步：实现 Cocos 组件接入骨架，包括入口组件占位、节点命名约定和运行时节点绑定计划。
- 第 8 步：实现最小 Web 预览原型，使用 Canvas 展示卡通占位场景、玩家、敌人、子弹、道具、HUD 和胜负状态。
- 第 9 步：建立 Cocos 场景资源骨架，包括 `MainScene.scene`、配套 `.meta` 文件、预制体命名计划和 Cocos 资源卫生文档。
- 第 10 步：创建 Cocos 预制体占位资源，包括玩家、森林史莱姆、玩家子弹、金币、武器强化和 HUD。
- 第 11 步：创建基础美术和动画占位资源，包括卡通 SVG 占位图、动画状态命名清单和配套 `.meta` 文件。
- 第 12 步：扩展第一关关卡数据结构，新增出生点、遭遇组和道具组布点规则，并接入运行时启动流程。
- 第 13 步：实现基础物理与平台碰撞逻辑，包括重力、跳跃、最大下落速度、平台落地和运行时预览接入。
- 第 14 步：实现基础子弹飞行与命中判定，包括子弹移动、生命周期、敌人受击、子弹移除和运行时接入。
- 第 15 步：实现基础敌人巡逻与接触伤害，包括巡逻边界反向、击败后停止行动和玩家无敌时间保护。
- 第 16 步：实现自动拾取与结算冻结，包括金币/武器强化自动收集，以及胜利/失败后运行时输入冻结。
- 第 17 步：实现运行时重开能力，支持胜利或失败后直接重置当前关卡，并让 Web 预览 `R` 键不刷新页面即可重开。
- 第 18 步：实现结算视图模型，统一输出胜利/失败标题、分数、金币、击败数、耗时和可重开状态。
- 第 19 步：修复 Cocos Creator 运行时兼容问题，移除 Node-only 静态依赖、`declare` 空实现和 JS 私有字段，并补充兼容性测试。
- 第 20 步：修复 `MainScene.scene` 打开报错，将说明性 JSON 替换为 Cocos Creator 可直接打开的原生 `cc.SceneAsset` 场景格式。

## 技术路线

- 引擎：Cocos Creator 3.8.x
- 语言：TypeScript
- 核心原则：玩法逻辑和平台能力分层隔离
- 目标平台：Android、iOS、微信小游戏、抖音小游戏、鸿蒙平台

## 目录结构

```text
HeroBattleBeasts/
  assets/
    animations/
    prefabs/
    scenes/
    scripts/
      cocos/
      core/
      runtime/
      platform/
      data/
      ui/
      audio/
      shared/
    resources/
      art/
      configs/
  docs/
  preview/
  scripts/
  tests/
```

## 核心玩法逻辑

核心玩法逻辑位于 `assets/scripts/core/GameState.js`，对应类型说明位于 `assets/scripts/core/GameState.ts`。

该层不依赖 Cocos，也不直接调用任何平台 API。当前覆盖：

- 由配置创建初始关卡状态。
- 玩家移动、跳跃意图和朝向。
- 基础重力、跳跃上升、下落速度限制和平台顶面落地。
- 武器冷却、子弹创建和武器强化射速。
- 子弹飞行、过期销毁和敌人命中判定。
- 敌人基础巡逻、巡逻边界反向和接触伤害。
- 敌人受击、击败计数和得分。
- 金币和武器强化道具收集。
- 玩家碰到道具时自动拾取，胜利或失败后冻结帧推进输入。
- 运行时可重开当前关卡，恢复初始玩家、敌人、道具、子弹和计时状态。
- 运行时视图模型提供结算摘要，供 Web 预览和后续 Cocos HUD 统一展示。
- 玩家受伤、无敌时间和失败状态。
- 击败目标敌人并到达出口后的胜利状态。

## 关卡数据

关卡数据转换层位于 `assets/scripts/data/LevelData.js`，对应类型说明位于 `assets/scripts/data/LevelData.ts`。

当前 `level-001.json` 使用第 2 版结构：

- `spawnPoints`：记录玩家出生点和出口区域。
- `encounters`：按遭遇组管理敌人布点，每个点会转换为核心层敌人出生数据。
- `pickupGroups`：按道具组管理金币和武器强化布点。
- `createGameplayLevelConfig`：把第 2 版结构转换为核心玩法层需要的扁平 `playerSpawn`、`enemies`、`pickups` 和 `exit`。
- `GameRuntime` 启动时会自动调用转换层，调用方可以直接传入新版关卡配置。
- `physics`：记录重力、最大下落速度和玩家碰撞体尺寸；核心层会用 `platforms` 完成基础落地判定。
- `combat`：记录子弹、敌人和道具的判定区域，以及子弹生命周期。

## 运行时连接层

运行时连接层位于 `assets/scripts/runtime`，负责把纯核心状态转换成 Cocos 场景和节点后续可以消费的数据。

当前包含：

- `GameRuntime`：持有核心 `GameState`，提供 `step`、射击、受击、收集、伤害和重开等运行时命令入口。
- `InputAdapter`：把键盘输入归一化为平台无关的 `InputCommand`。
- `RuntimeViewModel`：把核心状态转换为渲染层可读的玩家、敌人、子弹、道具、出口和 HUD 数据。

该层当前仍不直接调用平台 API，也不依赖真实 Cocos 场景节点。真实 Cocos 组件接入会在后续步骤中完成。

## Cocos 接入骨架

Cocos 接入骨架位于 `assets/scripts/cocos`，当前定义连接约定，不持有核心玩法规则。

当前包含：

- `GameAppComponent`：Cocos 主入口组件占位，声明所需层级和运行时入口。
- `CocosNodeNames`：统一维护场景层级、玩家、敌人、子弹、道具和 HUD 节点命名。
- `RuntimeNodeBinder`：把 `RuntimeViewModel` 转换为后续 Cocos 节点可执行的绑定计划。

`MainScene.scene` 当前是 Cocos Creator 可直接打开的原生场景资源，包含 `Canvas`、`Camera`、运行时层级节点和 HUD 节点。`GameApp` 节点预留给后续在 Cocos Creator 编辑器中挂载 `GameAppComponent`。

## Web 预览原型

当前提供一个轻量 Web 预览，用于在正式 Cocos 场景接入前快速观察玩法闭环。

运行命令：

```bash
npm run preview
```

默认访问：

```text
http://localhost:5178
```

预览操作：

- `A` / `ArrowLeft`：向左移动。
- `D` / `ArrowRight`：向右移动。
- `W` / `ArrowUp` / `Space`：跳跃意图。
- `J` / `Z`：射击。
- `R`：重新开始。

该预览只用于快速验证核心玩法和运行时连接，不替代后续 Cocos 正式场景。

## Cocos 场景资源骨架

当前已经建立主场景资源骨架：

- `assets/scenes/MainScene.scene`
- `assets/scenes/MainScene.scene.meta`
- `assets/animations/animation-states.json`
- `assets/prefabs/prefab-plan.json`
- `assets/prefabs/prefab-plan.json.meta`
- `assets/prefabs/PlayerRoot.prefab`
- `assets/prefabs/EnemyForestSlime.prefab`
- `assets/prefabs/PlayerBullet.prefab`
- `assets/prefabs/CoinPickup.prefab`
- `assets/prefabs/WeaponBoostPickup.prefab`
- `assets/prefabs/HudRoot.prefab`
- `assets/resources/art/characters/hero-placeholder.svg`
- `assets/resources/art/enemies/forest-slime-placeholder.svg`
- `assets/resources/art/weapons/player-bullet-placeholder.svg`
- `assets/resources/art/pickups/coin-placeholder.svg`
- `assets/resources/art/ui/hud-heart.svg`
- `assets/resources/art/ui/hud-coin.svg`
- `assets/resources/art/ui/hud-weapon.svg`
- `docs/cocos-assets.md`

Cocos 资源卫生要求：

- 新增或移动 Cocos 资源时必须同时保留对应 `.meta` 文件。
- 不提交 `library/`、`temp/`、`local/`、`build/` 等可再生成目录。
- 预制体只承载表现和节点结构，核心玩法规则仍保留在 `assets/scripts/core`。

## 本地验证

运行基础测试：

```bash
npm test
```

运行工程骨架检查：

```bash
npm run check
```

## 开发规则

本项目按步骤推进：

1. 每一步先列计划。
2. 用户已经确认后续步骤不需要等待逐步确认。
3. 列出计划后直接实施。
4. 实施后说明完成内容和验证结果。

开发说明、设计文档、架构文档、README、计划说明和协作说明默认必须使用中文；只有代码标识符、命令、API、路径和类型名等必要内容保留英文。
