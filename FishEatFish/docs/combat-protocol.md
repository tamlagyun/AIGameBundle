# 多人战斗协议

服务端以玩家当前服务器位置和旋转进行扇形命中判定。客户端只提交 `skillId` 和客户端序号，不提交目标、伤害或生命值。

服务端广播 `skillEffect`、`hitConfirmed`、`playerDamaged`、`playerDied`、`playerRespawned` 和 `combatSettlement`。状态快照同时包含 `health`、`maxHealth`、`level` 和 `dead`。

玩家死亡后保留 WebSocket 和房间成员身份，3 秒后在默认安全区复活，并获得 3 秒无敌。经验、等级、生命和击杀数只由服务端计算，当前阶段保存在内存中。
