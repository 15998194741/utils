const test = require('node:test');
const assert = require('node:assert/strict');
const u = require('../dist');

test('pickBy keeps the properties the predicate accepts', () => {
  assert.deepEqual(u.pickBy({ a: 1, b: 2, c: 3 }, value => value > 1), { b: 2, c: 3 });
  assert.deepEqual(u.pickBy({ a: 1 }, () => false), {});
  assert.deepEqual(u.pickBy({}, () => true), {});
  const source = { a: 1, b: 2 };
  assert.deepEqual(u.pickBy(source, () => true), { a: 1, b: 2 });
  assert.deepEqual(source, { a: 1, b: 2 });
});

test('pickBy passes the key to the predicate and handles symbols', () => {
  const symbol = Symbol('s');
  const source = { a: 1, [symbol]: 2 };
  const seen = [];
  const result = u.pickBy(source, (value, key) => {
    seen.push(key);
    return true;
  });
  assert.deepEqual(seen, ['a', symbol]);
  assert.equal(result[symbol], 2);
});

test('omitBy drops the properties the predicate accepts', () => {
  assert.deepEqual(u.omitBy({ a: 1, b: 2, c: 3 }, value => value > 1), { a: 1 });
  assert.deepEqual(u.omitBy({ a: 1 }, () => false), { a: 1 });
  assert.deepEqual(u.omitBy({ a: 1 }, () => true), {});
  const source = { a: 1, b: 2 };
  assert.deepEqual(u.omitBy(source, value => value > 1), { a: 1 });
  assert.deepEqual(source, { a: 1, b: 2 });
});

test('defaults fills undefined properties from the fallback sources', () => {
  assert.deepEqual(u.defaults({ timeout: undefined, retries: 1 }, { timeout: 3000, retries: 5 }), { timeout: 3000, retries: 1 });
  assert.deepEqual(u.defaults({ a: undefined }, { a: 1 }, { a: 2 }), { a: 1 });
  assert.deepEqual(u.defaults({ a: undefined }, {}), { a: undefined });
  // Only properties that exist on the target are filled.
  assert.deepEqual(u.defaults({}, { a: 1 }), {});
  const source = { a: undefined };
  assert.deepEqual(u.defaults(source, { a: 7 }), { a: 7 });
  assert.equal(source.a, undefined);
});

test('assign merges the sources one level deep', () => {
  assert.deepEqual(u.assign({ a: 1 }, { b: 2 }, { a: 3 }), { a: 3, b: 2 });
  assert.deepEqual(u.assign(), {});
  assert.deepEqual(u.assign({ a: 1 }), { a: 1 });
  const first = { a: 1 };
  const second = { a: 2 };
  assert.deepEqual(u.assign(first, second), { a: 2 });
  assert.deepEqual(first, { a: 1 });
  assert.deepEqual(second, { a: 2 });
});
