const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const compiler = path.join(root, 'node_modules/typescript/bin/tsc');
const vite = path.join(root, 'node_modules/vite/bin/vite.js');

function compile(extra) {
  const result = spawnSync(process.execPath, [compiler, '-p', 'tsconfig.build.json', ...extra], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

compile(['--noEmit']);
// Fixed project-local output directory, never a user-supplied path.
fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
compile([]);

// The CommonJS output re-exports through __exportStar, a runtime loop, so a
// bundler cannot tree-shake it. Emit a real ES module build alongside it so
// consumers who import a single helper only pay for that helper.
const esm = spawnSync(process.execPath, [vite, 'build', '-c', 'vite.esm.config.mts'], { cwd: root, stdio: 'inherit' });
if (esm.error) throw esm.error;
if (esm.status !== 0) process.exit(esm.status || 1);

// The package is CommonJS, so mark the ES module subtree explicitly. Without
// this Node reparses every file as ESM and warns about the missing type.
fs.writeFileSync(path.join(root, 'dist/esm/package.json'), `${JSON.stringify({ type: 'module' }, null, 2)}\n`);

// The wasm kernel is built ahead of time and committed with the repository,
// so CI needs no Rust toolchain. Copy the artifacts into the published output
// instead of compiling them here. Each target gets an explicit module type:
// the web target ships ES modules, the node target ships CommonJS.
const wasmSource = path.join(root, 'rust/pkg');
if (fs.existsSync(wasmSource)) {
  const wasmTarget = path.join(root, 'dist/wasm');
  fs.rmSync(wasmTarget, { recursive: true, force: true });
  fs.cpSync(wasmSource, wasmTarget, { recursive: true });
  for (const [target, type] of [['web', 'module'], ['node', 'commonjs']]) {
    const directory = path.join(wasmTarget, target);
    if (!fs.existsSync(directory)) continue;
    // Replace the package.json that wasm-pack writes: it describes a
    // standalone package, while these files are one subpath of this package.
    fs.writeFileSync(path.join(directory, 'package.json'), `${JSON.stringify({ type }, null, 2)}\n`);
  }
  // The hand written wrappers and types sit next to the generated targets.
  for (const file of ['index.cjs', 'index.mjs', 'index.d.ts']) {
    fs.copyFileSync(path.join(root, 'wasm', file), path.join(wasmTarget, file));
  }
  console.log(`Copied the wasm kernel into ${path.relative(root, wasmTarget)}.`);
} else {
  console.warn(`No wasm kernel found at ${path.relative(root, wasmSource)}; run "npm run build:wasm" first.`);
}
