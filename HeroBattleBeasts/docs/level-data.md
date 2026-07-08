# 关卡数据结构说明

## 1. 目标

第 12 步把第一关从简单扁平样例升级为更适合后续编辑和扩展的关卡数据结构。核心目标是让关卡设计可以按“出生点、遭遇组、道具组”维护，同时继续兼容当前核心玩法层。

## 2. 当前文件

- `assets/resources/configs/level-001.json`：第一关配置。
- `assets/scripts/data/LevelData.js`：运行时数据转换函数。
- `assets/scripts/data/LevelData.ts`：类型说明。
- `tests/level-data.test.mjs`：关卡数据规则测试。

## 3. 第 2 版关卡结构

`level-001.json` 当前使用 `schemaVersion: 2`。

主要字段：

- `spawnPoints.playerStart`：玩家出生点。
- `spawnPoints.exit`：出口判定区域。
- `platforms`：平台碰撞区域占位，后续接入真实 Cocos 碰撞。
- `physics`：基础物理参数，包括重力、最大下落速度和玩家碰撞体尺寸。
- `combat`：基础战斗参数，包括子弹命中区域、敌人受击区域、道具拾取区域和子弹存活时间。
- `encounters`：敌人遭遇组，每个组包含统一敌人类型和多个布点。
- `pickupGroups`：道具组，每个组包含统一道具类型和多个布点。
- `objective`：通关目标，当前为击败指定数量敌人并到达出口。

## 4. 转换规则

`createGameplayLevelConfig` 会把第 2 版关卡结构转换为核心玩法层需要的结构：

- `spawnPoints.playerStart` 转为 `playerSpawn`。
- `spawnPoints.exit` 转为 `exit`。
- `encounters[].points[]` 转为 `enemies[]`。
- `pickupGroups[].points[]` 转为 `pickups[]`。

转换后的敌人会保留 `encounterId`，转换后的道具会保留 `groupId`，用于后续调试、节点绑定和关卡编辑器定位。

## 5. 边界

关卡数据层只负责配置读取和结构转换，不负责移动、碰撞、伤害、掉落、胜负或平台 API。核心玩法规则仍保留在 `assets/scripts/core`，运行时连接仍保留在 `assets/scripts/runtime`。
