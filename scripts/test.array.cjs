const test = require('node:test')
const assert = require('node:assert/strict')
const u = require('../dist')

test('range builds ascending, descending and stepped sequences', () => {
  assert.deepEqual(u.range(5), [0, 1, 2, 3, 4])
  assert.deepEqual(u.range(-2), [0, -1])
  assert.deepEqual(u.range(-3), [0, -1, -2])
  assert.deepEqual(u.range(5, 0), [5, 4, 3, 2, 1])
  assert.deepEqual(u.range(1, 10, 3), [1, 4, 7])
  assert.deepEqual(u.range(5, 1, -2), [5, 3])
  assert.deepEqual(u.range(-3, 0), [-3, -2, -1])
  assert.deepEqual(u.range(0, -3), [0, -1, -2])
})

test('range keeps the end exclusive and honours an explicit step', () => {
  assert.deepEqual(u.range(5, 0, 1), [])
  assert.deepEqual(u.range(0), [])
  assert.deepEqual(u.range(1, 1), [])
  assert.deepEqual(u.range(0, 5), [0, 1, 2, 3, 4])
  assert.deepEqual(u.range(2, 6, 2), [2, 4])
  assert.deepEqual(u.range(5, 0, -1), [5, 4, 3, 2, 1])
})

test('range rejects arguments that are not finite integers', () => {
  assert.throws(() => u.range(1.5), RangeError)
  assert.throws(() => u.range(NaN), RangeError)
  assert.throws(() => u.range(Infinity), RangeError)
  assert.throws(() => u.range(0, 2.5), RangeError)
  assert.throws(() => u.range(0, NaN), RangeError)
  assert.throws(() => u.range(0, 5, 0.5), RangeError)
  assert.throws(() => u.range(0, 5, NaN), RangeError)
  assert.throws(() => u.range(0, 5, Infinity), RangeError)
  assert.throws(() => u.range(0, 5, 0), RangeError)
})

test('toArray copies arrays and expands iterables', () => {
  const source = [1, 2, 3]
  const copied = u.toArray(source)
  assert.deepEqual(copied, [1, 2, 3])
  assert.notEqual(copied, source)
  assert.deepEqual(u.toArray(new Set([1, 2])), [1, 2])
  assert.deepEqual(u.toArray(new Map([['a', 1]])), [['a', 1]])
  assert.deepEqual(
    u.toArray(
      (function* () {
        yield 1
        yield 2
      })(),
    ),
    [1, 2],
  )
})

test('toArray wraps single values and drops nullish ones', () => {
  assert.deepEqual(u.toArray(null), [])
  assert.deepEqual(u.toArray(undefined), [])
  assert.deepEqual(u.toArray(5), [5])
  assert.deepEqual(u.toArray('text'), ['t', 'e', 'x', 't'])
  assert.deepEqual(u.toArray({ a: 1 }), [{ a: 1 }])
  assert.deepEqual(u.toArray([]), [])
})

test('flatten expands nested arrays up to the requested depth', () => {
  assert.deepEqual(u.flatten([1, [2, [3, [4]]]]), [1, 2, [3, [4]]])
  assert.deepEqual(u.flatten([1, [2, [3, [4]]]], 2), [1, 2, 3, [4]])
  assert.deepEqual(u.flatten([1, [2, [3, [4]]]], 3), [1, 2, 3, 4])
  assert.deepEqual(u.flatten([]), [])
  assert.deepEqual(u.flatten([1, [2]], 0), [1, [2]])
  assert.deepEqual(u.flatten([{ a: 1 }, [{ b: 2 }]]), [{ a: 1 }, { b: 2 }])
})

test('flatten copies the input when the depth is zero', () => {
  const source = [1, [2]]
  const result = u.flatten(source, 0)
  assert.notEqual(result, source)
  assert.deepEqual(source, [1, [2]])
})

test('flatten rejects a depth that is not a non-negative integer', () => {
  assert.throws(() => u.flatten([1], -1), RangeError)
  assert.throws(() => u.flatten([1], 1.5), RangeError)
  assert.throws(() => u.flatten([1], NaN), RangeError)
  assert.throws(() => u.flatten([1], Infinity), RangeError)
})

test('first and last read the edges of the array', () => {
  assert.equal(u.first([1, 2, 3]), 1)
  assert.equal(u.last([1, 2, 3]), 3)
  assert.equal(u.first([7]), 7)
  assert.equal(u.last([7]), 7)
  assert.equal(u.first([]), undefined)
  assert.equal(u.last([]), undefined)
  assert.equal(u.first([undefined]), undefined)
  assert.equal(u.last([null]), null)
})

test('compact removes every falsy value, including 0 and the empty string', () => {
  assert.deepEqual(u.compact([0, 1, false, 2, '', 3, null, undefined, NaN]), [1, 2, 3])
  assert.deepEqual(u.compact([]), [])
  assert.deepEqual(u.compact([0, '', false, null, undefined, NaN]), [])
  assert.deepEqual(u.compact(['a', 'b']), ['a', 'b'])
  assert.deepEqual(u.compact([1, -1, -0]), [1, -1])
})

test('take returns the leading values without touching the input', () => {
  const source = Object.freeze([1, 2, 3])
  assert.deepEqual(u.take(source, 2), [1, 2])
  assert.deepEqual(u.take(source, 0), [])
  assert.deepEqual(u.take(source, -1), [])
  assert.deepEqual(u.take(source, 9), [1, 2, 3])
  assert.deepEqual(u.take([], 3), [])
  assert.deepEqual(source, [1, 2, 3])
})

test('take rejects a count that is not a finite integer', () => {
  assert.throws(() => u.take([1, 2], 1.5), RangeError)
  assert.throws(() => u.take([1, 2], NaN), RangeError)
  assert.throws(() => u.take([1, 2], Infinity), RangeError)
})

test('drop removes the leading values without touching the input', () => {
  const source = Object.freeze([1, 2, 3])
  assert.deepEqual(u.drop(source, 2), [3])
  assert.deepEqual(u.drop(source, 0), [1, 2, 3])
  assert.deepEqual(u.drop(source, -1), [1, 2, 3])
  assert.deepEqual(u.drop(source, 9), [])
  assert.deepEqual(u.drop([], 2), [])
  assert.deepEqual(source, [1, 2, 3])
  assert.notEqual(u.drop(source, 0), source)
})

test('drop rejects a count that is not a finite integer', () => {
  assert.throws(() => u.drop([1, 2], 1.5), RangeError)
  assert.throws(() => u.drop([1, 2], NaN), RangeError)
  assert.throws(() => u.drop([1, 2], Infinity), RangeError)
})

test('zip groups the values by position and pads the shorter arrays', () => {
  assert.deepEqual(u.zip([1, 2], ['a', 'b']), [
    [1, 'a'],
    [2, 'b'],
  ])
  assert.deepEqual(u.zip([1, 2], ['a', 'b', 'c']), [
    [1, 'a'],
    [2, 'b'],
    [undefined, 'c'],
  ])
  assert.deepEqual(u.zip([1, 2], ['a']), [
    [1, 'a'],
    [2, undefined],
  ])
  assert.deepEqual(u.zip([1, 2]), [[1], [2]])
  assert.deepEqual(u.zip(), [])
  assert.deepEqual(u.zip([], []), [])
})

test('zip does not modify the input arrays', () => {
  const left = Object.freeze([1, 2])
  const right = Object.freeze(['a', 'b'])
  assert.deepEqual(u.zip(left, right), [
    [1, 'a'],
    [2, 'b'],
  ])
  assert.deepEqual(left, [1, 2])
  assert.deepEqual(right, ['a', 'b'])
})

test('unzip transposes the rows and pads the shorter ones', () => {
  assert.deepEqual(
    u.unzip([
      [1, 2],
      [3, 4],
    ]),
    [
      [1, 3],
      [2, 4],
    ],
  )
  assert.deepEqual(u.unzip([[1, 2], [3]]), [
    [1, 3],
    [2, undefined],
  ])
  assert.deepEqual(u.unzip([[1], [2], [3]]), [[1, 2, 3]])
  assert.deepEqual(u.unzip([]), [])
  assert.deepEqual(u.unzip([[]]), [])
})

test('unzip does not modify the input rows', () => {
  const rows = Object.freeze([Object.freeze([1, 2]), Object.freeze([3, 4])])
  assert.deepEqual(u.unzip(rows), [
    [1, 3],
    [2, 4],
  ])
  assert.deepEqual(rows, [
    [1, 2],
    [3, 4],
  ])
})

test('arrayMove moves a value and leaves the input untouched', () => {
  const source = Object.freeze([1, 2, 3])
  assert.deepEqual(u.arrayMove(source, 0, 2), [2, 3, 1])
  assert.deepEqual(u.arrayMove(source, 2, 0), [3, 1, 2])
  assert.deepEqual(u.arrayMove(source, 0, 1), [2, 1, 3])
  assert.deepEqual(u.arrayMove([1, 2, 3], 1, 1), [1, 2, 3])
  assert.deepEqual(u.arrayMove([7], 0, 0), [7])
  assert.deepEqual(source, [1, 2, 3])
  assert.notEqual(u.arrayMove(source, 1, 1), source)
})

test('arrayMove rejects indices outside the array', () => {
  assert.throws(() => u.arrayMove([1, 2, 3], -1, 0), RangeError)
  assert.throws(() => u.arrayMove([1, 2, 3], 0, -1), RangeError)
  assert.throws(() => u.arrayMove([1, 2, 3], 3, 0), RangeError)
  assert.throws(() => u.arrayMove([1, 2, 3], 0, 3), RangeError)
  assert.throws(() => u.arrayMove([], 0, 0), RangeError)
  assert.throws(() => u.arrayMove([1, 2, 3], 0.5, 1), RangeError)
  assert.throws(() => u.arrayMove([1, 2, 3], 0, NaN), RangeError)
  assert.throws(() => u.arrayMove([1, 2, 3], Infinity, 0), RangeError)
})
