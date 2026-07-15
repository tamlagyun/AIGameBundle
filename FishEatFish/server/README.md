# 鲫鱼吃鲤鱼服务器

Node.js 20 + TypeScript + Fastify + WebSocket 实时房间服务。

```powershell
npm install
npm run dev
```

接口：`GET /health`、`POST /auth/register`、`POST /auth/login`、`POST /match/join`、`WSS /ws?token=...`。

当前使用内存账号和房间数据；服务器重启后数据清空。本阶段只同步多人移动，不处理战斗结算。
