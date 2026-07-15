# 实时协议

所有消息使用 `{ protocolVersion, type, requestId?, payload }`。客户端消息为 `joinRoom`、`input`、`ping`、`leaveRoom`；服务器消息为 `roomSnapshot`、`playerJoined`、`playerRemoved`、`stateSnapshot`、`stateCorrection`、`pong`、`error`。

`input` 包含 `clientTick`、`moveX`、`moveY` 和 `rotation`。服务器拒绝越界输入、错误协议版本和不属于房间的玩家输入。
