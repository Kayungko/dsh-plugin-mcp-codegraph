/**
 * dsh-plugin-mcp-codegraph — mount CodeGraph as a DSH MCP server.
 *
 * CodeGraph (`codegraph serve --mcp`) exposes code-intelligence tools
 * (explore / node / query / callers / callees / impact / context …) over MCP
 * stdio. This plugin mounts @deepseek-ai/dsh-mcp-client with that stdio server,
 * following the @openviking/dsh-memory-plugin precedent (ctx.plugin(mcpClient,
 * {transport, serverName, command, args, env})), so the tools register as
 * mcp__codegraph__*.
 *
 * Windows command note: `codegraph` on PATH is a `.cmd` wrapper, which cannot be
 * spawned directly as a stdio child. We therefore invoke the CodeGraph-bundled
 * node.exe directly with the same flags the wrapper uses, pointing at
 * lib/dist/bin/codegraph.js.
 *
 * Single-project note: `codegraph serve --mcp` serves ONE project index. The
 * DSH MCP bridge does not forward a per-session rootUri, so the project is
 * pinned via `-p <projectPath>` (configurable). Queries always target that
 * project regardless of the session's cwd.
 */

import * as mcpClient from '@deepseek-ai/dsh-mcp-client';
import { join } from 'node:path';
import { resolveConfig, resolveCodegraphRoot } from './config.mjs';

export const name = 'mcp-codegraph';
export const inject = [];

export function apply(ctx, input = {}) {
  const config = resolveConfig(input);
  if (!config.enabled) {
    ctx.logger?.info?.('mcp-codegraph: disabled by config; nothing mounted');
    return;
  }
  const root = resolveCodegraphRoot(config.codegraphRoot);
  const nodeExe = join(root, 'node.exe');
  const cli = join(root, 'lib', 'dist', 'bin', 'codegraph.js');
  const args = ['--liftoff-only', '--disable-warning=ExperimentalWarning', cli, 'serve', '--mcp'];
  if (config.projectPath.trim().length > 0) args.push('-p', config.projectPath.trim());
  try {
    ctx.plugin(mcpClient, {
      transport: 'stdio',
      serverName: 'codegraph',
      command: nodeExe,
      args,
      env: {},
    });
    ctx.logger?.info?.(`mcp-codegraph: mounted codegraph MCP (project: ${config.projectPath || '(cwd)'})`);
  } catch (error) {
    ctx.logger?.warn?.(`mcp-codegraph: mount failed (${error?.message ?? error})`);
  }
}
