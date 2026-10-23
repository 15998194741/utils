const test = require('node:test')
const assert = require('node:assert/strict')
const u = require('../dist')

test('compose applies the functions from right to left', () => {
  const order = []
  const composed = u.compose(
    (value) => {
      order.push('first')
      return value + 1
    },
    (value) => {
      order.push('second')
      return value * 2
    },
  )
  assert.equal(composed(3), 7)
  assert.deepEqual(order, ['second', 'first'])
})

test('pipe applies the functions from left to right', () => {
  const order = []
  const piped = u.pipe(
    (value) => {
      order.push('first')
      return value + 1
    },
    (value) => {
      order.push('second')
      return value * 2
    },
  )
  assert.equal(piped(3), 8)
  assert.deepEqual(order, ['first', 'second'])
})

test('compose and pipe without functions keep the value', () => {
  const value = { a: 1 }
  assert.equal(u.compose()(value), value)
  assert.equal(u.pipe()(value), value)
  assert.equal(u.compose()(5), 5)
  assert.equal(u.pipe()(5), 5)
})

test('curry collects the arguments over several calls', () => {
  const add = (a, b) => a + b
  const addCurried = u.curry(add)
  assert.equal(addCurried(1)(2), 3)
  assert.equal(addCurried(1, 2), 3)
  assert.equal(u.curry((a, b, c) => a + b + c, 3)(1)(2)(3), 6)
})

test('curry rejects an arity that is not a positive integer', () => {
  const add = (a, b) => a + b
  assert.throws(() => u.curry(add, 0), RangeError)
  assert.throws(() => u.curry(add, -1), RangeError)
  assert.throws(() => u.curry(add, 1.5), RangeError)
  assert.throws(() => u.curry(add, NaN), RangeError)
  assert.throws(() => u.curry(add, Infinity), RangeError)
})

test('curry treats a function without parameters as arity 1', () => {
  const collect = (...args) => args.length
  assert.equal(u.curry(collect)(7), 1)
  // Without an argument the arity is not reached, so a new function comes back.
  assert.equal(typeof u.curry(collect)(), 'function')
})

test('curry appends the extra arguments and returns a new function every call', () => {
  const seen = []
  const record = (...values) => {
    seen.push(values)
    return values.length
  }
  const curried = u.curry(record, 2)
  const partial = curried(1)
  assert.equal(typeof partial, 'function')
  assert.notEqual(partial, curried)
  assert.equal(partial(2, 3), 3)
  assert.deepEqual(seen, [[1, 2, 3]])
  // The wrapped function is never modified.
  const original = (a, b) => a - b
  u.curry(original)(5)
  assert.equal(original(5, 2), 3)
})

test('debounce runs on the leading edge and merges the rest of the burst', async () => {
  const calls = []
  const debounced = u.debounce((n) => calls.push(n), 30, { leading: true })
  debounced(1)
  assert.deepEqual(calls, [1])
  debounced(2)
  debounced(3)
  assert.deepEqual(calls, [1])
  await u.sleep(80)
  assert.deepEqual(calls, [1, 3])
  debounced.cancel()
})

test('debounce forces one execution when maxWait expires inside a long burst', async () => {
  const forced = []
  const plain = []
  const bounded = u.debounce((n) => forced.push(n), 300, { maxWait: 60 })
  const unbounded = u.debounce((n) => plain.push(n), 300)
  bounded(1)
  unbounded(1)
  setTimeout(() => {
    bounded(2)
    unbounded(2)
  }, 20)
  setTimeout(() => {
    bounded(3)
    unbounded(3)
  }, 40)
  await u.sleep(150)
  // The deadline passed at ~60 ms, so the latest arguments ran once.
  assert.deepEqual(forced, [3])
  // Without maxWait the burst is still waiting for its quiet period.
  assert.deepEqual(plain, [])
  bounded.cancel()
  unbounded.cancel()
})

test('debounce flush runs the pending call and cancel drops it', async () => {
  const calls = []
  const debounced = u.debounce(
    (n) => {
      calls.push(n)
      return n * 10
    },
    50,
    { leading: true, maxWait: 100 },
  )
  debounced(1)
  assert.deepEqual(calls, [1])
  debounced(2)
  assert.equal(debounced.flush(), 20)
  assert.deepEqual(calls, [1, 2])
  debounced(3)
  debounced.cancel()
  await u.sleep(120)
  assert.deepEqual(calls, [1, 2, 3])
})

test('debounce keeps its trailing-only default behaviour', async () => {
  const calls = []
  const context = { base: 10 }
  const debounced = u.debounce(function (n) {
    calls.push(this.base + n)
    return this.base + n
  }, 20)
  debounced.call(context, 1)
  debounced.call(context, 2)
  assert.deepEqual(calls, [])
  assert.equal(debounced.flush(), 12)
  assert.deepEqual(calls, [12])
  debounced.call(context, 3)
  debounced.cancel()
  await u.sleep(60)
  assert.deepEqual(calls, [12])
  assert.throws(() => u.debounce(() => {}, -1), RangeError)
  assert.throws(() => u.debounce(() => {}, 10, { maxWait: 0 }), RangeError)
  assert.throws(() => u.debounce(() => {}, 10, { maxWait: Infinity }), RangeError)
})

test('throttle with leading false only runs at the end of the window', async () => {
  const calls = []
  const throttled = u.throttle((n) => calls.push(n), 40, { leading: false })
  throttled(1)
  throttled(2)
  throttled(3)
  assert.deepEqual(calls, [])
  await u.sleep(100)
  assert.deepEqual(calls, [3])
  throttled.cancel()
})

test('throttle runs at the start of the window by default', async () => {
  const calls = []
  const throttled = u.throttle((n) => calls.push(n), 40)
  throttled(1)
  throttled(2)
  throttled(3)
  assert.deepEqual(calls, [1])
  await u.sleep(100)
  assert.deepEqual(calls, [1, 3])
  throttled.cancel()
})

test('retry grows the wait with backoff', async () => {
  const failUntilThird = (n) => {
    if (n < 4) throw Error('boom')
    return n
  }
  const constantStart = Date.now()
  assert.equal(await u.retry(failUntilThird, { retries: 3, delay: 20 }), 4)
  const constantElapsed = Date.now() - constantStart

  const backoffStart = Date.now()
  assert.equal(await u.retry(failUntilThird, { retries: 3, delay: 20, backoff: 2 }), 4)
  const backoffElapsed = Date.now() - backoffStart

  // The waits are 20, 40 and 80 ms instead of 20, 20 and 20 ms.
  assert.ok(backoffElapsed >= 130, `expected at least 130 ms of backoff, got ${backoffElapsed}`)
  assert.ok(backoffElapsed > constantElapsed + 50, `expected a longer wait than ${constantElapsed} ms`)
})

test('retry truncates the wait with maxDelay', async () => {
  const failUntilThird = (n) => {
    if (n < 4) throw Error('boom')
    return n
  }
  const started = Date.now()
  assert.equal(await u.retry(failUntilThird, { retries: 3, delay: 20, backoff: 2, maxDelay: 25 }), 4)
  const elapsed = Date.now() - started
  // The waits are 20, 25 and 25 ms instead of 20, 40 and 80 ms.
  assert.ok(elapsed >= 60, `expected at least 60 ms of waiting, got ${elapsed}`)
  assert.ok(elapsed < 130, `expected the wait to be truncated, got ${elapsed}`)
})

test('retry rejects an invalid backoff or maxDelay', async () => {
  await assert.rejects(
    u.retry(() => 1, { backoff: 0.5 }),
    RangeError,
  )
  await assert.rejects(
    u.retry(() => 1, { backoff: 0 }),
    RangeError,
  )
  await assert.rejects(
    u.retry(() => 1, { backoff: -2 }),
    RangeError,
  )
  await assert.rejects(
    u.retry(() => 1, { backoff: Infinity }),
    RangeError,
  )
  await assert.rejects(
    u.retry(() => 1, { maxDelay: -1 }),
    RangeError,
  )
  await assert.rejects(
    u.retry(() => 1, { maxDelay: Infinity }),
    RangeError,
  )
  // A cap of zero is allowed and removes the pause entirely.
  assert.equal(
    await u.retry(
      (n) => {
        if (n < 3) throw Error('boom')
        return n
      },
      { retries: 2, delay: 10, maxDelay: 0 },
    ),
    3,
  )
})
