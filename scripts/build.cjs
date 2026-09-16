const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const compiler = path.join(root, 'node_modules/typescript/bin/tsc');
function compile(extra) {
  const result = spawnSync(process.execPath, [compiler, '-p', 'tsconfig.build.json', ...extra], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
compile(['--noEmit']);
// Fixed project-local output directory, never a user-supplied path.
fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
compile([]);
