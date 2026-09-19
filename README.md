# index-system

English | [简体中文](./README.zh-CN.md)

A JavaScript utility library written in TypeScript, with helpers for arrays, objects, strings, numbers, sorting, function control, asynchronous operations, query parameters, trees, validation, browser files, and Excel reading.

[npm](https://www.npmjs.com/package/index-system) · [GitHub](https://github.com/15998194741/utils) · [Issues](https://github.com/15998194741/utils/issues)

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

The package supports CommonJS through `dist/index.js` and ESM through `dist/index.mjs`; TypeScript declarations use `dist/index.d.ts`. The `exports` map selects the appropriate entry. The ESM file is a wrapper around the CommonJS implementation, so it provides native ESM imports but is not independently tree-shakable. The default export is the string `欢迎使用`; utilities are named exports.

## API

### Arrays

| Function | Return value and behavior |
| --- | --- |
| `unique(values)` | A new deduplicated array, preserving first occurrence order |
| `chunk(values, size)` | An array of chunks; size must be a positive integer |
| `groupBy(values, key)` | A Map grouped by the callback result |
| `intersection(left, right)` | A deduplicated intersection in left order |
| `difference(left, right)` | A deduplicated difference in left order |

Inputs are not mutated. Set operations use Set equality: NaN is deduplicated, and objects are compared by reference.

```ts
import { chunk, groupBy, difference } from 'index-system';

chunk([1, 2, 3], 2); // [[1, 2], [3]]
groupBy([{ role: 'admin' }], user => user.role).get('admin');
difference([1, 2, 3], [2]); // [1, 3]
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

```ts
import { pick, get, deepMerge, deepClone } from 'index-system';

pick({ id: 1, name: 'Alice' }, ['name']); // { name: 'Alice' }
get<number>({ user: { score: 90 } }, 'user.score', 0); // 90
get<number>({ 'a.b': 5 }, ['a.b']); // 5
deepMerge({ user: { name: 'Alice' } }, { user: { score: 90 } });
const cloned = deepClone({ items: [1, null], createdAt: new Date() });
```

get accepts dotted paths or explicit key arrays; bracket notation is not parsed. Missing properties and undefined use the fallback, while null is preserved. pick and omit support Symbol keys.

deepClone supports plain objects, arrays, Date, RegExp, Map, Set, circular references, Symbol properties, and property descriptors. Functions and other class instances retain their original references.

deepMerge merges enumerable own properties without mutating inputs. It reads getters, does not preserve property descriptors, and returns `Record<string, any>`. Cycles encountered during plain-object recursion throw; other values follow deepClone semantics.

isEmpty considers null, undefined, empty strings, empty arrays, empty Maps/Sets, and objects without enumerable own properties empty. Zero and false are not empty. copy is intended for JSON-compatible data and does not preserve special types; circular references and BigInt cause failure.

### Types and equality

| Function | Behavior |
| --- | --- |
| `whatType(value)` | Returns a lowercase type name such as array, object, null, undefined, or map |
| `isEqual(a, b)` | Deeply compares enumerable own properties of plain objects and arrays, including cycles |
| `shallowEqual(a, b)` | Compares one level of enumerable own properties using Object.is for values |
| `arrayIsEqual(...arrays)` | Deeply compares multiple arrays |

isEqual checks object prototypes. Date and RegExp are compared by value; other special instances by reference. whatType uses Object.prototype.toString.

```ts
import { whatType, isEqual, shallowEqual } from 'index-system';

whatType([]); // 'array'
isEqual({ a: 1, b: 2 }, { b: 2, a: 1 }); // true
shallowEqual({ user: {} }, { user: {} }); // false
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
| `debounce(fn, delay)` | Trailing debounce with the latest arguments and this |
| `throttle(fn, delay)` | Executes immediately on the first call, then trails with the latest pending arguments |
| `once(fn)` | Caches the first successfully returned result |

Ordinary debounce and throttle calls return void. cancel() cancels pending work; flush() executes a pending call and returns its result, or undefined if nothing is pending. once can retry after a synchronous throw; returned Promises are cached, including rejected Promises.

```ts
import { debounce } from 'index-system';

const save = debounce((text: string) => console.log(text), 300);
save('draft');
save('final');
save.flush(); // Logs final immediately
save.cancel();
```

### Asynchronous control

| Function | Behavior |
| --- | --- |
| `sleep(delay)` | Returns Promise<void> after the specified milliseconds |
| `retry(task, options?)` | Defaults to 3 additional retries and delay 0; task receives a 1-based attempt number |
| `withTimeout(promise, delay)` | Rejects on timeout without cancelling the underlying operation |
| `mapLimit(values, limit, mapper)` | Limits concurrency and preserves result order; mapper receives the value and index |

retries must be a non-negative integer; limit must be a positive integer. mapLimit stops scheduling new work after failure; in-flight tasks continue. All delays must be finite milliseconds between 0 and 2147483647.

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

### JSON

`safeJsonParse<T>(text)` returns `{ ok: true, value }` or `{ ok: false, error }` instead of throwing for invalid JSON. Its generic is a type assertion and does not validate runtime data.

`stableStringify(value, space?)` sorts object keys recursively while preserving array order. It follows JSON.stringify behavior for unsupported primitive values and toJSON is not invoked before normalization. It is intended for plain JSON-compatible data and throws on cycles or BigInt.

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
- `orderBy(values, orders)` performs a stable multi-key sort; each order has an iteratee and optional `asc` or `desc` direction.
- `memoize(fn)` caches by argument identity and exposes `clear()`. `memoizeAsync(fn)` also removes rejected Promise entries so later calls can retry. The receiver (`this`) is not part of the cache key.
- `tryCatch(task)` and `tryCatchAsync(task)` return a discriminated `{ ok, value/error }` Result.

### Assertions

`invariant(condition, message?)` narrows a truthy condition, `assertDefined(value, message?)` narrows away null and undefined, and `assertNever(value, message?)` supports exhaustive TypeScript branches. Failures throw Error.

### Encoding

`bytesToHex` / `hexToBytes`, `utf8ToBytes` / `bytesToUtf8`, `bytesToBase64` / `base64ToBytes`, and `bytesToBase64Url` / `base64UrlToBytes` convert binary data. Invalid input throws. UTF-8 decoding is fatal, and Base64 helpers require global btoa/atob support.

### Semantic versions

`parseVersion`, `compareVersion`, and `satisfiesVersion` implement strict semantic-version parsing and precedence, including prereleases. Range matching supports exact versions, `>`, `>=`, `<`, `<=`, whitespace AND, `||` OR, caret, and tilde ranges. Wildcards, hyphen ranges, and npm's complete range grammar are not supported.

### Chinese business helpers

`isChineseIdCard` validates 15-digit legacy IDs or 18-digit IDs with date and checksum; `isChineseMobile` checks the current broad mainland mobile shape; `isBankCard` applies Luhn to 12–19 digits. `maskChineseMobile` and `maskChineseIdCard` mask valid inputs and return invalid inputs unchanged. These format checks do not verify issuance, ownership, or current carrier allocation.

### Masking and polling

`maskPhone`, `maskEmail`, `maskName`, and `maskBankCard` preserve useful edges and replace the middle with `*`. They format display strings only and do not validate input.

`poll(task, options)` repeats until `isDone` returns true; `waitUntil(predicate, options)` waits for a truthy result. Options include interval, timeout, and AbortSignal. Defaults are 1000 ms and 30000 ms. The task runs immediately and at least once, even with timeout 0. Aborting is observed between attempts and does not cancel an in-flight task.

### Schemas

`stringSchema`, `numberSchema`, `booleanSchema`, `literalSchema`, `arraySchema`, `objectSchema`, and `unionSchema` provide lightweight runtime parsing. Every Schema supports `parse`, `safeParse`, `optional`, and `refine`; failures use `SchemaError` with a property path. objectSchema returns only declared string-keyed properties and does not coerce values.

```ts
const user = objectSchema({
  name: stringSchema().refine(value => value.length > 0, 'Required'),
  age: numberSchema(),
  nickname: stringSchema().optional(),
});
const result = user.safeParse({ name: 'Alice', age: 20 });
```

### Observables and state machines

`createSignal(initial)` provides get, set, update, and subscribe. Notifications are synchronous snapshots and Object.is-equal assignments are ignored. `computed(compute, dependencies)` recomputes from explicit dependencies and provides `dispose()`; `watch(signal, listener, immediate?)` returns an unsubscribe function.

`createStateMachine(config)` provides state, mutable context, send, and subscribe. Transitions may be a target state or include target, guard, and action. Guards run before actions; subscribers run synchronously only when the state changes. Unknown and blocked events return false.

### Data differences

`objectDiff(left, right)` creates add, remove, and replace operations for plain-object properties; arrays and special objects are replaced as values. `applyPatch(value, operations)` applies operations to a deep clone and can return undefined when removing the root. `arrayDiff(left, right)` returns added and removed values using deep equality and set-style membership rather than occurrence counts.

### Scheduler and units

`createScheduler(concurrency?)` queues Promise or synchronous tasks. Higher numeric priority runs first among queued tasks; already-running tasks are not preempted. It exposes add, onIdle, pending, and active.

`convertLength` supports mm, cm, m, km, in, ft, yd, and mi. `convertWeight` supports mg, g, kg, oz, and lb. `celsiusToFahrenheit` and `fahrenheitToCelsius` convert temperatures. Results use floating-point arithmetic and may require tolerance-based comparison.

## Compatibility and known limitations

- File conversion depends on File, Blob, FileReader, atob, or URL.createObjectURL. Excel File input requires arrayBuffer(). Check that your environment provides the necessary APIs.
- Legacy exports remain available: base64Tofile → base64ToFile, bolbToFile → blobToFile, fileToBolb → fileToBlob, isRqual → isEqual, arrayIsRqual → arrayIsEqual, and arrayIsRqualShallow → shallowEqual. objectIsRqualShallow retains deep-comparison behavior.
- Compared with the old implementation, Excel path input returns an array, File input returns a Promise, and file-conversion callback forms also return Promises. blobToFile preserves the input MIME type by default. Review affected calls when upgrading.
- `isData` remains as a legacy spelling, with `isDate` as an alias. Both validate an entire YYYY-M-D or YYYY-MM-DD calendar date. `isPhoneNumer` also retains its legacy spelling.
- Format validators check syntax only. URL validation accepts HTTP and HTTPS, domain validation requires a letter-only final label, and phone/identity checks cannot verify existence or ownership.
- MD5, the Is validation class, and the xlsx re-export in src/excel/excel.ts are not exported from the package entry.
- Browser FileReader behavior has been tested with a mock, not verified in a real browser.

## Local development

Tests require Node.js 20 or later.

```bash
git clone https://github.com/15998194741/utils.git
cd utils
npm install
npm run build
npm test
```

build checks types, clears the project-local dist directory, and generates JavaScript and type declarations. tsconfig.build.json includes only the root entry and TypeScript files under src. Tests cover arrays, copying, equality, function control, async helpers, files, Excel, objects, strings, numbers, URLs, and trees.

Run npx webpack to generate UMD files under webpack. The npm package entry uses dist; these are separate outputs.

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

With a clean working directory, select an unused version, then build and inspect the package:

```bash
npm version patch
npm run build
npm pack --dry-run
npm login --registry=https://registry.npmjs.org/
npm publish --access public --registry=https://registry.npmjs.org/
```

You must have publishing permission and complete authentication as prompted by npm. After a failure, inspect local and registry versions before retrying; do not repeatedly bump the version.

The repository includes scripts/release.cjs, but package.json currently does not define a release command. Configure the corresponding npm scripts before using it. The available commands are build, test, and versionAdd. In Windows PowerShell, use npm.cmd to avoid argument handling by npm.ps1.

## Contributing

[Issues](https://github.com/15998194741/utils/issues) and pull requests are welcome. Include the library version, runtime environment, a minimal reproduction, and expected and actual results when reporting a problem. Explain the purpose and validation of code changes, and add relevant behavior tests.

## License

[LICENSE](./LICENSE) contains Apache License 2.0, while the license field in package.json is ISC. These declarations are inconsistent; maintainers need to confirm the applicable license.
