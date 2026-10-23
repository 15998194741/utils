# index-system

English | [简体中文](./README.zh-CN.md)

A JavaScript utility library written in TypeScript, with helpers for arrays, objects, strings, numbers, sorting, function control, asynchronous operations, query parameters, trees, validation, browser files, and Excel reading.

[npm](https://www.npmjs.com/package/index-system) · [GitHub](https://github.com/15998194741/utils) · [Issues](https://github.com/15998194741/utils/issues) · [Changelog](./CHANGELOG.md)

> This document describes the current repository source. New APIs become available through npm only after a new release. Check that your installed version includes the features you need.

## Contents

- [Installation and usage](#installation-and-usage)
- [API](#api)
- [Compatibility and known limitations](#compatibility-and-known-limitations)
- [Local development](#local-development)
- [Publishing](#publishing)
- [Contributing](#contributing)
- [License](#license)

## Installation and usage

```bash
npm install index-system
# Or
pnpm add index-system
# Or
yarn add index-system
```

Use named imports in TypeScript projects or projects with a build tool:

```ts
import { unique, quickSort, deepClone, whatType } from 'index-system';

const numbers = [3, 1, 2, 2];
quickSort(unique(numbers)); // [1, 2, 3]
const cloned = deepClone({ tags: ['TypeScript'] });
whatType(cloned); // 'object'
```

CommonJS:

```js
const { unique } = require('index-system');
unique([1, 1, 2]); // [1, 2]
```

The package supports CommonJS through `dist/index.js` and ESM through `dist/esm/index.js`; TypeScript declarations use `dist/index.d.ts`. The `exports` map selects the appropriate entry. The default export is the string `欢迎使用`; utilities are named exports.

### Tree-shaking

The ES module entry uses static export statements, so a bundler can drop every helper the consumer does not import. Import from the package to get that behavior; the CommonJS entry cannot be tree-shaken, because CommonJS exports are resolved at runtime.

```ts
import { unique, camelCase } from 'index-system';
```

A consumer that imports only `unique` ends up with a bundle of roughly 100 bytes instead of the full 1.3 MB library, and the bundled xlsx dependency is left out entirely because only the Excel helpers import it. This works with webpack, Vite, Rollup, esbuild, and any other bundler that understands the `import` condition. The `sideEffects: false` field in package.json tells bundlers that importing the package has no side effects.

## API

### Arrays

| Function | Return value and behavior |
| --- | --- |
| `unique(values)` | A new deduplicated array, preserving first occurrence order |
| `chunk(values, size)` | An array of chunks; size must be a positive integer |
| `groupBy(values, key)` | A Map grouped by the callback result |
| `intersection(left, right)` | A deduplicated intersection in left order |
| `difference(left, right)` | A deduplicated difference in left order |
| `range(start, end?, step?)` | An array of numbers over a half-open interval |
| `toArray(value)` | Wraps a value or expands an iterable into an array |
| `flatten(values, depth?)` | Flattens nested arrays, one level by default |
| `first(values)` | The first element, or undefined for an empty array |
| `last(values)` | The last element, or undefined for an empty array |
| `compact(values)` | Removes every falsy value |
| `take(values, count)` | The first `count` elements |
| `drop(values, count)` | The elements after the first `count` ones |
| `zip(...arrays)` | Rows of the given arrays, padded with undefined |
| `unzip(rows)` | The transpose of `zip` |
| `arrayMove(values, from, to)` | A copy with one element moved |

Inputs are not mutated. Set operations use Set equality: NaN is deduplicated, and objects are compared by reference.

`range` treats the interval as half-open, so the end value is never included. When `end` is omitted the sequence runs from zero towards `start` and holds `|start|` values. The step defaults to `1`, or `-1` when the end is below the start and no step is given. `compact` follows the lodash convention and therefore also drops `0` and the empty string. `take` and `drop` accept a negative count as zero, and a count beyond the length is not an error.

```ts
import { chunk, groupBy, difference, range, flatten, compact } from 'index-system';

chunk([1, 2, 3], 2); // [[1, 2], [3]]
groupBy([{ role: 'admin' }], user => user.role).get('admin');
difference([1, 2, 3], [2]); // [1, 3]
range(5); // [0, 1, 2, 3, 4]
range(-3); // [0, -1, -2]
range(5, 0); // [5, 4, 3, 2, 1]
flatten([1, [2, [3, [4]]]]); // [1, 2, [3, [4]]]
compact([0, 1, false, 2, '', 3]); // [1, 2, 3]
```

### Objects and copying

| Function | Return value and behavior |
| --- | --- |
| `pick(object, keys)` | Selects own properties and preserves the selected TypeScript keys |
| `omit(object, keys)` | Copies enumerable own properties except the specified keys |
| `get<T>(object, path, fallback?)` | Reads through own properties only; returns T or undefined |
| `deepMerge(...objects)` | Recursively merges plain objects into a new object; arrays replace |
| `isEmpty(value)` | Checks contents or enumerable own properties for emptiness |
| `copy(value)` | Copies an object or array through JSON serialization |
| `deepClone(value)` | Recursively copies supported types and preserves the generic type |
| `copy.deepcopy(value)` | Compatibility entry for deepClone |
| `pickBy(object, predicate)` | Keeps the own properties the predicate accepts |
| `omitBy(object, predicate)` | Drops the own properties the predicate accepts |
| `defaults(object, ...sources)` | Fills the undefined properties from the sources |
| `assign(...objects)` | Merges the sources one level deep into a new object |

```ts
import { pick, get, deepMerge, deepClone, pickBy, assign } from 'index-system';

pick({ id: 1, name: 'Alice' }, ['name']); // { name: 'Alice' }
get<number>({ user: { score: 90 } }, 'user.score', 0); // 90
get<number>({ 'a.b': 5 }, ['a.b']); // 5
deepMerge({ user: { name: 'Alice' } }, { user: { score: 90 } });
const cloned = deepClone({ items: [1, null], createdAt: new Date() });
pickBy({ a: 1, b: 2, c: 3 }, value => value > 1); // { b: 2, c: 3 }
assign({ a: 1 }, { b: 2 }, { a: 3 }); // { a: 3, b: 2 }
```

get accepts dotted paths or explicit key arrays; bracket notation is not parsed. Missing properties and undefined use the fallback, while null is preserved. pick and omit support Symbol keys.

deepClone supports plain objects, arrays, Date, RegExp, Map, Set, circular references, Symbol properties, and property descriptors. Functions and other class instances retain their original references.

deepMerge merges enumerable own properties without mutating inputs. It reads getters, does not preserve property descriptors, and returns `Record<string, any>`. Cycles encountered during plain-object recursion throw; other values follow deepClone semantics.

isEmpty considers null, undefined, empty strings, empty arrays, empty Maps/Sets, and objects without enumerable own properties empty. Zero and false are not empty. copy is intended for JSON-compatible data and does not preserve special types; circular references and BigInt cause failure. Note that `copy` and `copy.deepcopy` differ: `copy` serializes through JSON, while `copy.deepcopy` is an alias of `deepClone` and keeps Dates, Maps, and Sets intact.

pickBy and omitBy look at enumerable own properties, including Symbol keys, and call the predicate with the value and the key. assign merges one level deep and never modifies its sources. defaults only fills properties that already exist on the target and are `undefined`; keys missing from the target are not added, and the first source that owns a key wins.

### Types and equality

| Function | Behavior |
| --- | --- |
| `whatType(value)` | Returns a lowercase type name such as array, object, null, undefined, or map |
| `isEqual(a, b)` | Deeply compares enumerable own properties of plain objects and arrays, including cycles |
| `objectIsEqual(a, b)` | Deeply compares two objects; the object-only name for `isEqual` |
| `shallowEqual(a, b)` | Compares one level of enumerable own properties using Object.is for values |
| `arrayIsEqual(...arrays)` | Deeply compares multiple arrays |

isEqual checks object prototypes. Date and RegExp are compared by value; other special instances by reference. whatType uses Object.prototype.toString.

```ts
import { whatType, isEqual, objectIsEqual, shallowEqual } from 'index-system';

whatType([]); // 'array'
isEqual({ a: 1, b: 2 }, { b: 2, a: 1 }); // true
objectIsEqual({ a: { b: 1 } }, { a: { b: 1 } }); // true
shallowEqual({ user: {} }, { user: {} }); // false
```

#### Legacy comparison aliases

Earlier releases shipped misspelled names. They still work, are marked `@deprecated` in the type declarations, and will be removed in the next major version.

| Deprecated | Use instead | Note |
| --- | --- | --- |
| `isRqual` | `isEqual` | Same function |
| `arrayIsRqual` | `arrayIsEqual` | Same function |
| `arrayIsRqualShallow` | `shallowEqual` | Same function |
| `objectIsRqualShallow` | `objectIsEqual` | Same function; the old name also misdescribed the comparison depth |

```ts
import { objectIsEqual, objectIsRqualShallow } from 'index-system';

objectIsRqualShallow === objectIsEqual; // true
```

### Type guards

| Function | Behavior |
| --- | --- |
| `isObject(value)` | True for any non-null object, including arrays and class instances |
| `isPlainObject(value)` | True only for objects whose prototype is `Object.prototype` or `null` |
| `isArray(value)` | True for arrays |
| `isString(value)` | True for primitive strings |
| `isNumber(value)` | True for numbers other than `NaN` |
| `isBoolean(value)` | True for primitive booleans |
| `isFunction(value)` | True for functions |
| `isNil(value)` | True for `null` and `undefined` |
| `isPromise(value)` | True for anything with a callable `then` method |

`isObject` and `isPlainObject` answer different questions: the first only rules out primitives, the second also rules out arrays, `Date`, `Map`, `Set`, and class instances. `isNumber` does not accept `NaN`. `isPromise` uses duck typing rather than `instanceof`, so it also matches plain thenables and works across realms.

```ts
import { isObject, isPlainObject, isNumber, isPromise } from 'index-system';

isObject([]); // true
isPlainObject([]); // false
isNumber(NaN); // false
isPromise({ then() {} }); // true
```

### Path operations

| Function | Return value and behavior |
| --- | --- |
| `set(object, path, value)` | A new object with the value written at the path |
| `unset(object, path)` | A new object without the property at the path |
| `update(object, path, updater)` | A new object with the path replaced by `updater(current)` |

These three are **immutable**: the input object is never modified, and every level along the path is shallow copied before the change. Missing intermediate levels are created as plain objects, and an intermediate level holding a primitive is replaced by a plain object.

Paths follow the same rules as `get`: a dotted string such as `'a.b.c'` walks several levels, while an explicit array such as `['a.b']` addresses a single literal key. `set` and `update` throw a `TypeError` for an empty path or a non-object target; `unset` returns a shallow copy when the path does not exist. `update` calls the updater with `undefined` when the path is missing, and errors thrown by the updater propagate to the caller.

```ts
import { set, unset, update } from 'index-system';

set({ a: { b: 1 } }, 'a.c', 2); // { a: { b: 1, c: 2 } }
set({}, 'a.b.c', 1); // { a: { b: { c: 1 } } }
unset({ a: { b: 1 } }, 'a.b'); // { a: {} }
update({ a: 1 }, 'a', current => current + 1); // { a: 2 }
```

### Strings

| Function | Behavior |
| --- | --- |
| `camelCase(text)` | Converts to camelCase |
| `kebabCase(text)` | Converts to kebab-case |
| `capitalize(text)` | Uppercases the first code point |
| `truncate(text, length, suffix = '...')` | Truncates to a non-negative integer length, including the suffix |

Case conversion recognizes spaces, underscores, hyphens, and English case boundaries. Truncation counts Unicode code points; a compound emoji may contain multiple code points. The suffix is also truncated if it exceeds the limit.

```ts
import { camelCase, kebabCase, truncate } from 'index-system';

camelCase('hello_world'); // 'helloWorld'
kebabCase('XMLHttpRequest'); // 'xml-http-request'
truncate('hello world', 8); // 'hello...'
```

### Numbers

| Function | Behavior |
| --- | --- |
| `clamp(value, min, max)` | Constrains a value to the range |
| `inRange(value, min, max)` | Checks an inclusive range |
| `sum(values)` | Returns the sum; empty input returns 0 |
| `average(values)` | Returns the mean; empty input returns NaN |

Bounds must not be NaN and must satisfy min <= max. These helpers use JavaScript floating-point arithmetic, not exact decimal arithmetic.

```ts
import { clamp, inRange, average } from 'index-system';

clamp(120, 0, 100); // 100
inRange(100, 0, 100); // true
average([80, 90]); // 85
```

### Sorting

All sorting functions return new shallow-copy arrays without mutating inputs. Numbers default to ascending order; other types require a comparator. A negative result places the first value earlier, zero indicates equality, and a positive result places it later. The default numeric comparator is not suitable for NaN.

| Function | Algorithm | Average / worst time complexity | Stable |
| --- | --- | --- | --- |
| `bubbleSort` | Bubble | O(n²) / O(n²) | Yes |
| `selectionSort` | Selection | O(n²) / O(n²) | No |
| `insertionSort` | Insertion | O(n²) / O(n²) | Yes |
| `shellSort` | Shell, halving gaps | Input-dependent / O(n²) | No |
| `mergeSort` | Merge | O(n log n) / O(n log n) | Yes |
| `quickSort` | Three-way quicksort | O(n log n) / O(n²) | No |
| `heapSort` | Heap | O(n log n) / O(n log n) | No |

```ts
import { quickSort, mergeSort } from 'index-system';

quickSort([3, 1, 2]); // [1, 2, 3]
quickSort([3, 1, 2], (a, b) => b - a); // [3, 2, 1]
mergeSort([{ score: 90 }, { score: 80 }], (a, b) => a.score - b.score);
```

### Function control

| Function | Behavior |
| --- | --- |
| `debounce(fn, delay, options?)` | Trailing debounce with the latest arguments and this |
| `throttle(fn, delay, options?)` | Executes immediately on the first call, then trails with the latest pending arguments |
| `once(fn)` | Caches the first successfully returned result |
| `compose(...fns)` | Applies the functions from right to left |
| `pipe(...fns)` | Applies the functions from left to right |
| `curry(fn, arity?)` | Turns a function into one that collects its arguments in steps |

Ordinary debounce and throttle calls return void. cancel() cancels pending work; flush() executes a pending call and returns its result, or undefined if nothing is pending. once can retry after a synchronous throw; returned Promises are cached, including rejected Promises.

`debounce` accepts `leading` to run on the first call of a burst instead of waiting, and `maxWait` to cap how long a call may be deferred while calls keep arriving. `throttle` accepts `leading`, which defaults to `true`; set it to `false` to only run at the end of each window. Without options, both behave exactly as before.

`compose` and `pipe` differ only in direction: `compose(f, g)(x)` is `f(g(x))` while `pipe(f, g)(x)` is `g(f(x))`. Without functions, both return the identity function. `curry` uses `fn.length` as the arity unless one is given, and returns a new function on every call.

```ts
import { debounce, compose, pipe, curry } from 'index-system';

const save = debounce((text: string) => console.log(text), 300);
save('draft');
save('final');
save.flush(); // Logs final immediately
save.cancel();

compose((x: number) => x + 1, (x: number) => x * 2)(3); // 7
pipe((x: number) => x + 1, (x: number) => x * 2)(3); // 8
curry((a: number, b: number) => a + b)(1)(2); // 3
```

### Asynchronous control

| Function | Behavior |
| --- | --- |
| `sleep(delay)` | Returns Promise<void> after the specified milliseconds |
| `retry(task, options?)` | Defaults to 3 additional retries and delay 0; task receives a 1-based attempt number |
| `withTimeout(promise, delay)` | Rejects on timeout without cancelling the underlying operation |
| `mapLimit(values, limit, mapper)` | Limits concurrency and preserves result order; mapper receives the value and index |

retries must be a non-negative integer; limit must be a positive integer. mapLimit stops scheduling new work after failure; in-flight tasks continue. All delays must be finite milliseconds between 0 and 2147483647.

`retry` waits `delay * backoff ** n` after the n-th failure, so `backoff` above 1 gives exponential backoff, and `maxDelay` caps a single wait. Both default to the unchanged behavior of a constant delay.

```ts
import { retry, mapLimit } from 'index-system';

async function example() {
  const result = await retry(() => Promise.resolve('ok'), { retries: 2, delay: 100 });
  const doubled = await mapLimit([1, 2, 3], 2, async value => value * 2);
  return { result, doubled };
}
```

### URL query parameters

parseQuery(query) accepts a query string with an optional ? prefix, not a full URL. It returns an object with a null prototype; repeated keys produce string arrays.

stringifyQuery(object) returns a string without a leading ?. Arrays repeat keys, null becomes an empty string, undefined is omitted, and numbers and booleans become strings. Encoding and decoding use URLSearchParams; spaces are encoded as +.

```ts
import { parseQuery, stringifyQuery } from 'index-system';

parseQuery('?tag=a&tag=b'); // { tag: ['a', 'b'] }, with a null prototype
stringifyQuery({ tag: ['a', 'b'], page: 1 }); // 'tag=a&tag=b&page=1'
```

### Trees

| Function | Behavior |
| --- | --- |
| `listToTree(list, { getId, getParentId })` | Shallow-copies nodes, generates children arrays, and preserves input order |
| `treeToList(roots, getChildren)` | Returns node references in preorder, retaining children |
| `findTreeNode(roots, predicate, getChildren)` | Returns the first preorder match or undefined |

listToTree does not mutate inputs and replaces existing children properties. A null/undefined parent ID or a missing parent makes a root. Node IDs cannot be null/undefined; duplicate IDs and parent cycles throw.

Traversal is iterative. Encountered cycles or repeated node references throw; searching returns immediately on a match.

```ts
import { listToTree, treeToList, findTreeNode } from 'index-system';

const tree = listToTree(
  [{ id: 1, parentId: null }, { id: 2, parentId: 1 }],
  { getId: node => node.id, getParentId: node => node.parentId },
);
treeToList(tree, node => node.children).map(node => node.id); // [1, 2]
findTreeNode(tree, node => node.id === 2, node => node.children);
```

### Format validation

These functions return boolean and check format only; they do not verify that addresses exist or numbers are valid.

| Function | Parameter | Purpose |
| --- | --- | --- |
| `isEmail` | string | Email address |
| `isId` | string | Chinese identity card number |
| `isPhoneNumer` | string or number | Phone number |
| `isDomainName` | string | Domain name |
| `isInternetUrl` | string | URL |
| `isData` | string | Date string |
| `isXml` | string | XML filename |
| `isChinese` | string | Chinese characters within the supported range |
| `isIp` | string | IPv4 address |
| `isLowerCase` | string | Lowercase English letters only |
| `isUpperCase` | string | Uppercase English letters only |
| `isAlphabets` | string | English letters only |

```ts
import { isEmail, isChinese } from 'index-system';

isEmail('alice@example.com'); // true
isChinese('你好'); // true
```

See the limitations below for the current validation rules.

### Browser file conversion

| Function | Return value | Purpose |
| --- | --- | --- |
| `fileToBase64(file, callback?)` | Promise<string> | File to Base64 Data URL |
| `base64ToFile(base, filename = 'png')` | File | Data URL to File |
| `blobToFile(blob, fileName = '', type?)` | File | Blob to File; defaults to the original MIME type, or image/png if absent |
| `fileToBlob(file, callback?)` | Promise<Blob> | File to Blob |
| `fileToUrl(file)` | string | Creates an object URL |
| `base64ToBlob(base64, mimeType?)` | Blob | Data URL to Blob |
| `blobToDataURL(blob, callback?)` | Promise<string> | Blob to Data URL |

Base64 inputs must be complete Base64 Data URLs. Read functions always return Promises and reject on read failure, abort, or callback errors.

```ts
import { fileToBase64, base64ToFile, fileToUrl } from 'index-system';

async function example(file: File) {
  const dataURL = await fileToBase64(file);
  const converted = base64ToFile(dataURL, file.name);
  const url = fileToUrl(converted);
  // Release the object URL after use.
  URL.revokeObjectURL(url);
}
```

### Excel reading

readExcelToJSON<T>(file, sheetName?) uses xlsx to read a worksheet. It defaults to the first worksheet and the row type Record<string, any>. A missing worksheet throws or rejects.

```ts
import { readExcelToJSON } from 'index-system';

type Row = { name: string; score: number };
// Node.js: a file path synchronously returns Row[].
const rows = readExcelToJSON<Row>('./scores.xlsx', 'Sheet1');

// Browser: a File returns Promise<Row[]>.
async function readUpload(file: File) {
  return await readExcelToJSON<Row>(file, 'Sheet1');
}
```

The generic describes the return type only; it does not validate row data at runtime.

### Dates

`isValidDate(value)` checks for a valid Date. `formatDate(date, pattern?)` formats local time with `YYYY`, `MM`, `DD`, `HH`, `mm`, `ss`, and `SSS`. `addDays(date, amount)` returns a new Date using local calendar arithmetic. `differenceInDays(left, right)` compares local calendar dates and ignores time-of-day and daylight-saving transitions.

```ts
import { formatDate, addDays, differenceInDays } from 'index-system';

formatDate(new Date(2024, 1, 29), 'YYYY-MM-DD'); // '2024-02-29'
addDays(new Date(2024, 1, 29), 1);
differenceInDays(new Date(2024, 2, 1), new Date(2024, 1, 28)); // 2
```

### Random values

`randomInt(min, max, random?)` returns an inclusive safe integer. `shuffle(values, random?)` returns a shuffled copy, and `sample(values, random?)` returns one value or undefined for an empty array. These three functions use Math.random by default and are not suitable for secrets; an injected generator must return a finite value in `[0, 1)`.

`uuid()` generates an RFC 4122 version 4 UUID using `crypto.randomUUID` or `crypto.getRandomValues`, and throws when secure browser-compatible crypto is unavailable.

### Storage

`createStorage(storage, prefix?)` wraps a localStorage-compatible object with `set(key, value, ttl?)`, `get(key, fallback?)`, and `remove(key)`. Values use JSON serialization. TTL is measured in milliseconds; zero expires immediately. Expired or malformed entries are removed. Serialization and underlying storage errors propagate to the caller.

```ts
import { createStorage } from 'index-system';

const cache = createStorage(localStorage, 'app:');
cache.set('profile', { name: 'Alice' }, 60_000);
cache.get('profile');
cache.remove('profile');
```

### Events

`EventEmitter<Events>` provides `on`, `once`, `off`, `emit`, `clear`, and `listenerCount`. on and once return unsubscribe functions. emit runs a snapshot of listeners synchronously in registration order and returns false when no listener exists. Listener exceptions propagate and stop the current emission.

```ts
import { EventEmitter } from 'index-system';

type Events = { change: [value: number]; close: [] };
const events = new EventEmitter<Events>();
const unsubscribe = events.on('change', value => console.log(value));
events.emit('change', 1);
unsubscribe();
```

### Data structures

- `Queue<T>`: enqueue, dequeue, peek, size, and clear.
- `Stack<T>`: push, pop, peek, size, and clear.
- `PriorityQueue<T>`: binary heap with enqueue, dequeue, peek, size, and clear. A negative comparator result gives higher priority.
- `LRUCache<K, V>`: positive-integer capacity, get, has, set, delete, clear, size, and keys. Successful get refreshes recency; keys iterate from least to most recent.

```ts
import { Queue, Stack, PriorityQueue, LRUCache } from 'index-system';

const queue = new Queue<number>();
queue.enqueue(1);
queue.enqueue(2);
queue.dequeue(); // 1

const stack = new Stack<string>();
stack.push('a');
stack.pop(); // 'a'

const priority = new PriorityQueue<number>((left, right) => left - right);
priority.enqueue(5);
priority.enqueue(1);
priority.dequeue(); // 1

const cache = new LRUCache<string, number>(2);
cache.set('a', 1);
cache.set('b', 2);
cache.get('a'); // Refreshes the recency of 'a'
cache.set('c', 3); // Evicts 'b', the least recently used entry
[...cache.keys()]; // ['a', 'c']
```

### JSON

`safeJsonParse<T>(text)` returns `{ ok: true, value }` or `{ ok: false, error }` instead of throwing for invalid JSON. Its generic is a type assertion and does not validate runtime data.

`stableStringify(value, space?)` sorts object keys recursively while preserving array order. It follows JSON.stringify behavior for unsupported primitive values and toJSON is not invoked before normalization. It is intended for plain JSON-compatible data and throws on cycles or BigInt.

```ts
import { safeJsonParse, stableStringify } from 'index-system';

safeJsonParse<{ id: number }>('{"id":1}'); // { ok: true, value: { id: 1 } }
safeJsonParse('{oops'); // { ok: false, error: SyntaxError }
stableStringify({ b: 1, a: { d: 2, c: 3 } }); // '{"a":{"c":3,"d":2},"b":1}'
```

### Math and statistics

`median(values)`, `variance(values)`, and `percentile(values, p)` require a non-empty array of finite numbers and do not mutate it. variance is population variance. percentile uses linear interpolation with p in `[0, 1]`. Calculations use ordinary JavaScript floating-point arithmetic.

```ts
import { median, variance, percentile } from 'index-system';

median([3, 1, 2]); // 2
variance([1, 2, 3]); // 0.666666...
percentile([0, 10, 20], 0.25); // 5
```

### Collections, memoization, and results

- `keyBy(values, key)` returns a Map and keeps the last value for duplicate keys.
- `countBy(values, key)` returns occurrence counts in a Map.
- `partition(values, predicate)` returns `[matches, nonMatches]` without mutating input.
- `orderBy(values, orders)` performs a stable multi-key sort. Each order is `{ iteratee, direction }` where `direction` is `'asc'` or `'desc'` and defaults to `'asc'`. A different property name is ignored rather than rejected.
- `memoize(fn)` caches by argument identity and exposes `clear()`. `memoizeAsync(fn)` also removes rejected Promise entries so later calls can retry. The receiver (`this`) is not part of the cache key.
- `tryCatch(task)` and `tryCatchAsync(task)` return a discriminated `{ ok, value/error }` Result.

```ts
import { keyBy, countBy, partition, orderBy, memoize, tryCatch } from 'index-system';

keyBy([{ id: 1 }], item => item.id); // Map(1 => { id: 1 })
countBy(['aa', 'ab', 'bc'], text => text[0]); // Map('a' => 2, 'b' => 1)
partition([1, 2, 3, 4], value => value % 2 === 0); // [[2, 4], [1, 3]]
orderBy([{ name: 'a', score: 2 }, { name: 'b', score: 1 }], [
  { iteratee: item => item.score, direction: 'desc' },
]); // [{ name: 'a', score: 2 }, { name: 'b', score: 1 }]

const double = memoize((value: number) => value * 2);
double(2); // 4
double(2); // 4, served from the cache

tryCatch(() => 1); // { ok: true, value: 1 }
tryCatch(() => {
  throw new Error('boom');
}); // { ok: false, error: Error }
```

### Assertions

`invariant(condition, message?)` narrows a truthy condition, `assertDefined(value, message?)` narrows away null and undefined, and `assertNever(value, message?)` supports exhaustive TypeScript branches. Failures throw Error.

```ts
import { invariant, assertDefined } from 'index-system';

function requireName(value: string | undefined): string {
  assertDefined(value, 'name is required');
  return value;
}

try {
  invariant(false, 'the invariant was violated');
} catch (error) {
  (error as Error).message; // 'the invariant was violated'
}
```

### Encoding

`bytesToHex` / `hexToBytes`, `utf8ToBytes` / `bytesToUtf8`, `bytesToBase64` / `base64ToBytes`, and `bytesToBase64Url` / `base64UrlToBytes` convert binary data. Invalid input throws. UTF-8 decoding is fatal, and Base64 helpers require global btoa/atob support.

```ts
import { bytesToHex, utf8ToBytes, bytesToBase64, base64UrlToBytes } from 'index-system';

bytesToHex(new Uint8Array([1, 255])); // '01ff'
utf8ToBytes('hi'); // Uint8Array [104, 105]
bytesToBase64(new Uint8Array([104, 105])); // 'aGk='
base64UrlToBytes('-_8'); // Uint8Array [251, 255]
```

### Semantic versions

`parseVersion`, `compareVersion`, and `satisfiesVersion` implement strict semantic-version parsing and precedence, including prereleases. Range matching supports exact versions, `>`, `>=`, `<`, `<=`, whitespace AND, `||` OR, caret, and tilde ranges. Wildcards, hyphen ranges, and npm's complete range grammar are not supported.

```ts
import { parseVersion, compareVersion, satisfiesVersion } from 'index-system';

parseVersion('1.2.3-beta.1'); // { major: 1, minor: 2, patch: 3, prerelease: ['beta', '1'] }
compareVersion('1.2.3', '1.10.0'); // -1
satisfiesVersion('1.2.3', '^1.0.0'); // true
satisfiesVersion('1.2.3', '~1.2.0'); // true
satisfiesVersion('2.0.0', '^1.0.0 || ^2.0.0'); // true
```

### Chinese business helpers

`isChineseIdCard` validates 15-digit legacy IDs or 18-digit IDs with date and checksum; `isChineseMobile` checks the current broad mainland mobile shape; `isBankCard` applies Luhn to 12–19 digits. `maskChineseMobile` and `maskChineseIdCard` mask valid inputs and return invalid inputs unchanged. These format checks do not verify issuance, ownership, or current carrier allocation.

```ts
import { isChineseIdCard, isChineseMobile, isBankCard, maskChineseMobile } from 'index-system';

isChineseIdCard('11010519491231002X'); // true
isChineseMobile('13800138000'); // true
isBankCard('4111111111111111'); // true, passes the Luhn check
maskChineseMobile('13800138000'); // '138****8000'
```

### Masking and polling

`maskPhone`, `maskEmail`, `maskName`, and `maskBankCard` preserve useful edges and replace the middle with `*`. They format display strings only and do not validate input.

`poll(task, options)` repeats until `isDone` returns true; `waitUntil(predicate, options)` waits for a truthy result. Options include interval, timeout, and AbortSignal. Defaults are 1000 ms and 30000 ms. The task runs immediately and at least once, even with timeout 0. Aborting is observed between attempts and does not cancel an in-flight task.

```ts
import { maskPhone, maskEmail, maskName, maskBankCard, poll } from 'index-system';

maskPhone('13800138000'); // '138****8000'
maskEmail('alice@example.com'); // 'a****@example.com'
maskName('张三丰'); // '张**'
maskBankCard('4111111111111111'); // '4111********1111'

async function example() {
  let attempts = 0;
  // Polls until the task returns a truthy value, or the timeout elapses.
  return await poll(() => ++attempts >= 3, { interval: 10, timeout: 1000 });
}
```

### Schemas

`stringSchema`, `numberSchema`, `booleanSchema`, `literalSchema`, `arraySchema`, `objectSchema`, and `unionSchema` provide lightweight runtime parsing. Every Schema supports `parse`, `safeParse`, `optional`, and `refine`; failures use `SchemaError` with a property path. objectSchema returns only declared string-keyed properties and does not coerce values.

`parse` throws a `SchemaError` on failure. `safeParse` returns `{ success: true, data }` or `{ success: false, error }` and never throws.

```ts
import { objectSchema, stringSchema, numberSchema } from 'index-system';

const user = objectSchema({
  name: stringSchema().refine(value => value.length > 0, 'Required'),
  age: numberSchema(),
  nickname: stringSchema().optional(),
});

const result = user.safeParse({ name: 'Alice', age: 20 });
if (result.success) {
  result.data.name; // 'Alice'
} else {
  result.error.path; // The path of the failing property
}
```

### Observables and state machines

`createSignal(initial)` provides get, set, update, and subscribe. Notifications are synchronous snapshots and Object.is-equal assignments are ignored. `computed(compute, dependencies)` recomputes from explicit dependencies and provides `dispose()`; `watch(signal, listener, immediate?)` returns an unsubscribe function.

`createStateMachine(config)` provides state, mutable context, send, and subscribe. Transitions may be a target state or include target, guard, and action. Guards run before actions; subscribers run synchronously only when the state changes. Unknown and blocked events return false.

```ts
import { createSignal, computed, watch, createStateMachine } from 'index-system';

const count = createSignal(1);
const doubled = computed(() => count.get() * 2, [count]);
const unsubscribe = watch(count, (value, previous) => {
  console.log(value, previous);
});
count.set(2);
doubled.get(); // 4
unsubscribe();

const machine = createStateMachine({
  initial: 'idle',
  context: { runs: 0 },
  states: {
    idle: { start: { target: 'running', action: ctx => ctx.runs++ } },
    running: { stop: { target: 'idle' } },
  },
});
machine.send('start'); // true
machine.state; // 'running'
machine.send('unknown'); // false
```

### Data differences

`objectDiff(left, right)` creates add, remove, and replace operations for plain-object properties; arrays and special objects are replaced as values. `applyPatch(value, operations)` applies operations to a deep clone and can return undefined when removing the root. `arrayDiff(left, right)` returns added and removed values using deep equality and set-style membership rather than occurrence counts.

```ts
import { objectDiff, applyPatch, arrayDiff } from 'index-system';

const operations = objectDiff({ a: 1, b: 2 }, { a: 1, b: 3, c: 4 });
// [{ op: 'replace', path: ['b'], value: 3 }, { op: 'add', path: ['c'], value: 4 }]
applyPatch({ a: 1 }, [{ op: 'replace', path: ['a'], value: 9 }]); // { a: 9 }
arrayDiff([1, 2, 3], [2, 4]); // { added: [4], removed: [1, 3] }
```

### Scheduler and units

`createScheduler(concurrency?)` queues Promise or synchronous tasks. The default concurrency is 1; higher numeric priority runs first among queued tasks, and already-running tasks are not preempted. It exposes add, onIdle, pending, and active.

`convertLength` supports mm, cm, m, km, in, ft, yd, and mi. `convertWeight` supports mg, g, kg, oz, and lb. `celsiusToFahrenheit` and `fahrenheitToCelsius` convert temperatures. Results use floating-point arithmetic and may require tolerance-based comparison.

```ts
import { createScheduler, convertLength, celsiusToFahrenheit } from 'index-system';

async function example() {
  const scheduler = createScheduler(2);
  scheduler.add(() => 'first', 10);
  scheduler.add(() => 'second');
  await scheduler.onIdle();
}

convertLength(1, 'm', 'cm'); // 100
celsiusToFahrenheit(100); // 212
```

### Search

| Function | Return value and behavior |
| --- | --- |
| `binarySearch(values, target, comparator?)` | The index of the target, or `-(insertionPoint + 1)` when it is missing |
| `sortedIndex(values, target, comparator?)` | The index the target should occupy in a sorted array |

Both expect an array that is already sorted ascending by the comparator, and neither modifies it. The default comparator uses the `<` and `>` operators. `binarySearch` follows the usual convention of returning a negative number when the target is absent, which encodes where it would be inserted. `sortedIndex` always returns that insertion point directly, so an empty array yields `0`.

```ts
import { binarySearch, sortedIndex } from 'index-system';

binarySearch([1, 3, 5, 7], 5); // 2
binarySearch([1, 3, 5, 7], 4); // -3, insert at index 2
sortedIndex([1, 3, 5, 7], 4); // 2
```

### Checksums

`md5(text)` returns the MD5 digest of a string as 32 lowercase hexadecimal characters. MD5 is a fast checksum, not a cryptographic hash: use it for file fingerprints, cache keys, and change detection, but never for password storage, signatures, or anything that needs collision resistance. Non-ASCII input is encoded as UTF-8.

```ts
import { md5 } from 'index-system';

md5('hello world'); // '5eb63bbbe01eeed093cb22bb8f5acdc3'
```

## Compatibility and known limitations

- File conversion depends on File, Blob, FileReader, atob, or URL.createObjectURL. Excel File input requires arrayBuffer(). Check that your environment provides the necessary APIs.
- Legacy exports remain available but are marked `@deprecated` in the type declarations and will be removed in the next major version: base64Tofile → base64ToFile, bolbToFile → blobToFile, fileToBolb → fileToBlob, isRqual → isEqual, arrayIsRqual → arrayIsEqual, and arrayIsRqualShallow → shallowEqual. objectIsRqualShallow retains deep-comparison behavior and now has a correctly spelled counterpart, objectIsEqual.
- Compared with the old implementation, Excel path input returns an array, File input returns a Promise, and file-conversion callback forms also return Promises. blobToFile preserves the input MIME type by default. Review affected calls when upgrading.
- `isData` remains as a legacy spelling, with `isDate` as an alias. Both validate an entire YYYY-M-D or YYYY-MM-DD calendar date. `isPhoneNumer` also retains its legacy spelling.
- Format validators check syntax only. URL validation accepts HTTP and HTTPS, domain validation requires a letter-only final label, and phone/identity checks cannot verify existence or ownership.
- MD5, the Is validation class, and the xlsx re-export in src/excel/excel.ts are not exported from the package entry.
- Browser FileReader behavior has been tested with a mock, not verified in a real browser.
- `xlsx` is installed from the official SheetJS CDN rather than the npm registry, because the registry copy is frozen at 0.18.5 and still carries the prototype-pollution and ReDoS advisories. The installed build is 0.20.3. Some scanners that read advisory ranges without an npm release to compare against may still report those two advisories against the CDN build; npm audit and the GitHub advisory API both treat 0.20.3 as fixed.

## Local development

Tests require Node.js 20 or later. The browser bundle build additionally requires Node.js 20.19 or later, or 22.12 or later, because of Vite.

```bash
git clone https://github.com/15998194741/utils.git
cd utils
npm install
npm run build
npm test
```

`npm install` fetches `xlsx` from the official SheetJS CDN, so the machine running the install needs access to cdn.sheetjs.com. When that host is unreachable, download the tarball separately and install it from disk instead: `npm install ./xlsx-0.20.3.tgz`.

build checks types, clears the project-local dist directory, and generates JavaScript and type declarations. tsconfig.build.json includes only the root entry and TypeScript files under src. Tests cover arrays, copying, equality, function control, async helpers, files, Excel, objects, strings, numbers, URLs, and trees.

The other scripts are:

| Command | Purpose |
| --- | --- |
| `npm run build:umd` | Builds the browser bundles with Vite into dist-umd |
| `npm run build:all` | Builds both the npm package and the browser bundles |
| `npm run lint` | Runs ESLint over the TypeScript sources and the build scripts |
| `npm run format` | Rewrites the sources with Prettier |
| `npm run release -- patch` | Bumps the version, builds, packs, publishes, and pushes |
| `npm run versionAdd` | Bumps the patch version only |

The GitHub Actions workflow in .github/workflows/ci.yml installs, lints, builds, tests, and verifies the packed tarball contents on Node 20.19, 22.12, and 24.

### Browser bundle

`npm run build:umd` uses Vite in library mode and writes two standalone files into dist-umd: `index-system.umd.js` for `<script>` tags and `index-system.es.js` for native ES module imports. The npm package entry is built separately into dist, so the two outputs never mix. The UMD file exposes a single global namespace instead of scattering the exports across the page.

```html
<script src="index-system.umd.js"></script>
<script>
  console.log(indexSystem.unique([1, 1, 2])); // [1, 2]
  console.log(indexSystem.camelCase('hello-world')); // 'helloWorld'
</script>
```

The UMD bundle embeds xlsx, so it runs from a single file with no additional dependencies.

The browser bundle is configured by vite.config.mts. It is checked by tsconfig.node.json, because Vite 8 ships its type declarations only through an `exports` map and the package itself is CommonJS.

```text
src/
├── array/       # Arrays
├── object/      # Objects
├── string/      # Strings
├── number/      # Numbers
├── sort/        # Sorting
├── function/    # Function control
├── async/       # Async control
├── url/         # Query parameters
├── tree/        # Trees
├── utils/       # Copying, types, and equality
├── regular/     # Format validation
├── file/        # File conversion
├── excel/       # Excel reading
├── encry/       # MD5, not exported from the package entry
├── date/        # Local calendar helpers
├── random/      # Random values and UUIDs
├── storage/     # JSON storage with TTL
├── event/       # Typed event emitter
├── data-structure/ # Queue, stack, priority queue, and LRU cache
├── json/        # Safe parsing and stable serialization
├── math/        # Statistics
├── collection/  # Grouping, partitioning, and ordering
├── memoize/     # Sync and async memoization
├── result/      # Exception-to-result helpers
├── assert/      # Runtime assertions and type narrowing
├── encoding/    # Hex, UTF-8, Base64, and Base64URL
├── semver/      # Semantic version parsing and ranges
├── chinese/     # Chinese ID, phone, bank card, and masking helpers
├── mask/        # Display masking
├── polling/     # Polling and condition waiting
├── schema/      # Runtime parsing and validation
├── observable/  # Signals, computed values, and watches
├── state-machine/ # Finite state machines
├── diff/        # Object patches and array differences
├── scheduler/   # Priority-aware concurrency scheduler
├── unit/        # Length, weight, and temperature conversion
└── index.ts     # Module exports
```

## Publishing

The release script performs the whole sequence: it checks the working tree, verifies the types, commits the pending changes, bumps the version, builds, inspects the packed tarball, publishes it to the npm registry, and pushes the commit and the version tag to origin.

```bash
npm run release -- patch
npm run release -- minor
npm run release -- major
```

Add `--dry-run` after the bump level to run every check without committing, versioning, building, or publishing: `npm run release -- minor --dry-run`.

To publish by hand instead:

```bash
npm version patch
npm run build
npm pack --dry-run
npm login --registry=https://registry.npmjs.org/
npm publish --access public --registry=https://registry.npmjs.org/
```

You must have publishing permission and complete authentication as prompted by npm. After a failure, inspect local and registry versions before retrying; do not repeatedly bump the version. The release script prints which step succeeded if the push fails after publication. In Windows PowerShell, use npm.cmd to avoid argument handling by npm.ps1.

## Contributing

[Issues](https://github.com/15998194741/utils/issues) and pull requests are welcome. Include the library version, runtime environment, a minimal reproduction, and expected and actual results when reporting a problem. Explain the purpose and validation of code changes, and add relevant behavior tests.

## License

[LICENSE](./LICENSE) contains the Apache License 2.0, and the `license` field in package.json is `Apache-2.0`.
