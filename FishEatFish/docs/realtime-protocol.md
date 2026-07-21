# 实时协议

所有消息使用 `{ protocolVersion, type, requestId?, payload }`。客户端消息为 `joinRoom`、`input`、`skill`、`appearance`、`ping`、`leaveRoom`；服务器消息包括 `roomSnapshot`、`playerJoined`、`playerRemoved`、`appearanceChanged`、`stateSnapshot`、`stateCorrection`、`skillEffect`、`skillResolved`、战斗事件、`pong` 和 `error`。

`input` 包含 `clientTick`、`moveX`、`moveY` 和 `rotation`。服务器拒绝越界输入、错误协议版本和不属于房间的玩家输入。

`skill` 当前支持 `skill-basic-bite`、`skill-dash-bite`、`skill-whale-swallow`、`skill-death-roll`、`skill-ink-splash` 和 `skill-orca-charge`。客户端提交的 `x`、`y` 和目标不参与权威命中或选目标。

## 角色形态同步

- 客户端选择形态后发送 `appearance { appearanceId }`，当前只允许 `appearance-crucian` 和 `appearance-giant-squid`。
- 服务端校验形态白名单、保存到房间内玩家状态，并向全房间广播 `appearanceChanged { playerId, appearanceId, serverTick }`。
- `roomSnapshot`、`stateSnapshot` 和 `stateCorrection` 中的每个玩家状态都携带 `appearanceId`，避免后来加入的客户端缺失已有玩家形态。
- 形态只控制客户端表现资源，不改变服务端位置、生命、等级、伤害、碰撞体或技能装配。

鲸吞成功时，`skillEffect` 附带：

```ts
{
  playerId: string;
  skillId: "skill-whale-swallow";
  targetId: string;
  x: number;
  y: number;
  effectDurationMs: 3000;
  actionSequence: number;
}
```

其中 `x/y` 是服务器将施法者瞬移后的权威位置。状态快照在效果有效期内同步 `actionTargetId` 与 `actionRemainingMs`，用于动作和透明度补偿；没有有效目标时 `skillResolved.reason` 为 `noTarget`，且不消耗服务端冷却。

## 虎鲸冲刺同步

- 客户端仍只发送统一 `skill` 消息，`skillId` 为 `skill-orca-charge`，不发送目标、伤害或顶飞终点。
- 服务器选择目标、限制冲刺与顶飞坐标并结算 60 点伤害。
- `skillEffect` 对虎鲸冲刺额外携带 `targetId`、`targetX`、`targetY` 和 `effectDurationMs`；`x/y` 是施法者权威冲刺终点，`targetX/targetY` 是目标权威顶飞终点。
- 没有前方目标时 `skillResolved.reason` 为 `noTarget`，客户端取消本次预测冷却。
