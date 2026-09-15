# dsh-plugin-mcp-codegraph

把 CodeGraph 挂载为 DSH 的 MCP server（只读代码智能）。挂载后 DSH 会话可通过 `mcp__codegraph__*` 工具查询代码结构 / 符号 / 调用链 / 影响面。

## 原理

- CodeGraph 提供 `codegraph serve --mcp`（stdio），暴露 explore / node / query / callers / callees / impact / context 等工具。
- 本插件照 `@openviking/dsh-memory-plugin` 模板，用 `ctx.plugin(mcpClient, {transport, serverName, command, args, env})` 挂载，工具注册为 `mcp__codegraph__*`。
- Windows 下 `codegraph` 在 PATH 上是 `.cmd` 包装器（不能被 stdio 直接 spawn），因此改用 CodeGraph 自带的 `node.exe` 直跑 `lib/dist/bin/codegraph.js`，参数与 `.cmd` 完全一致。

## 两个已知限制（务必了解）

1. **单项目**：`serve --mcp` 只服务一个项目索引。DSH 的 MCP 桥不会转发会话级 rootUri，所以项目用 `-p <projectPath>` 钉死（可配置）。查询始终指向该项目，与会话 cwd 无关。
2. **索引前置**：CodeGraph 只读**已建好的索引**（`.codegraph/`）。若目标项目尚未 `codegraph init` / 索引过期，查询会空或报错——本插件不代建索引。

## 配置

插件 config（cordis 层）：

| 字段 | 默认 | 说明 |
|---|---|---|
| `enabled` | `true` | 总开关 |
| `projectPath` | `E:\P4\SGAME_o_jiarongke_6099` | 要服务的项目路径（需已 `codegraph init`） |
| `codegraphRoot` | `%LOCALAPPDATA%\codegraph\current` | CodeGraph 安装根（含 node.exe + lib/dist/bin/codegraph.js） |

## 部署

`node deploy.mjs`（复制到 profile node_modules + 注册 bundle），重启 DSH 生效。

## 验证

重启后 `/mcp` 应同时列出 `openviking` 和 `codegraph`；面板「MCP 连接」也显示两者。

## 许可

MIT
