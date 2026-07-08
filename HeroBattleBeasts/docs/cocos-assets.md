# Cocos 资源卫生规则

## 1. 目标

本文记录 `HeroBattleBeasts` 的 Cocos 资源骨架和 `.meta` 管理规则，避免后续场景、预制体、脚本和资源引用断裂。

## 2. 当前资源骨架

当前已经建立：

- `assets/scenes/MainScene.scene`
- `assets/scenes/MainScene.scene.meta`
- `assets/prefabs/prefab-plan.json`
- `assets/prefabs/prefab-plan.json.meta`
- `assets/animations/animation-states.json`
- `assets/animations/animation-states.json.meta`
- `assets/resources/art/characters/hero-placeholder.svg`
- `assets/resources/art/enemies/forest-slime-placeholder.svg`
- `assets/resources/art/weapons/player-bullet-placeholder.svg`
- `assets/resources/art/pickups/coin-placeholder.svg`
- `assets/resources/art/pickups/weapon-boost-placeholder.svg`
- `assets/resources/art/ui/hud-heart.svg`
- `assets/resources/art/ui/hud-coin.svg`
- `assets/resources/art/ui/hud-weapon.svg`
- `assets/scenes.meta`
- `assets/animations.meta`
- `assets/prefabs.meta`
- `assets/resources.meta`
- `assets/resources/art.meta`
- `assets/scripts/cocos.meta`

`MainScene.scene` 必须保持为 Cocos Creator 可直接打开的原生场景资源格式，也就是以 `cc.SceneAsset` 开头的 JSON 数组。不得再把说明性 JSON 或临时配置直接写入 `.scene` 文件。

## 3. Cocos 资源卫生规则

- 新增或移动 Cocos 资源时必须同时保留对应 `.meta` 文件。
- 修改场景或预制体引用前，需要确认 UUID 没有被意外重建。
- 不提交 `library/`、`temp/`、`local/`、`build/` 等可再生成目录。
- 脚本入口继续通过 `assets/scripts/cocos/GameAppComponent.ts` 连接运行时层，但自定义组件应优先由 Cocos Creator 编辑器挂载并序列化，避免手写未知组件 UUID。
- 预制体只承载表现和节点结构，不承载核心玩法规则。
- 动画和美术资源只承载表现状态，不承载移动、伤害、胜负或掉落等核心玩法规则。
- 核心玩法规则仍保留在 `assets/scripts/core`。

## 4. MainScene 节点要求

`MainScene.scene` 至少需要保留以下节点：

- `Canvas`
- `Camera`
- `BackgroundLayer`
- `WorldLayer`
- `EffectsLayer`
- `HudLayer`
- `ModalLayer`
- `GameApp`
- `PlayerRoot`
- `EnemyPoolRoot`
- `BulletPoolRoot`
- `PickupPoolRoot`
- `ExitArea`
- `HudRoot`
- `HudHealthLabel`
- `HudCoinLabel`
- `HudScoreLabel`
- `HudObjectiveLabel`
- `HudWeaponLabel`

`GameApp` 节点预留给 `GameAppComponent`。当前场景先保证能被 Cocos Creator 稳定打开；后续正式接入时，应在编辑器里挂载组件并让编辑器生成正确的组件类型引用。
