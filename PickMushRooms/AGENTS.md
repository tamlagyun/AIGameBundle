# AGENTS.md instructions

<INSTRUCTIONS>
打开已经存在的项目时自动初始化，并生成 Agent 规则文件。

项目名称：上山捡菌子
目录名称：PickMushRooms

本文档是本项目的 Agent 规则文件。后续实施过程中，应根据实际约定、技术栈、目录结构、构建命令、测试命令和协作流程逐步完善。

当前技术约定：
- 使用 Cocos Creator 3.8.8 + TypeScript。
- 第一阶段优先跑通 Web 预览和核心玩法闭环。
- 核心玩法逻辑放在 `assets/scripts/core`，保持不依赖 Cocos，便于单元测试。
- 平台能力必须通过 `PlatformService` 抽象访问，不在玩法逻辑中直接调用微信、抖音、Android、iOS 或 HarmonyOS API。
- 本地核心测试命令：`node --test tests/*.test.ts`。

项目卫生约定：
- 保留并提交 `assets/`、资源 `.meta`、`settings/`、源码、测试和项目配置文件。
- 不提交 Cocos 可再生成目录和本地缓存：`library/`、`temp/`、`local/`、`build/`、`profiles/`。
- 修改或新增 Cocos 资源时，必须同时保留对应 `.meta` 文件。
</INSTRUCTIONS>
