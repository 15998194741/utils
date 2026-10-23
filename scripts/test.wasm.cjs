const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// The CommonJS wrapper re-exports the node target, which instantiates the
// module synchronously at import time, so the functions are usable right away.
const cjs = require('../dist/wasm/index.cjs');
// The package entry keeps the JavaScript implementation, which is the
// reference the kernel has to agree with.
const u = require('../dist');

test('the wasm kernel is reachable through the CommonJS entry', () => {
  assert.equal(typeof cjs.md5, 'function');
  assert.equal(cjs.md5('hello'), '5d41402abc4b2a76b9719d911017c592');
});

test('the wasm binary is shipped inside the package', () => {
  for (const target of ['web', 'node']) {
    const binary = path.join(__dirname, '..', 'dist', 'wasm', target, 'index_system_wasm_bg.wasm');
    assert.ok(fs.existsSync(binary), `the .wasm file is missing from dist/wasm/${target}`);
    const bytes = fs.readFileSync(binary);
    assert.equal(bytes.subarray(0, 4).toString('hex'), '0061736d', 'not a WebAssembly module');
  }
});

test('the wasm kernel hashes exactly like the JavaScript implementation', () => {
  const cases = ['', 'hello', 'hello world', '中文测试', '🎉emoji', 'a\r\nb', 'x'.repeat(1000)];
  for (const value of cases) {
    assert.equal(cjs.md5(value), u.md5(value), `the digests differ for ${JSON.stringify(value)}`);
    assert.equal(cjs.md5(value).length, 32);
    assert.match(cjs.md5(value), /^[0-9a-f]{32}$/);
  }
});

test('the ES module entry works without an explicit init step', async () => {
  const url = new URL('../dist/wasm/index.mjs', `file://${__filename}`);
  const esm = await import(url.href);
  assert.equal(esm.md5('hello world'), '5eb63bbbe01eeed093cb22bb8f5acdc3');
  assert.equal(esm.md5('🎉emoji'), u.md5('🎉emoji'));
});
