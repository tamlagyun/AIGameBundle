# 结算视图模型说明

## 1. 目标

第 18 步在运行时视图模型中加入结算摘要，让 Web 预览、Cocos HUD 和后续平台 UI 可以使用同一份结果数据展示胜利或失败界面。

## 2. 当前字段

`RuntimeViewModel.result` 在 `playing` 状态下为 `null`。

胜利或失败时会输出：

- `status`：`won` 或 `lost`。
- `title`：结算标题。
- `score`：当前分数。
- `coins`：当前金币数。
- `defeatedEnemies`：击败敌人数。
- `elapsedSeconds`：关卡用时，保留两位小数。
- `canRestart`：当前是否允许重开。

## 3. 使用规则

UI 层应优先读取 `view.result` 决定是否显示结算界面，不要自行根据核心状态拼装结算文案。

Web 预览已改为使用 `view.result` 绘制结算摘要。

## 4. 边界

当前结算视图不包含：

- 星级评价。
- 奖励结算。
- 多语言文案表。
- 排行榜或平台分享数据。

这些内容后续步骤再单独实现。
