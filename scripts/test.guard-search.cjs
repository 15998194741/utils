const test = require('node:test')
const assert = require('node:assert/strict')
const u = require('../dist')

test('isObject accepts every non-null object, arrays included', () => {
  assert.equal(u.isObject({}), true)
  assert.equal(u.isObject({ a: 1 }), true)
  assert.equal(u.isObject([]), true)
  assert.equal(u.isObject(new Date()), true)
  assert.equal(u.isObject(new Map()), true)
  assert.equal(u.isObject(/re/), true)
  assert.equal(u.isObject(null), false)
  assert.equal(u.isObject(undefined), false)
  assert.equal(u.isObject('text'), false)
  assert.equal(u.isObject(42), false)
  assert.equal(
    u.isObject(() => {}),
    false,
  )
})

test('isPlainObject accepts only Object.prototype or null prototypes', () => {
  assert.equal(u.isPlainObject({}), true)
  assert.equal(u.isPlainObject({ a: 1 }), true)
  assert.equal(u.isPlainObject(Object.create(null)), true)
  assert.equal(u.isPlainObject([]), false)
  assert.equal(u.isPlainObject(new Date()), false)
  assert.equal(u.isPlainObject(new Map()), false)
  assert.equal(u.isPlainObject(new Set()), false)
  assert.equal(u.isPlainObject(null), false)
  assert.equal(u.isPlainObject('text'), false)
  class Point {
    constructor() {
      this.x = 1
    }
  }
  assert.equal(u.isPlainObject(new Point()), false)
})

test('isArray, isString and isBoolean discriminate by typeof', () => {
  assert.equal(u.isArray([]), true)
  assert.equal(u.isArray([1, 2]), true)
  assert.equal(u.isArray({ length: 0 }), false)
  assert.equal(u.isArray('ab'), false)

  assert.equal(u.isString('text'), true)
  assert.equal(u.isString(''), true)
  assert.equal(u.isString(42), false)
  assert.equal(u.isString(null), false)

  assert.equal(u.isBoolean(true), true)
  assert.equal(u.isBoolean(false), true)
  assert.equal(u.isBoolean(0), false)
  assert.equal(u.isBoolean('true'), false)
  assert.equal(u.isBoolean(null), false)
})

test('isNumber rejects NaN and non-numeric values', () => {
  assert.equal(u.isNumber(42), true)
  assert.equal(u.isNumber(0), true)
  assert.equal(u.isNumber(-1.5), true)
  assert.equal(u.isNumber(Infinity), true)
  assert.equal(u.isNumber(NaN), false)
  assert.equal(u.isNumber('42'), false)
  assert.equal(u.isNumber(null), false)
  assert.equal(u.isNumber(undefined), false)
})

test('isFunction detects callables only', () => {
  assert.equal(
    u.isFunction(() => {}),
    true,
  )
  assert.equal(
    u.isFunction(function named() {}),
    true,
  )
  assert.equal(
    u.isFunction(async () => {}),
    true,
  )
  assert.equal(u.isFunction(class Foo {}), true)
  assert.equal(u.isFunction(Math.max), true)
  assert.equal(u.isFunction({}), false)
  assert.equal(u.isFunction(null), false)
  assert.equal(u.isFunction('function'), false)
})

test('isNil matches null and undefined only', () => {
  assert.equal(u.isNil(null), true)
  assert.equal(u.isNil(undefined), true)
  assert.equal(u.isNil(0), false)
  assert.equal(u.isNil(''), false)
  assert.equal(u.isNil(false), false)
  assert.equal(u.isNil(NaN), false)
})

test('isPromise detects promises and thenables without throwing', () => {
  assert.equal(u.isPromise(Promise.resolve(1)), true)
  assert.equal(u.isPromise(new Promise(() => {})), true)
  assert.equal(u.isPromise({ then() {} }), true)
  assert.equal(u.isPromise({ then: 1 }), false)
  assert.equal(u.isPromise({}), false)
  assert.equal(u.isPromise(null), false)
  assert.equal(u.isPromise(undefined), false)
  assert.equal(u.isPromise(42), false)
  assert.equal(u.isPromise('promise'), false)
})

test('binarySearch finds hits and reports the negated insertion point', () => {
  const values = [1, 3, 5, 7, 9]
  assert.equal(u.binarySearch(values, 1), 0)
  assert.equal(u.binarySearch(values, 5), 2)
  assert.equal(u.binarySearch(values, 9), 4)
  const middle = u.binarySearch(values, 4)
  assert.equal(middle, -3)
  assert.equal(-middle - 1, 2)
  const before = u.binarySearch(values, 0)
  assert.equal(before, -1)
  assert.equal(-before - 1, 0)
  const after = u.binarySearch(values, 10)
  assert.equal(after, -6)
  assert.equal(-after - 1, 5)
})

test('binarySearch returns -1 for an empty array and keeps the input untouched', () => {
  assert.equal(u.binarySearch([], 1), -1)
  const values = Object.freeze([1, 2, 3])
  assert.equal(u.binarySearch(values, 2), 1)
  assert.equal(u.binarySearch(values, 4), -4)
  assert.deepEqual(values, [1, 2, 3])
})

test('sortedIndex returns the insertion position and the index of an equal element', () => {
  const values = [1, 3, 5, 7, 9]
  assert.equal(u.sortedIndex(values, 0), 0)
  assert.equal(u.sortedIndex(values, 1), 0)
  assert.equal(u.sortedIndex(values, 4), 2)
  assert.equal(u.sortedIndex(values, 5), 2)
  assert.equal(u.sortedIndex(values, 9), 4)
  assert.equal(u.sortedIndex(values, 10), 5)
  assert.equal(u.sortedIndex([], 1), 0)
  const frozen = Object.freeze([1, 2, 3])
  assert.equal(u.sortedIndex(frozen, 2.5), 2)
  assert.deepEqual(frozen, [1, 2, 3])
})

test('binarySearch and sortedIndex honour a custom comparator on string arrays', () => {
  const words = ['apple', 'banana', 'cherry', 'date']
  const byName = (left, right) => left.localeCompare(right)
  assert.equal(u.binarySearch(words, 'apple', byName), 0)
  assert.equal(u.binarySearch(words, 'cherry', byName), 2)
  const miss = u.binarySearch(words, 'blueberry', byName)
  assert.equal(miss, -3)
  assert.equal(-miss - 1, 2)
  assert.equal(u.sortedIndex(words, 'cherry', byName), 2)
  assert.equal(u.sortedIndex(words, 'blueberry', byName), 2)

  const byLengthDesc = (left, right) => right.length - left.length
  const longest = ['banana', 'apple', 'fig']
  assert.equal(u.binarySearch(longest, 'apple', byLengthDesc), 1)
  assert.equal(u.binarySearch(longest, 'fig', byLengthDesc), 2)
  assert.equal(u.sortedIndex(longest, 'fig', byLengthDesc), 2)
  assert.equal(u.sortedIndex(longest, 'elderberry', byLengthDesc), 0)
  assert.equal(u.sortedIndex(longest, 'kiwi', byLengthDesc), 2)
  assert.deepEqual(longest, ['banana', 'apple', 'fig'])
})
