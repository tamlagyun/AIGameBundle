# 服务端目录职责

`server/src/auth` 管理测试账号、token 和平台登录端口；`matchmaking` 创建默认房间票据；`room` 管理成员与 tick；`simulation` 执行服务器移动；`protocol` 定义版本化消息；`ws` 管理 WebSocket 会话；`storage` 保留内存仓储替换点；`observability` 统一日志和指标。

客户端网络层位于 `assets/scripts/network`，负责 WebSocket、输入缓存、本地预测、快照插值和远端玩家节点注册。
