# 游戏运行时层

本目录采用运行时门面模式，承接 Cocos 场景与各业务模块之间的协调，不直接承载平台 SDK。

- `GameRuntime.ts`：游戏运行时门面。负责场景资源装配、模块连接、每帧协调与销毁顺序；不挂载到场景节点。
- `SceneManager.ts`：场景节点解析、海图背景创建、镜头跟随和 HUD 坐标同步。
- `../cocos/GameBootstrap.ts`：唯一的 Cocos 场景脚本入口，仅转发 `start`、`update`、`onDestroy` 生命周期给 `GameRuntime`。
- `../input/PlayerInputController.ts`：输入适配器。将键盘与摇杆归一成移动方向，不操作玩家、相机、网络或 HUD。
- `../cocos/RoleManager.ts`：实体生命周期管理器，只创建、查询和移除 `Player`、`LocalPlayer`。
- `../cocos/AnimationsResManager.ts`：角色形态与动作资源管理器。
- `../cocos/MainUIManager.ts`：固定 HUD、技能区、右上入口和 Overlay 的创建入口。
- `../cocos/LoginFlowController.ts`：测试登录、认证、匹配、实时连接、重试与单机降级流程。
- `../network/RemotePlayerRegistry.ts`：远端玩家网络视图注册与快照、动作序列分发。

后续新增逻辑必须按职责进入以下目录：输入进入 `input/`，网络协议与会话进入 `network/`，不依赖 Cocos 的规则进入 `core/`，数据校验与存储进入 `data/`，平台实现进入 `platform/`，Cocos 角色、UI 与场景表现进入 `cocos/`，跨模块运行时协调进入 `runtime/`。禁止重新把具体玩法、UI 节点创建、网络鉴权或输入事件直接堆回 `GameBootstrap.ts`。
