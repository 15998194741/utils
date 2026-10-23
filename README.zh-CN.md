# index-system

[English](./README.md) | 简体中文

使用 TypeScript 编写的 JavaScript 工具库，包含数组与对象处理、字符串转换、数值统计、排序、异步控制、查询参数、树结构、格式校验、文件转换和 Excel 读取工具。

[npm](https://www.npmjs.com/package/index-system) · [GitHub](https://github.com/15998194741/utils) · [Issues](https://github.com/15998194741/utils/issues)

> 本文描述当前仓库源码。新增 API 需要发布新版本后才能通过 npm 安装使用，请确认所安装版本包含对应功能。

## 目录

- [安装与使用](#安装与使用)
- [API](#api)
- [兼容性与已知限制](#兼容性与已知限制)
- [本地开发](#本地开发)
- [发布](#发布)
- [参与贡献](#参与贡献)
- [许可证](#许可证)

## 安装与使用

```bash
npm install index-system
# 或
pnpm add index-system
# 或
yarn add index-system
```

TypeScript 或使用构建工具的项目可以使用命名导入：

```ts
import { unique, quickSort, deepClone, whatType } from 'index-system';

const numbers = [3, 1, 2, 2];
quickSort(unique(numbers)); // [1, 2, 3]
const cloned = deepClone({ tags: ['TypeScript'] });
whatType(cloned); // 'object'
```

CommonJS：

```js
const { unique } = require('index-system');
unique([1, 1, 2]); // [1, 2]
```

包通过 `dist/index.js` 支持 CommonJS，通过 `dist/esm/index.js` 支持 ESM，类型声明入口为 `dist/index.d.ts`，`exports` 会选择对应入口。默认导出是字符串 `欢迎使用`，工具函数通过命名导出使用。

### 按需导入（Tree-shaking）

ES module 入口使用静态导出语句，打包器可以丢弃使用方没有导入的函数。请从包名导入以获得该行为；CommonJS 入口无法摇树，因为 CommonJS 的导出在运行时才解析。

```ts
import { unique, camelCase } from 'index-system';
```

只导入 `unique` 的使用方，最终产物约 100 字节，而不是完整的 1.3 MB 库；打包进来的 xlsx 依赖也会被完全排除，因为只有 Excel 相关函数才会引用它。webpack、Vite、Rollup、esbuild 以及任何支持 `import` 条件的打包器都能做到这一点。package.json 中的 `sideEffects` 字段只列出了 WebAssembly 内核入口（它确实需要加载模块），包内其余模块都没有副作用，打包器可以丢弃使用方没有导入的部分。

### Rust 与 WebAssembly 内核

本包还提供一个用 Rust 编译成 WebAssembly 的内核。它通过独立子路径发布，导入它不会影响上面 JavaScript 工具函数的按需导入。

```ts
import { md5 } from 'index-system/wasm';

md5('hello world'); // '5eb63bbbe01eeed093cb22bb8f5acdc3'
```

CommonJS 用法相同：

```js
const { add } = require('index-system/wasm');
add(2, 3); // 5
```

内核会自行初始化，不需要调用 init。在 Node 中它从磁盘读取二进制并同步实例化；在浏览器或打包器中，二进制会作为资源输出并通过 HTTP 获取。支持 `import` 条件的打包器（Vite、webpack、Rollup、esbuild）都能解析该子路径并自动输出二进制文件。

内核是按需加载的，但前提是导入了这个子路径。从不导入 `index-system/wasm` 的使用方永远不会下载二进制文件。静态导入会一次性加载整个内核，因为 WebAssembly 模块是一个不可按函数拆分的整体；动态导入则把下载推迟到代码真正执行时：

```ts
async function main() {
  const { add } = await import('index-system/wasm');
  add(2, 3); // 5
}
```

使用打包器时，动态导入会变成独立 chunk，在首次执行到该处时才被拉取，因此二进制文件不会拖慢页面其余部分。

package.json 中的 `sideEffects` 是数组而不是 `false`，因为内核入口确实有副作用：它会加载 WebAssembly 模块。如果不把它列进去，打包器会在构建成功的前提下丢弃这段初始化，只有运行时才会报错。`npm run check:wasm-bundle` 会用项目自身的打包器构建一个探针包，一旦初始化被摇掉就报错。

## API

### 数组

| 函数 | 返回值与行为 |
| --- | --- |
| `unique(values)` | 去重后的新数组，保留首次出现顺序 |
| `chunk(values, size)` | 按正整数 size 分块，返回二维数组 |
| `groupBy(values, key)` | 按回调结果分组，返回 Map |
| `intersection(left, right)` | 去重后的交集，保留 left 顺序 |
| `difference(left, right)` | 去重后的差集，保留 left 顺序 |
| `range(start, end?, step?)` | 生成左闭右开区间内的数字数组 |
| `toArray(value)` | 把值包装成数组，或把可迭代对象展开成数组 |
| `flatten(values, depth?)` | 展平嵌套数组，默认只展一层 |
| `first(values)` | 首个元素，空数组返回 undefined |
| `last(values)` | 末个元素，空数组返回 undefined |
| `compact(values)` | 移除所有假值 |
| `take(values, count)` | 取前 count 个元素 |
| `drop(values, count)` | 跳过前 count 个元素 |
| `zip(...arrays)` | 按列合并，缺失位置补 undefined |
| `unzip(rows)` | `zip` 的转置 |
| `arrayMove(values, from, to)` | 把某个元素移到新位置后的副本 |

不修改输入。集合操作采用 Set 的相等规则：NaN 可以去重，对象按引用比较。

`range` 采用左闭右开区间，终点永远不包含。省略 `end` 时，序列从 0 走向 `start`，共 `|start|` 个元素。未指定 `step` 时默认为 `1`，终点小于起点时为 `-1`。`compact` 采用 lodash 口径，因此 `0` 和空字符串也会被移除。`take` 与 `drop` 的 count 为负数时按 0 处理，超过数组长度也不算错误。

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

### 对象与复制

| 函数 | 返回值与行为 |
| --- | --- |
| `pick(object, keys)` | 选取自有属性，保留选取键的 TypeScript 类型 |
| `omit(object, keys)` | 排除指定键，复制其余可枚举自有属性 |
| `get<T>(object, path, fallback?)` | 仅沿自有属性取值，返回 T 或 undefined |
| `deepMerge(...objects)` | 递归合并普通对象，返回新对象，数组替换 |
| `isEmpty(value)` | 判断内容或可枚举自有属性是否为空 |
| `copy(value)` | 通过 JSON 序列化复制对象或数组 |
| `deepClone(value)` | 递归复制支持的类型，保留泛型类型 |
| `copy.deepcopy(value)` | deepClone 的兼容入口 |
| `pickBy(object, predicate)` | 保留谓词接受的自有属性 |
| `omitBy(object, predicate)` | 丢弃谓词接受的自有属性 |
| `defaults(object, ...sources)` | 用兜底源补齐值为 undefined 的属性 |
| `assign(...objects)` | 浅合并多个对象，返回新对象 |

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

get 支持点分路径或显式键数组，不解析方括号语法；缺失或 undefined 使用默认值，null 保持不变。pick 和 omit 支持 Symbol 键。

deepClone 支持普通对象、数组、Date、RegExp、Map、Set、循环引用、Symbol 属性和属性描述符。函数和其他类实例保留原引用。

deepMerge 合并可枚举自有属性，不修改输入；读取 getter，不保留属性描述符，返回 `Record<string, any>`。普通对象递归路径出现循环时抛错，其他值按 deepClone 规则处理。

isEmpty 将 null、undefined、空字符串、空数组、空 Map/Set，以及无可枚举自有属性的对象视为空；0 和 false 不为空。copy 仅适合 JSON 数据，不保留特殊类型；循环引用和 BigInt 会导致失败。注意 `copy` 与 `copy.deepcopy` 行为不同：前者走 JSON 序列化，后者是 deepClone 的别名，会完整保留 Date、Map、Set。

pickBy 与 omitBy 只处理可枚举自有属性（含 Symbol 键），并把属性值和键一起传给谓词。assign 只做一层浅合并，且不会修改任何来源对象。defaults 只补齐目标上已存在且值为 `undefined` 的属性，目标上不存在的键不会被添加；多个来源按从左到右查找，第一个拥有该键的来源生效。

### 类型与相等比较

| 函数 | 行为 |
| --- | --- |
| `whatType(value)` | 返回小写类型名称，例如 array、object、null、undefined、map |
| `isEqual(a, b)` | 深比较普通对象和数组的可枚举自有属性，支持循环引用 |
| `objectIsEqual(a, b)` | 深比较两个对象；`isEqual` 的对象专用名称 |
| `shallowEqual(a, b)` | 比较一层可枚举自有属性，属性值使用 Object.is |
| `arrayIsEqual(...arrays)` | 深比较多个数组 |

isEqual 比较对象原型；Date、RegExp 按值比较，其他特殊实例按引用比较。whatType 基于 Object.prototype.toString。

```ts
import { whatType, isEqual, objectIsEqual, shallowEqual } from 'index-system';

whatType([]); // 'array'
isEqual({ a: 1, b: 2 }, { b: 2, a: 1 }); // true
objectIsEqual({ a: { b: 1 } }, { a: { b: 1 } }); // true
shallowEqual({ user: {} }, { user: {} }); // false
```

#### 旧版比较函数别名

早期版本发布了拼写错误的名称。它们仍然可用，已在类型声明中标注 `@deprecated`，并将在下一个主版本中移除。

| 旧版名称 | 替代方案 | 说明 |
| --- | --- | --- |
| `isRqual` | `isEqual` | 同一个函数 |
| `arrayIsRqual` | `arrayIsEqual` | 同一个函数 |
| `arrayIsRqualShallow` | `shallowEqual` | 同一个函数 |
| `objectIsRqualShallow` | `objectIsEqual` | 同一个函数；旧名称还错误描述了比较深度 |

```ts
import { objectIsEqual, objectIsRqualShallow } from 'index-system';

objectIsRqualShallow === objectIsEqual; // true
```

### 类型守卫

| 函数 | 行为 |
| --- | --- |
| `isObject(value)` | 任何非 null 的对象都为 true，包含数组和类实例 |
| `isPlainObject(value)` | 仅当原型是 `Object.prototype` 或 `null` 时为 true |
| `isArray(value)` | 数组为 true |
| `isString(value)` | 原始字符串为 true |
| `isNumber(value)` | 除 `NaN` 之外的数字为 true |
| `isBoolean(value)` | 原始布尔值为 true |
| `isFunction(value)` | 函数为 true |
| `isNil(value)` | `null` 和 `undefined` 为 true |
| `isPromise(value)` | 任何带可调用 `then` 方法的对象为 true |

`isObject` 与 `isPlainObject` 回答的是不同问题：前者只排除原始值，后者还会排除数组、`Date`、`Map`、`Set` 和类实例。`isNumber` 不接受 `NaN`。`isPromise` 采用鸭子类型而非 `instanceof`，因此普通 thenable 同样匹配，且跨 realm 可用。

```ts
import { isObject, isPlainObject, isNumber, isPromise } from 'index-system';

isObject([]); // true
isPlainObject([]); // false
isNumber(NaN); // false
isPromise({ then() {} }); // true
```

### 路径操作

| 函数 | 返回值与行为 |
| --- | --- |
| `set(object, path, value)` | 在该路径写入值后的新对象 |
| `unset(object, path)` | 移除该路径属性后的新对象 |
| `update(object, path, updater)` | 用 `updater(current)` 替换该路径后的新对象 |

这三个函数都是**不可变**的：传入的对象绝不会被修改，路径上的每一层都会先做浅拷贝再改动。缺失的中间层会创建为普通对象；中间层是原始值时会被替换为普通对象。

路径规则与 `get` 一致：点分字符串如 `'a.b.c'` 表示逐层向下，显式数组如 `['a.b']` 表示访问一个字面量键。`set` 与 `update` 在路径为空或目标不是对象时抛 `TypeError`；路径不存在时 `unset` 返回浅拷贝。`update` 在路径缺失时以 `undefined` 调用 updater，updater 抛出的异常会直接向外传播。

```ts
import { set, unset, update } from 'index-system';

set({ a: { b: 1 } }, 'a.c', 2); // { a: { b: 1, c: 2 } }
set({}, 'a.b.c', 1); // { a: { b: { c: 1 } } }
unset({ a: { b: 1 } }, 'a.b'); // { a: {} }
update({ a: 1 }, 'a', current => current + 1); // { a: 2 }
```

### 字符串

| 函数 | 行为 |
| --- | --- |
| `camelCase(text)` | 转为 camelCase |
| `kebabCase(text)` | 转为 kebab-case |
| `capitalize(text)` | 将首个码点转为大写 |
| `truncate(text, length, suffix = '...')` | 截断到非负整数长度，包含后缀 |

大小写转换识别空格、下划线、连字符和英文大小写边界。截断按 Unicode 码点计算，组合 emoji 可能包含多个码点；后缀超过长度时也会被截断。

```ts
import { camelCase, kebabCase, truncate } from 'index-system';

camelCase('hello_world'); // 'helloWorld'
kebabCase('XMLHttpRequest'); // 'xml-http-request'
truncate('hello world', 8); // 'hello...'
```

### 数值

| 函数 | 行为 |
| --- | --- |
| `clamp(value, min, max)` | 限制到指定区间 |
| `inRange(value, min, max)` | 判断是否位于闭区间，包含两端 |
| `sum(values)` | 求和，空数组返回 0 |
| `average(values)` | 平均值，空数组返回 NaN |

上下界不能为 NaN，且必须满足 min <= max。使用 JavaScript 浮点运算，不提供精确十进制计算。

```ts
import { clamp, inRange, average } from 'index-system';

clamp(120, 0, 100); // 100
inRange(100, 0, 100); // true
average([80, 90]); // 85
```

### 排序

所有排序函数返回新的浅拷贝数组，不修改输入。数字默认升序；其他类型需提供比较函数。比较结果为负数表示前者排在前面，零表示相等，正数表示后者排在前面。默认数字比较不适用于 NaN。

| 函数 | 算法 | 平均 / 最坏时间复杂度 | 稳定 |
| --- | --- | --- | --- |
| `bubbleSort` | 冒泡 | O(n²) / O(n²) | 是 |
| `selectionSort` | 选择 | O(n²) / O(n²) | 否 |
| `insertionSort` | 插入 | O(n²) / O(n²) | 是 |
| `shellSort` | 希尔，折半步长 | 取决于输入 / O(n²) | 否 |
| `mergeSort` | 归并 | O(n log n) / O(n log n) | 是 |
| `quickSort` | 三路快速 | O(n log n) / O(n²) | 否 |
| `heapSort` | 堆 | O(n log n) / O(n log n) | 否 |

```ts
import { quickSort, mergeSort } from 'index-system';

quickSort([3, 1, 2]); // [1, 2, 3]
quickSort([3, 1, 2], (a, b) => b - a); // [3, 2, 1]
mergeSort([{ score: 90 }, { score: 80 }], (a, b) => a.score - b.score);
```

### 函数控制

| 函数 | 行为 |
| --- | --- |
| `debounce(fn, delay, options?)` | 尾部防抖，使用最后一次调用的参数和 this |
| `throttle(fn, delay, options?)` | 首次立即执行，间隔内的调用在尾部使用最新参数执行 |
| `once(fn)` | 缓存首次成功返回的结果 |
| `compose(...fns)` | 从右往左依次应用函数 |
| `pipe(...fns)` | 从左往右依次应用函数 |
| `curry(fn, arity?)` | 把函数变成可分步收集参数的柯里化版本 |

防抖和节流的普通调用返回 void，提供 cancel() 取消待执行调用、flush() 执行待处理调用并返回其结果，无待处理调用时返回 undefined。once 同步抛错后可重试；返回的 Promise（包括拒绝状态）会被缓存。

`debounce` 新增 `leading` 选项，用于在连续调用的第一次就立即执行；`maxWait` 用于限制调用持续到来时最多可以推迟多久。`throttle` 新增 `leading` 选项，默认值为 `true`；设为 `false` 时只在每个窗口结束时执行。不传 options 时，两者行为与之前完全一致。

`compose` 与 `pipe` 只差方向：`compose(f, g)(x)` 等于 `f(g(x))`，`pipe(f, g)(x)` 等于 `g(f(x))`。不传函数时两者都返回恒等函数。`curry` 默认以 `fn.length` 作为参数个数，也可以显式指定，并且每次调用都返回一个新函数。

```ts
import { debounce, compose, pipe, curry } from 'index-system';

const save = debounce((text: string) => console.log(text), 300);
save('draft');
save('final');
save.flush(); // 立即输出 final
save.cancel();

compose((x: number) => x + 1, (x: number) => x * 2)(3); // 7
pipe((x: number) => x + 1, (x: number) => x * 2)(3); // 8
curry((a: number, b: number) => a + b)(1)(2); // 3
```

### 异步控制

| 函数 | 行为 |
| --- | --- |
| `sleep(delay)` | 返回 Promise<void>，等待指定毫秒数 |
| `retry(task, options?)` | 默认额外重试 3 次，delay 默认 0；task 接收从 1 开始的尝试次数 |
| `withTimeout(promise, delay)` | 超时后拒绝，不取消底层操作 |
| `mapLimit(values, limit, mapper)` | 限制并发，结果保持输入顺序，mapper 接收值和索引 |

retries 必须为非负整数，limit 必须为正整数。mapLimit 失败后停止启动新任务，已启动任务继续运行。所有延迟必须为 0 到 2147483647 之间的有限毫秒数。

`retry` 在第 n 次失败后等待 `delay * backoff ** n`，因此 `backoff` 大于 1 即为指数退避；`maxDelay` 用于限制单次等待时长。两者的默认值都保持原有的固定延迟行为。

```ts
import { retry, mapLimit } from 'index-system';

async function example() {
  const result = await retry(() => Promise.resolve('ok'), { retries: 2, delay: 100 });
  const doubled = await mapLimit([1, 2, 3], 2, async value => value * 2);
  return { result, doubled };
}
```

### URL 查询参数

parseQuery(query) 接收查询字符串，可带 ? 前缀，不接收完整 URL。返回无原型对象，重复键返回字符串数组。

stringifyQuery(object) 返回不带 ? 的字符串：数组生成重复键，null 转为空字符串，undefined 省略，数字和布尔值转为字符串。使用 URLSearchParams 编解码，空格编码为 +。

```ts
import { parseQuery, stringifyQuery } from 'index-system';

parseQuery('?tag=a&tag=b'); // { tag: ['a', 'b'] }，无原型对象
stringifyQuery({ tag: ['a', 'b'], page: 1 }); // 'tag=a&tag=b&page=1'
```

### 树结构

| 函数 | 行为 |
| --- | --- |
| `listToTree(list, { getId, getParentId })` | 浅拷贝节点，生成 children 数组，保留输入顺序 |
| `treeToList(roots, getChildren)` | 先序遍历，返回节点引用，保留 children |
| `findTreeNode(roots, predicate, getChildren)` | 返回先序首个匹配节点或 undefined |

listToTree 不修改输入，已有 children 被替换。null/undefined 父 ID 或缺失父节点成为根节点；节点 ID 不能为 null/undefined，重复 ID 和父子循环会抛错。

遍历使用迭代实现，访问到循环或重复节点引用时抛错；查找匹配后立即返回。

```ts
import { listToTree, treeToList, findTreeNode } from 'index-system';

const tree = listToTree(
  [{ id: 1, parentId: null }, { id: 2, parentId: 1 }],
  { getId: node => node.id, getParentId: node => node.parentId },
);
treeToList(tree, node => node.children).map(node => node.id); // [1, 2]
findTreeNode(tree, node => node.id === 2, node => node.children);
```

### 格式校验

以下函数返回 boolean，仅检查格式，不验证地址存在或号码有效。

| 函数 | 参数 | 用途 |
| --- | --- | --- |
| `isEmail` | string | 邮箱 |
| `isId` | string | 身份证号码 |
| `isPhoneNumer` | string 或 number | 手机号 |
| `isDomainName` | string | 域名 |
| `isInternetUrl` | string | URL |
| `isData` | string | 日期字符串 |
| `isXml` | string | XML 文件名 |
| `isChinese` | string | 指定范围内的汉字 |
| `isIp` | string | IPv4 |
| `isLowerCase` | string | 全部为小写英文字母 |
| `isUpperCase` | string | 全部为大写英文字母 |
| `isAlphabets` | string | 全部为英文字母 |

```ts
import { isEmail, isChinese } from 'index-system';

isEmail('alice@example.com'); // true
isChinese('你好'); // true
```

现有校验规则的限制见下文。

### 浏览器文件转换

| 函数 | 返回值 | 用途 |
| --- | --- | --- |
| `fileToBase64(file, callback?)` | Promise<string> | File 转 Base64 Data URL |
| `base64ToFile(base, filename = 'png')` | File | Data URL 转 File |
| `blobToFile(blob, fileName = '', type?)` | File | Blob 转 File，默认保留原 MIME 类型，无类型时用 image/png |
| `fileToBlob(file, callback?)` | Promise<Blob> | File 转 Blob |
| `fileToUrl(file)` | string | 创建对象 URL |
| `base64ToBlob(base64, mimeType?)` | Blob | Data URL 转 Blob |
| `blobToDataURL(blob, callback?)` | Promise<string> | Blob 转 Data URL |

Base64 输入必须为完整的 Base64 Data URL。读取函数始终返回 Promise；读取失败、取消或回调抛错时拒绝。

```ts
import { fileToBase64, base64ToFile, fileToUrl } from 'index-system';

async function example(file: File) {
  const dataURL = await fileToBase64(file);
  const converted = base64ToFile(dataURL, file.name);
  const url = fileToUrl(converted);
  // 使用完毕后释放对象 URL。
  URL.revokeObjectURL(url);
}
```

### Excel 读取

readExcelToJSON<T>(file, sheetName?) 基于 xlsx 读取工作表，默认选择第一张表，默认行类型为 Record<string, any>。缺失工作表时抛错或拒绝。

```ts
import { readExcelToJSON } from 'index-system';

type Row = { name: string; score: number };
// Node.js：文件路径输入同步返回 Row[]。
const rows = readExcelToJSON<Row>('./scores.xlsx', 'Sheet1');

// 浏览器：File 输入返回 Promise<Row[]>。
async function readUpload(file: File) {
  return await readExcelToJSON<Row>(file, 'Sheet1');
}
```

泛型仅描述返回类型，不执行行数据的运行时校验。

### 日期时间

`isValidDate(value)` 判断有效 Date；`formatDate(date, pattern?)` 使用本地时间和 `YYYY`、`MM`、`DD`、`HH`、`mm`、`ss`、`SSS` 格式化；`addDays(date, amount)` 按本地日历加减整数天并返回新对象；`differenceInDays(left, right)` 比较本地日历日期，忽略具体时刻和夏令时长度变化。

```ts
import { formatDate, addDays, differenceInDays } from 'index-system';

formatDate(new Date(2024, 1, 29), 'YYYY-MM-DD'); // '2024-02-29'
addDays(new Date(2024, 1, 29), 1);
differenceInDays(new Date(2024, 2, 1), new Date(2024, 1, 28)); // 2
```

### 随机工具

`randomInt(min, max, random?)` 返回闭区间内的安全整数；`shuffle(values, random?)` 返回乱序副本；`sample(values, random?)` 从数组取一个值，空数组返回 undefined。三者默认使用 Math.random，不适合生成秘密数据。`uuid()` 使用 `crypto.randomUUID` 或 `crypto.getRandomValues` 生成 RFC 4122 v4 UUID，安全加密 API 不可用时抛错。

### 缓存存储

`createStorage(storage, prefix?)` 封装 localStorage 兼容对象，提供 `set(key, value, ttl?)`、`get(key, fallback?)` 和 `remove(key)`。值使用 JSON 序列化；TTL 单位为毫秒，0 表示立即过期。过期或损坏数据会被删除，序列化和底层存储异常会向调用方抛出。

```ts
import { createStorage } from 'index-system';

const cache = createStorage(localStorage, 'app:');
cache.set('profile', { name: 'Alice' }, 60_000);
cache.get('profile');
cache.remove('profile');
```

### 事件系统

`EventEmitter<Events>` 提供 on、once、off、emit、clear 和 listenerCount。on、once 返回取消订阅函数。emit 按注册顺序同步执行监听器快照，无监听器时返回 false；监听器异常会向外抛出并停止本次派发。

```ts
import { EventEmitter } from 'index-system';

type Events = { change: [value: number]; close: [] };
const events = new EventEmitter<Events>();
const unsubscribe = events.on('change', value => console.log(value));
events.emit('change', 1);
unsubscribe();
```

### 数据结构

- `Queue<T>`：enqueue、dequeue、peek、size、clear。
- `Stack<T>`：push、pop、peek、size、clear。
- `PriorityQueue<T>`：基于二叉堆，提供 enqueue、dequeue、peek、size、clear；比较函数返回负数的元素优先级更高。
- `LRUCache<K, V>`：容量必须为正整数，提供 get、has、set、delete、clear、size、keys；成功 get 会刷新使用顺序，keys 从最久未使用到最近使用迭代。

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
cache.get('a'); // 刷新 'a' 的使用顺序
cache.set('c', 3); // 淘汰 'b'，即最久未使用的条目
[...cache.keys()]; // ['a', 'c']
```

### JSON

`safeJsonParse<T>(text)` 对无效 JSON 返回 `{ ok: true, value }` 或 `{ ok: false, error }`，不抛出语法错误；泛型只做类型断言，不校验运行时数据。

`stableStringify(value, space?)` 递归排序对象键并保留数组顺序。对不支持的原始值遵循 JSON.stringify 的行为，规范化前不会调用 toJSON。它仅适合普通 JSON 兼容数据，遇到循环引用或 BigInt 会抛错。

```ts
import { safeJsonParse, stableStringify } from 'index-system';

safeJsonParse<{ id: number }>('{"id":1}'); // { ok: true, value: { id: 1 } }
safeJsonParse('{oops'); // { ok: false, error: SyntaxError }
stableStringify({ b: 1, a: { d: 2, c: 3 } }); // '{"a":{"c":3,"d":2},"b":1}'
```

### 数学统计

`median(values)`、`variance(values)`、`percentile(values, p)` 要求非空且全部为有限数值，不修改输入。variance 计算总体方差；percentile 接受 `[0, 1]` 范围并使用线性插值；计算采用 JavaScript 浮点数。

```ts
import { median, variance, percentile } from 'index-system';

median([3, 1, 2]); // 2
variance([1, 2, 3]); // 0.666666...
percentile([0, 10, 20], 0.25); // 5
```

### 集合、缓存与结果

- `keyBy(values, key)` 返回 Map，重复键时保留最后一个值。
- `countBy(values, key)` 返回各键出现次数的 Map。
- `partition(values, predicate)` 返回 `[匹配项, 非匹配项]`，不修改输入。
- `orderBy(values, orders)` 执行稳定的多键排序。每个排序项为 `{ iteratee, direction }`，其中 `direction` 取 `'asc'` 或 `'desc'`，默认 `'asc'`。写成其他属性名会被忽略，而不是报错。
- `memoize(fn)` 按参数引用缓存并提供 `clear()`；`memoizeAsync(fn)` 还会移除拒绝状态的 Promise 条目，使后续调用可以重试。接收者（`this`）不属于缓存键。
- `tryCatch(task)` 和 `tryCatchAsync(task)` 返回带 `{ ok, value/error }` 判别字段的 Result。

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
double(2); // 4，来自缓存

tryCatch(() => 1); // { ok: true, value: 1 }
tryCatch(() => {
  throw new Error('boom');
}); // { ok: false, error: Error }
```

### 断言

`invariant(condition, message?)` 收窄真值条件，`assertDefined(value, message?)` 排除 null 和 undefined，`assertNever(value, message?)` 用于 TypeScript 穷尽分支；失败时抛出 Error。

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

### 编码

提供 Hex、UTF-8、Base64 和 Base64URL 与字节之间的双向转换：`bytesToHex`、`hexToBytes`、`utf8ToBytes`、`bytesToUtf8`、`bytesToBase64`、`base64ToBytes`、`bytesToBase64Url`、`base64UrlToBytes`。无效输入抛错；UTF-8 严格解码；Base64 需要全局 btoa/atob。

```ts
import { bytesToHex, utf8ToBytes, bytesToBase64, base64UrlToBytes } from 'index-system';

bytesToHex(new Uint8Array([1, 255])); // '01ff'
utf8ToBytes('hi'); // Uint8Array [104, 105]
bytesToBase64(new Uint8Array([104, 105])); // 'aGk='
base64UrlToBytes('-_8'); // Uint8Array [251, 255]
```

### 语义化版本

`parseVersion`、`compareVersion`、`satisfiesVersion` 支持严格版本和预发布版本优先级。范围支持精确版本、比较符、空格 AND、`||` OR、脱字符和波浪号；不支持通配符、连字符范围或 npm 的完整范围语法。

```ts
import { parseVersion, compareVersion, satisfiesVersion } from 'index-system';

parseVersion('1.2.3-beta.1'); // { major: 1, minor: 2, patch: 3, prerelease: ['beta', '1'] }
compareVersion('1.2.3', '1.10.0'); // -1
satisfiesVersion('1.2.3', '^1.0.0'); // true
satisfiesVersion('1.2.3', '~1.2.0'); // true
satisfiesVersion('2.0.0', '^1.0.0 || ^2.0.0'); // true
```

### 中国业务工具

`isChineseIdCard` 校验 15 位旧身份证，或校验含出生日期与校验码的 18 位身份证；`isChineseMobile` 检查大陆手机号宽泛格式；`isBankCard` 对 12–19 位数字执行 Luhn 校验。`maskChineseMobile`、`maskChineseIdCard` 对有效输入脱敏，无效输入原样返回。以上校验不能确认号码是否签发、存在或属于某人。

```ts
import { isChineseIdCard, isChineseMobile, isBankCard, maskChineseMobile } from 'index-system';

isChineseIdCard('11010519491231002X'); // true
isChineseMobile('13800138000'); // true
isBankCard('4111111111111111'); // true，通过 Luhn 校验
maskChineseMobile('13800138000'); // '138****8000'
```

### 脱敏与轮询

`maskPhone`、`maskEmail`、`maskName`、`maskBankCard` 保留两端信息并用星号替换中间部分，只用于展示，不验证输入。

`poll(task, options)` 重复执行直到 isDone 返回 true；`waitUntil(predicate, options)` 等待真值。选项包含 interval、timeout、AbortSignal，默认 1000 ms 和 30000 ms。任务立即执行，因此 timeout 为 0 时也会执行一次；取消在两次尝试之间检查，不能终止正在运行的任务。

```ts
import { maskPhone, maskEmail, maskName, maskBankCard, poll } from 'index-system';

maskPhone('13800138000'); // '138****8000'
maskEmail('alice@example.com'); // 'a****@example.com'
maskName('张三丰'); // '张**'
maskBankCard('4111111111111111'); // '4111********1111'

async function example() {
  let attempts = 0;
  // 轮询直到任务返回真值，或超时。
  return await poll(() => ++attempts >= 3, { interval: 10, timeout: 1000 });
}
```

### Schema

`stringSchema`、`numberSchema`、`booleanSchema`、`literalSchema`、`arraySchema`、`objectSchema`、`unionSchema` 提供轻量运行时解析。每个 Schema 支持 parse、safeParse、optional、refine；失败返回或抛出带属性路径的 SchemaError。objectSchema 只返回声明的字符串键，不转换类型。

`parse` 失败时抛出 `SchemaError`；`safeParse` 返回 `{ success: true, data }` 或 `{ success: false, error }`，不会抛异常。

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
  result.error.path; // 失败属性的路径
}
```

### 响应式与状态机

`createSignal(initial)` 提供 get、set、update、subscribe；通知同步执行，Object.is 相等的设置被忽略。`computed(compute, dependencies)` 根据显式依赖重新计算并提供 dispose；`watch(signal, listener, immediate?)` 返回取消监听函数。

`createStateMachine(config)` 提供 state、可变 context、send、subscribe。转换可以直接指定目标，也可包含 target、guard 和 action。guard 在 action 前执行，只有状态变化时才同步通知；未知或被阻止的事件返回 false。

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

### 数据差异

`objectDiff(left, right)` 为普通对象属性生成 add、remove、replace 操作；数组和特殊对象整体替换。`applyPatch(value, operations)` 在深拷贝上应用操作，删除根节点时可返回 undefined。`arrayDiff(left, right)` 通过深比较返回 added、removed，采用集合成员语义，不统计重复次数。

```ts
import { objectDiff, applyPatch, arrayDiff } from 'index-system';

const operations = objectDiff({ a: 1, b: 2 }, { a: 1, b: 3, c: 4 });
// [{ op: 'replace', path: ['b'], value: 3 }, { op: 'add', path: ['c'], value: 4 }]
applyPatch({ a: 1 }, [{ op: 'replace', path: ['a'], value: 9 }]); // { a: 9 }
arrayDiff([1, 2, 3], [2, 4]); // { added: [4], removed: [1, 3] }
```

### 调度器与单位

`createScheduler(concurrency?)` 调度同步或 Promise 任务，默认并发数为 1；已排队任务按高数值优先级执行，运行中的任务不会被抢占；提供 add、onIdle、pending、active。

`convertLength` 支持 mm、cm、m、km、in、ft、yd、mi；`convertWeight` 支持 mg、g、kg、oz、lb；`celsiusToFahrenheit` 与 `fahrenheitToCelsius` 用于摄氏与华氏温度换算。结果使用浮点数，比较时可能需要容差。

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

### 搜索

| 函数 | 返回值与行为 |
| --- | --- |
| `binarySearch(values, target, comparator?)` | 命中返回索引，未命中返回 `-(插入位置 + 1)` |
| `sortedIndex(values, target, comparator?)` | 目标在有序数组中应占据的索引 |

两者都要求数组已按 comparator 升序排好，且都不会修改输入。默认 comparator 使用 `<` 与 `>` 运算符。`binarySearch` 沿用惯例：未命中时返回负数，其中编码了插入位置。`sortedIndex` 直接返回该插入位置，因此空数组返回 `0`。

```ts
import { binarySearch, sortedIndex } from 'index-system';

binarySearch([1, 3, 5, 7], 5); // 2
binarySearch([1, 3, 5, 7], 4); // -3，插入位置为 2
sortedIndex([1, 3, 5, 7], 4); // 2
```

### 校验和

`md5(text)` 返回字符串的 MD5 摘要，形式为 32 位小写十六进制。MD5 是快速校验和，不是密码学哈希：可用于文件指纹、缓存 key 和变更检测，但绝不能用于密码存储、签名或任何需要抗碰撞的场景。文本按 UTF-8 编码，摘要与 `crypto.createHash('md5')` 一致，ASCII、非 ASCII 以及基本多文种平面之外的字符都相同。`index-system/wasm` 子路径由 Rust 内核提供同样的摘要，在大文本上更快。

```ts
import { md5 } from 'index-system';

md5('hello world'); // '5eb63bbbe01eeed093cb22bb8f5acdc3'
```

### Rust 与 WebAssembly 内核

`index-system/wasm` 子路径暴露 Rust 内核。它是独立入口，导入它不会影响上面 JavaScript 工具函数的按需导入。

| 函数 | 返回值与行为 |
| --- | --- |
| `md5(text)` | 字符串的 MD5 摘要，形式为 32 位小写十六进制 |

```ts
import { md5 } from 'index-system/wasm';

md5('hello world'); // '5eb63bbbe01eeed093cb22bb8f5acdc3'
```

内核版 `md5` 与包入口的 JavaScript `md5` 摘要完全一致，在 1 MB 文本上快约 23 倍。在 Node 中 `crypto.createHash('md5')` 仍是最快的方案，因为它是原生实现；内核的价值在浏览器 —— 那里没有同步的 MD5 可用。

## 兼容性与已知限制

- 文件转换依赖 File、Blob、FileReader、atob 或 URL.createObjectURL；Excel 的 File 输入需要 arrayBuffer()。请确认环境提供对应 API。
- 旧导出仍然可用，但已在类型声明中标注 `@deprecated`，将在下一个主版本中移除：base64Tofile → base64ToFile、bolbToFile → blobToFile、fileToBolb → fileToBlob、isRqual → isEqual、arrayIsRqual → arrayIsEqual、arrayIsRqualShallow → shallowEqual。objectIsRqualShallow 保留深比较行为，并且现在有了拼写正确的对应物 objectIsEqual。
- 相比旧实现，Excel 路径读取返回数组，File 读取返回 Promise；文件转换回调形式也返回 Promise。blobToFile 默认保留输入 MIME 类型。升级时请检查相关调用。
- `isData` 保留旧拼写，`isDate` 是其别名；二者均验证完整的 YYYY-M-D 或 YYYY-MM-DD 日历日期。`isPhoneNumer` 同样保留旧拼写。
- 格式校验只检查语法。URL 接受 HTTP/HTTPS，域名要求纯字母顶级标签，手机号和身份证校验无法确认号码存在或归属。
- MD5、校验类 Is 和 src/excel/excel.ts 的 xlsx 再导出未通过包入口导出。
- 浏览器 FileReader 行为通过模拟测试验证，尚未完成真实浏览器验证。
- `xlsx` 从 SheetJS 官方 CDN 安装，而不是 npm registry，因为 registry 上的版本冻结在 0.18.5，且仍带有原型污染和 ReDoS 公告。当前安装的是 0.20.3。有些扫描器因为公告数据里没有可对照的 npm 发布版本号，可能仍会对 CDN 版本报告这两条公告，但 `npm audit` 和 GitHub advisory API 都认为 0.20.3 已修复。
- WebAssembly 内核位于 `index-system/wasm` 子路径，不属于包入口，因此不会影响 JavaScript 工具函数的按需导入。它需要能实例化 WebAssembly 的运行时；在浏览器中二进制文件必须通过 HTTP 提供：打包器会自动把它作为资源输出，直接用 `<script>` 标签则不行。
- 使用旧式模块解析（`moduleResolution` 为 `node`）的 TypeScript 项目，通过 `typesVersions` 字段而不是 `exports` 映射来解析该子路径；使用 `node16`、`nodenext` 或 `bundler` 解析的项目则直接读取 `exports` 映射。

## 本地开发

测试需要 Node.js 20 或更高版本。由于 Vite 的要求，构建浏览器产物还需要 Node.js 20.19 或更高版本，或 22.12 或更高版本。

```bash
git clone https://github.com/15998194741/utils.git
cd utils
npm install
npm run build
npm test
```

`npm install` 会从 SheetJS 官方 CDN 拉取 `xlsx`，所以安装机器需要能访问 cdn.sheetjs.com；如果该域名不可达，可以单独下载 tarball，再用 `npm install ./xlsx-0.20.3.tgz` 从本地安装。

build 先检查类型，再清理项目内 dist 目录并生成 JavaScript 和类型声明。tsconfig.build.json 仅包含根入口与 src 下的 TypeScript 文件。测试涵盖数组、复制、比较、函数控制、异步、文件、Excel、对象、字符串、数值、URL 和树结构。

其他脚本如下：

| 命令 | 用途 |
| --- | --- |
| `npm run build:umd` | 用 Vite 构建浏览器产物到 dist-umd |
| `npm run build:all` | 同时构建 npm 包与浏览器产物 |
| `npm run build:wasm` | 构建 Rust 内核的 web 与 node 两套产物 |
| `npm run check:wasm-bundle` | 用 Vite 构建探针包，内核初始化被摇掉时报错 |
| `npm run lint` | 对 TypeScript 源码和构建脚本运行 ESLint |
| `npm run format` | 使用 Prettier 重写源码 |
| `npm run release -- patch` | 升版本、构建、打包、发布并推送 |
| `npm run versionAdd` | 仅升补丁版本号 |

.github/workflows/ci.yml 中的 GitHub Actions 工作流会在 Node 20.19、22.12、24 上执行安装、检查、构建、测试、校验内核仍能通过打包、并校验打包内容。

### 浏览器产物

`npm run build:umd` 以 Vite 的 library 模式构建，向 dist-umd 输出两个独立文件：`index-system.umd.js` 供 `<script>` 标签使用，`index-system.es.js` 供原生 ES module 导入使用。npm 包入口单独构建到 dist，两者不会混在一起。UMD 文件只暴露一个全局命名空间，不会把各个导出散落到页面上。

```html
<script src="index-system.umd.js"></script>
<script>
  console.log(indexSystem.unique([1, 1, 2])); // [1, 2]
  console.log(indexSystem.camelCase('hello-world')); // 'helloWorld'
</script>
```

UMD 产物内嵌了 xlsx，单文件即可运行，无需额外依赖。

浏览器产物由 vite.config.mts 配置。由于 Vite 8 只通过 `exports` 映射提供类型声明，而本包本身是 CommonJS，该文件改由 tsconfig.node.json 单独做类型检查。

```text
src/
├── array/       # 数组
├── object/      # 对象
├── string/      # 字符串
├── number/      # 数值
├── sort/        # 排序
├── function/    # 函数控制
├── async/       # 异步控制
├── url/         # 查询参数
├── tree/        # 树结构
├── utils/       # 复制、类型与比较
├── regular/     # 格式校验
├── file/        # 文件转换
├── excel/       # Excel 读取
├── encry/       # MD5，未从包入口导出
├── date/        # 本地日历工具
├── random/      # 随机值与 UUID
├── storage/     # 带 TTL 的 JSON 存储
├── event/       # 类型安全事件系统
├── data-structure/ # 队列、栈、优先队列和 LRU 缓存
├── json/        # 安全解析与稳定序列化
├── math/        # 统计计算
├── collection/  # 分组、分区和排序
├── memoize/     # 同步与异步缓存
├── result/      # 异常转 Result
├── assert/      # 运行时断言与类型收窄
├── encoding/    # Hex、UTF-8、Base64、Base64URL
├── semver/      # 语义化版本与范围
├── chinese/     # 身份证、手机号、银行卡及脱敏
├── mask/        # 展示脱敏
├── polling/     # 轮询和条件等待
├── schema/      # 运行时解析与校验
├── observable/  # Signal、计算值与监听
├── state-machine/ # 有限状态机
├── diff/        # 对象补丁和数组差异
├── scheduler/   # 带优先级的并发调度
├── unit/        # 长度、重量、温度换算
└── index.ts     # 汇总导出
```

### Rust 与 WebAssembly 内核

Rust 内核源码在 `rust/`，对外暴露的薄封装在 `wasm/`：

```text
rust/                 # Rust crate
├── Cargo.toml        #   package 与 release profile 写在同一个文件
├── Cargo.lock        #   提交入库，保证 Rust 构建可复现
├── src/lib.rs        #   内核实现
└── pkg/{web,node}/   #   编译产物，提交入库
wasm/                 # 手写封装
├── index.cjs         #   CommonJS 入口
├── index.mjs         #   ES module 入口，Node 与打包器通用
└── index.d.ts        #   手写类型声明
```

构建内核需要 Rust 工具链、`wasm32-unknown-unknown` target 和 wasm-pack：

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-pack

npm run build:wasm
```

| 命令 | 用途 |
| --- | --- |
| `npm run build:wasm` | 构建两套产物到 rust/pkg |
| `npm run build:wasm:web` | 只构建 web 目标，供打包器与浏览器使用 |
| `npm run build:wasm:node` | 只构建 node 目标 |
| `npm run check:wasm-bundle` | 用 Vite 构建探针包，内核初始化被摇掉时报错 |
| `cargo test` | 运行 Rust 单元测试 |

`rust/pkg` 下的编译产物是提交入库的，因此 `npm run build` 只做复制到 `dist/wasm`，CI 不需要 Rust 工具链。代价是：修改 `rust/src/lib.rs` 后，必须先运行 `npm run build:wasm` 并提交新产物才会生效。当前 CI 流程无法发现这种漂移，所以请把产物和源码一起重新构建并提交。

wasm-pack 自带的 binaryen 版本早于 bulk memory 提案，无法识别当前 Rust 默认生成的指令，因此在 package metadata 中关闭了优化器。这样产物体积会比开启优化时更大。

## 发布

发布脚本会执行完整流程：检查工作区、校验类型、提交待提交的改动、升版本、构建、检查打包产物、发布到 npm registry，并把 commit 和版本 tag 推送到 origin。

```bash
npm run release -- patch
npm run release -- minor
npm run release -- major
```

在版本号后面加 `--dry-run` 可以只做检查，不提交、不升级、不构建、不发布：`npm run release -- minor --dry-run`。

也可以手工发布：

```bash
npm version patch
npm run build
npm pack --dry-run
npm login --registry=https://registry.npmjs.org/
npm publish --access public --registry=https://registry.npmjs.org/
```

需要拥有包发布权限，并按 npm 提示完成认证。发布失败后先确认本地和 registry 的版本状态，再决定是否重试，不要反复升版本。如果发布成功后推送失败，发布脚本会打印已经成功到哪一步。Windows PowerShell 下用 npm.cmd，避免 npm.ps1 对参数的处理。

## 参与贡献

欢迎提交 [Issue](https://github.com/15998194741/utils/issues) 或 Pull Request。问题反馈请包含库版本、运行环境、最小复现代码、预期结果和实际结果。代码贡献请说明变更目的和验证方式，并补充相关行为测试。

## 许可证

[LICENSE](./LICENSE) 包含 Apache License 2.0，package.json 的 `license` 字段是 `Apache-2.0`。
