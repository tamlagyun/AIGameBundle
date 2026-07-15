# 本地双浏览器联机验证

1. 在 `FishEatFish/server` 执行 `npm.cmd install`（首次执行）和 `npm.cmd run dev`。
2. 确认浏览器可访问 `http://localhost:3000/health` 并看到 `ok`。
3. 用 Cocos Creator 3.8.8 启动 Web Desktop，再打开第二个浏览器客户端；两个客户端必须都连接同一个本机服务端。
4. 游戏启动后自动注册临时账号、匹配 `sea-default-001`，并通过 `ws://localhost:3000/ws` 加入默认房间。Cocos 编辑器内部预览地址为 `scene` 时，客户端会自动回退到 `localhost`，不会把 `scene:3000` 作为服务端地址。
5. 移动其中一条鱼，另一客户端应看到远端鱼同步移动。服务端控制台会记录连接与房间人数。

若服务端未启动，游戏会保留单机移动并显示“在线服务未连接，使用单机模式”。本阶段仅同步玩家可见性和移动，不包含多人攻击结算。
