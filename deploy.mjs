// deploy.mjs — deploy dsh-plugin-mcp-codegraph into the DSH desktop profile.
// Same copy-based mechanism as mcp-panel/deploy.mjs.

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG = 'dsh-plugin-mcp-codegraph';
const profile = join(homedir(), '.dsh', 'profiles', 'desktop');
const target = join(profile, 'node_modules', PKG);
const manifestPath = join(profile, 'package.json');
const packageMapPath = join(profile, 'node_modules', '.package-map.json');

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const writeJson = (p, obj) => writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = join(__dirname, 'backups', `deploy-${stamp}`);
mkdirSync(backupDir, { recursive: true });
copyFileSync(manifestPath, join(backupDir, 'profile-package.json'));
if (existsSync(packageMapPath)) copyFileSync(packageMapPath, join(backupDir, 'package-map.json'));
console.log(`backup -> ${backupDir}`);

mkdirSync(target, { recursive: true });
for (const f of ['package.json', 'cordis.patch.yml', 'index.mjs', 'config.mjs', 'README.md']) {
  const from = join(__dirname, f);
  if (existsSync(from)) copyFileSync(from, join(target, f));
}
console.log(`copied plugin -> ${target}`);

const manifest = readJson(manifestPath);
if (!manifest.dependencies || typeof manifest.dependencies !== 'object') manifest.dependencies = {};
manifest.dependencies[PKG] = `file:${__dirname.replace(/\\/g, '/')}`;
const bundles = Array.isArray(manifest.dsh?.profile?.bundles) ? manifest.dsh.profile.bundles : [];
if (!bundles.includes(PKG)) bundles.push(PKG);
manifest.dsh = manifest.dsh || {};
manifest.dsh.profile = manifest.dsh.profile || {};
manifest.dsh.profile.bundles = bundles;
writeJson(manifestPath, manifest);
console.log('profile package.json updated');

if (existsSync(packageMapPath)) {
  const map = readJson(packageMapPath);
  map.packages = map.packages || {};
  if (!map.packages[PKG]) map.packages[PKG] = { url: `./${PKG}`, dependencies: { [PKG]: PKG } };
  const root = map.packages['.'] = map.packages['.'] || {};
  root.dependencies = root.dependencies || {};
  if (!(PKG in root.dependencies)) root.dependencies[PKG] = PKG;
  writeJson(packageMapPath, map);
  console.log('.package-map.json updated');
}

console.log('');
console.log('done. Restart DSH Desktop to load CodeGraph MCP.');
