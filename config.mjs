/**
 * Configuration resolution for dsh-plugin-mcp-codegraph.
 * Pure module: no harness imports, fully unit-testable.
 */

import { join } from 'node:path';

export const DEFAULTS = Object.freeze({
  /** Master switch. When false the plugin mounts nothing. */
  enabled: true,
  /**
   * The CodeGraph project to serve. `codegraph serve --mcp` serves ONE project
   * index, so the project must be explicit (the DSH MCP bridge does not pass a
   * per-session rootUri). Empty string = serve the process working directory
   * (usually wrong for DSH; prefer an explicit project path).
   */
  projectPath: 'E:\\P4\\SGAME_o_jiarongke_6099',
  /**
   * Override for the CodeGraph install root (defaults to
   * `%LOCALAPPDATA%\codegraph\current`, which is the version-managed "current"
   * alias). Empty string = derive from LOCALAPPDATA.
   */
  codegraphRoot: '',
});

/**
 * Resolve the CodeGraph install root directory.
 * @returns {string} absolute directory containing node.exe and lib/dist/bin/codegraph.js
 */
export function resolveCodegraphRoot(override = '') {
  if (typeof override === 'string' && override.trim().length > 0) return override.trim();
  const base = process.env.LOCALAPPDATA && process.env.LOCALAPPDATA.trim().length > 0
    ? process.env.LOCALAPPDATA.trim()
    : join(process.env.USERPROFILE || '', 'AppData', 'Local');
  return join(base, 'codegraph', 'current');
}

/**
 * Merge user config over defaults, rejecting wrong types instead of guessing.
 * @param {unknown} input raw plugin config (usually an object from cordis.yml)
 * @returns {typeof DEFAULTS & { codegraphRoot: string }}
 */
export function resolveConfig(input = {}) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const config = { ...DEFAULTS };
  if (source.enabled !== undefined) {
    if (typeof source.enabled !== 'boolean') throw new TypeError('mcp-codegraph config "enabled" must be boolean');
    config.enabled = source.enabled;
  }
  if (source.projectPath !== undefined) {
    if (typeof source.projectPath !== 'string') throw new TypeError('mcp-codegraph config "projectPath" must be string');
    config.projectPath = source.projectPath;
  }
  if (source.codegraphRoot !== undefined) {
    if (typeof source.codegraphRoot !== 'string') throw new TypeError('mcp-codegraph config "codegraphRoot" must be string');
    config.codegraphRoot = source.codegraphRoot;
  }
  return config;
}
