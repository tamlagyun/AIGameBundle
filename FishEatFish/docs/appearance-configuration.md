# 《鲫鱼吃鲤鱼》角色形态配置

## 配置入口

- 形态库：`assets/resources/configs/appearance-library-player.json`
- 鲫鱼形态：`assets/resources/configs/appearance-crucian.json`
- 大王乌贼形态：`assets/resources/configs/appearance-giant-squid.json`

形态库负责声明默认形态以及可选形态配置路径。每个形态配置包含稳定 ID、显示名称、资源根目录、原图方向、游动/攻击/受击动画前缀与帧数，以及 `swimFrameDurationSeconds` 待机游动帧间隔。客户端只读取配置装配资源，不在 `GameBootstrap` 中维护具体形态文件名和播放速度。

## 运行规则

- 本地选择通过 `AppearanceStore` 保存，存储格式版本为 `1`。
- `AnimationsResManager` 统一加载和缓存所有形态的标准图、游动、攻击与受击帧，负责按配置归一原图方向，并提供当前形态和指定远端形态的资源集合；`GameBootstrap` 不再拼接玩家动作资源路径或持有多套帧数组。
- 变身只更换游动、攻击和受击表现，不改变账号、位置、生命、等级、碰撞体或已装备技能。
- 进入多人房间后，客户端发送 `appearance` 消息；服务器保存并广播 `appearanceChanged`。
- `roomSnapshot`、`stateSnapshot` 和 `stateCorrection` 均携带 `appearanceId`，新加入玩家也能恢复房间内其他玩家的正确形态。
- 资源方向不一致时只修改形态配置的 `artFacingDirection` 或 `animationArtFacingDirections`，不得在移动、攻击或远端同步代码中增加独立翻转常量。

## 新增形态步骤

1. 按美术审批规则归档并生成正式 PNG 资源。
2. 建立独立形态配置并登记动画前缀、帧数和实际朝向。
3. 将配置路径加入形态库。
4. 扩展网络协议允许的形态 ID，并保持服务端白名单校验。
5. 运行客户端、服务端、结构与卫生测试，再分别在 Cocos IDE 和 Web 浏览器进行视觉验收。
