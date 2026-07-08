# Cocos 运行时兼容修复说明

## 1. 问题根因

Cocos Creator 打开工程后会编译 `assets/scripts` 下的脚本。之前该目录存在几类不兼容问题：

- 部分 `.ts` 文件只有 `export declare` 声明，没有运行时实现。
- `LevelData.js` 静态导入了 Node.js 的 `node:fs`。
- 部分 `.js` 文件使用了 ES 私有字段语法。
- Cocos 入口组件 `GameAppComponent.ts` 不是具体实现类。

这些问题会导致 Cocos 编译或运行时找不到实现、无法解析 Node 模块，或在目标运行环境中报语法错误。

## 2. 当前规则

- `assets/scripts` 中禁止静态导入 Node.js 内置模块。
- `assets/scripts` 中的 `.ts` 文件必须有可运行实现，不能只写 `export declare`。
- `assets/scripts` 中的 `.js` 文件避免使用私有字段语法。
- Cocos 入口脚本必须提供具体类实现。

## 3. 验证

相关检查位于：

- `tests/cocos-runtime-compat.test.mjs`

每次运行：

```bash
npm test
npm run check
```

都会覆盖这些兼容性规则。
