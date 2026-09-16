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

The current build outputs CommonJS. The JavaScript entry is `dist/index.js`, and the type entry is `dist/index.d.ts`. The default export is the string `欢迎使用`; utilities are named exports. A separate ESM build and tree-shaking support are not guaranteed.

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

## Compatibility and known limitations

- File conversion depends on File, Blob, FileReader, atob, or URL.createObjectURL. Excel File input requires arrayBuffer(). Check that your environment provides the necessary APIs.
- Legacy exports remain available: base64Tofile → base64ToFile, bolbToFile → blobToFile, fileToBolb → fileToBlob, isRqual → isEqual, arrayIsRqual → arrayIsEqual, and arrayIsRqualShallow → shallowEqual. objectIsRqualShallow retains deep-comparison behavior.
- Compared with the old implementation, Excel path input returns an array, File input returns a Promise, and file-conversion callback forms also return Promises. blobToFile preserves the input MIME type by default. Review affected calls when upgrading.
- isId overwrites the 15-digit validation result and does not check the identity card checksum. Phone validation covers only some number prefixes.
- isData checks only a date-format prefix, not date validity or the entire string. isDomainName, isIp, and isXml contain regex escaping issues.
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
