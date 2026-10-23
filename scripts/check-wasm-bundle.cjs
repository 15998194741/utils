const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

/**
 * Checks that the wasm entry survives bundling.
 *
 * The trap: a package that declares `sideEffects: false` tells the bundler
 * that none of its modules have side effects, so the bundler is free to drop
 * the top level initialization of the wasm entry. The build still succeeds,
 * the module still exports the right functions, and the failure only shows
 * up at runtime as "Cannot read properties of undefined". This script builds
 * a probe with the same bundler the project uses and asserts that the
 * initialization survived and that the binary was emitted as an asset.
 */
const root = path.resolve(__dirname, '..');
const vite = path.join(root, 'node_modules/vite/bin/vite.js');
const workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'index-system-wasm-bundle-'));
const entry = path.join(workdir, 'entry.js');
const config = path.join(workdir, 'vite.config.mjs');
const outDir = path.join(workdir, 'dist');

fs.writeFileSync(
  entry,
  ["import { md5 } from 'index-system/wasm'", "console.log(md5('hello'))", ''].join('\n')
);
fs.writeFileSync(
  config,
  [
    "import { fileURLToPath } from 'node:url'",
    "export default {",
    "  root: fileURLToPath(new URL('.', import.meta.url)),",
    "  build: {",
    "    outDir: 'dist',",
    "    minify: false,",
    "    rollupOptions: { input: fileURLToPath(new URL('entry.js', import.meta.url)) },",
    "  },",
    "  resolve: { alias: { 'index-system/wasm': fileURLToPath(new URL('KERNEL', import.meta.url)) } },",
    "}",
    '',
  ]
    .join('\n')
    .replace('KERNEL', path.join(root, 'dist', 'wasm', 'index.mjs').replace(/\\/g, '/'))
);

const result = spawnSync(process.execPath, [vite, 'build', '-c', config], {
  cwd: workdir,
  encoding: 'utf8',
});
if (result.status !== 0) {
  console.error(result.stdout || '');
  console.error(result.stderr || '');
  console.error('The wasm probe failed to build.');
  process.exit(1);
}

const problems = [];
const assets = fs.existsSync(outDir) ? fs.readdirSync(path.join(outDir, 'assets')) : [];
const scripts = assets.filter(file => file.endsWith('.js'));
const binaries = assets.filter(file => file.endsWith('.wasm'));
const bundle = scripts.map(file => fs.readFileSync(path.join(outDir, 'assets', file), 'utf8')).join('\n');

if (!scripts.length) {
  problems.push('the probe produced no JavaScript bundle');
}
if (!/(__wbg_init|initSync)/.test(bundle)) {
  problems.push('the initialization call was removed from the bundle');
}
if (!/WebAssembly/.test(bundle)) {
  problems.push('the bundle no longer instantiates the WebAssembly module');
}
if (!binaries.length) {
  problems.push('the wasm binary was not emitted as an asset');
}

fs.rmSync(workdir, { recursive: true, force: true });

if (problems.length) {
  console.error('The wasm entry does not survive bundling:');
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error('Check the "sideEffects" field in package.json: the wasm entry has side effects and must be listed there.');
  process.exit(1);
}

console.log(`The wasm entry survives bundling: ${binaries[0]} was emitted and the initialization was kept.`);
