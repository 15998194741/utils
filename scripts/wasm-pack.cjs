const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Wraps wasm-pack so the generated artifacts can live in the repository.
 *
 * wasm-pack writes a `.gitignore` containing `*` into every output directory,
 * because the artifacts are normally generated on demand and should not be
 * committed. This package ships the wasm kernel as a committed artifact so
 * that CI needs no Rust toolchain, so that ignore file has to go.
 *
 * Usage: node scripts/wasm-pack.cjs <web|nodejs>
 */
const root = path.resolve(__dirname, '..');
const crate = 'rust';
const target = process.argv[2];

if (!['web', 'nodejs'].includes(target)) {
  console.error('Usage: node scripts/wasm-pack.cjs <web|nodejs>');
  process.exit(1);
}

const outDir = target === 'web' ? 'pkg/web' : 'pkg/node';

const result = spawnSync(
  'wasm-pack',
  ['build', crate, '--target', target, '--out-dir', outDir, '--out-name', 'index_system_wasm', '--release'],
  { cwd: root, stdio: 'inherit' }
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);

const output = path.join(root, crate, outDir);
const ignore = path.join(output, '.gitignore');
if (fs.existsSync(ignore)) {
  fs.rmSync(ignore);
  console.log(`Removed ${path.relative(root, ignore)} so the artifacts can be committed.`);
}

// The wasm binary is identical for every target, so the package would ship
// two copies of it. The JavaScript glue resolves it relative to its own
// directory, so both copies have to stay where the glue expects them; gzip
// collapses the duplicate to almost nothing in the tarball.
const files = fs.readdirSync(output).sort();
console.log(`wasm artifacts in ${path.relative(root, output)}:`);
for (const file of files) {
  const size = fs.statSync(path.join(output, file)).size;
  console.log(`  ${file} (${size} bytes)`);
}
