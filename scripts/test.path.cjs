const test = require('node:test');
const assert = require('node:assert/strict');
const u = require('../dist');
// The public entry exposes the helpers once `src/index.ts` re-exports the module;
// fall back to the compiled module so the suite also runs before that wiring lands.
const path = typeof u.set === 'function' && typeof u.unset === 'function' && typeof u.update === 'function'
  ? u
  : require('../dist/src/path');

test('path set writes single and nested paths', () => {
  assert.deepEqual(path.set({ a: 1 }, 'a', 2), { a: 2 });
  assert.deepEqual(path.set({ a: { b: 1 } }, 'a.b', 2), { a: { b: 2 } });
  assert.deepEqual(path.set({ a: { b: { c: 1 } } }, 'a.b.c', 2), { a: { b: { c: 2 } } });
});
test('path set creates missing intermediate levels', () => {
  assert.deepEqual(path.set({}, 'a.b.c', 1), { a: { b: { c: 1 } } });
  assert.deepEqual(path.set({ a: { x: 1 } }, 'a.b', 2), { a: { x: 1, b: 2 } });
});
test('path set treats an array path as literal keys', () => {
  assert.deepEqual(path.set({}, ['a.b'], 1), { 'a.b': 1 });
  assert.deepEqual(path.set({ 'a.b': 1 }, ['a.b'], 2), { 'a.b': 2 });
  assert.deepEqual(path.set({ a: { b: 1 } }, ['a', 'b'], 2), { a: { b: 2 } });
});
test('path set never modifies the input object', () => {
  const source = { a: { b: 1 }, list: [1, 2] };
  const result = path.set(source, 'a.c', 2);
  assert.notEqual(result, source);
  assert.notEqual(result.a, source.a);
  assert.equal(result.list, source.list);
  assert.deepEqual(source, { a: { b: 1 }, list: [1, 2] });
  assert.deepEqual(result, { a: { b: 1, c: 2 }, list: [1, 2] });
});
test('path set replaces a primitive intermediate level', () => {
  assert.deepEqual(path.set({ a: 'text' }, 'a.b', 1), { a: { b: 1 } });
  assert.deepEqual(path.set({ a: 3 }, 'a.b.c', 1), { a: { b: { c: 1 } } });
  const source = { a: 'text' };
  path.set(source, 'a.b', 1);
  assert.deepEqual(source, { a: 'text' });
});
test('path set rejects an empty path and a non-object target', () => {
  assert.throws(() => path.set({}, [], 1), TypeError);
  assert.throws(() => path.set(null, 'a', 1), TypeError);
  assert.throws(() => path.set(undefined, 'a', 1), TypeError);
  assert.throws(() => path.set('text', 'a', 1), TypeError);
  assert.throws(() => path.set(42, 'a', 1), TypeError);
});
test('path unset removes the property at a path', () => {
  assert.deepEqual(path.unset({ a: { b: 1 } }, 'a.b'), { a: {} });
  assert.deepEqual(path.unset({ a: 1, b: 2 }, 'a'), { b: 2 });
  assert.deepEqual(path.unset({ 'a.b': 1 }, ['a.b']), {});
});
test('path unset returns a shallow copy for a missing path or an empty path', () => {
  const source = { a: { b: 1 } };
  const missing = path.unset(source, 'a.c');
  assert.notEqual(missing, source);
  assert.deepEqual(missing, source);
  assert.equal(missing.a, source.a);
  const empty = path.unset(source, []);
  assert.notEqual(empty, source);
  assert.deepEqual(empty, source);
  assert.equal(empty.a, source.a);
});
test('path unset never modifies the input object', () => {
  const source = { a: { b: 1 }, keep: true };
  const result = path.unset(source, 'a.b');
  assert.notEqual(result, source);
  assert.notEqual(result.a, source.a);
  assert.deepEqual(source, { a: { b: 1 }, keep: true });
  assert.deepEqual(result, { a: {}, keep: true });
});
test('path unset rejects a non-object target', () => {
  assert.throws(() => path.unset(null, 'a'), TypeError);
  assert.throws(() => path.unset(undefined, 'a'), TypeError);
  assert.throws(() => path.unset('text', 'a'), TypeError);
  assert.throws(() => path.unset(42, 'a'), TypeError);
});
test('path update replaces an existing value', () => {
  assert.deepEqual(path.update({ a: { b: 1 } }, 'a.b', value => value + 1), { a: { b: 2 } });
  assert.deepEqual(path.update({ a: 1 }, 'a', value => value * 3), { a: 3 });
});
test('path update calls the updater with undefined for a missing path', () => {
  const seen = [];
  const result = path.update({}, 'a.b', value => { seen.push(value); return value === undefined ? 0 : value; });
  assert.deepEqual(seen, [undefined]);
  assert.deepEqual(result, { a: { b: 0 } });
});
test('path update propagates updater errors', () => {
  assert.throws(() => path.update({ a: 1 }, 'a', () => { throw new Error('boom'); }), /boom/);
});
test('path update never modifies the input object', () => {
  const source = { a: { b: 1 } };
  const result = path.update(source, 'a.b', value => value + 1);
  assert.notEqual(result, source);
  assert.notEqual(result.a, source.a);
  assert.deepEqual(source, { a: { b: 1 } });
  assert.deepEqual(result, { a: { b: 2 } });
});
test('path update rejects an empty path and a non-object target', () => {
  assert.throws(() => path.update({}, [], () => 1), TypeError);
  assert.throws(() => path.update(null, 'a', () => 1), TypeError);
  assert.throws(() => path.update('text', 'a', () => 1), TypeError);
});
test('path helpers keep the nested structure of the input untouched', () => {
  const source = { a: { b: { c: 1 } }, d: 2 };
  const snapshot = JSON.stringify(source);
  path.set(source, 'a.b.c', 9);
  path.unset(source, 'a.b.c');
  path.update(source, 'a.b.c', value => value + 1);
  assert.equal(JSON.stringify(source), snapshot);
  assert.deepEqual(source, { a: { b: { c: 1 } }, d: 2 });
});
