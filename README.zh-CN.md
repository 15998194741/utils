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

包通过 `dist/index.js` 支持 CommonJS，通过 `dist/index.mjs` 支持 ESM，类型声明入口为 `dist/index.d.ts`，`exports` 会选择对应入口。ESM 文件复用 CommonJS 实现，可使用原生 ESM 导入，但不能独立进行按需摇树优化。默认导出是字符串 `欢迎使用`，工具函数通过命名导出使用。

## API

### 数组

| 函数 | 返回值与行为 |
| --- | --- |
| `unique(values)` | 去重后的新数组，保留首次出现顺序 |
| `chunk(values, size)` | 按正整数 size 分块，返回二维数组 |
| `groupBy(values, key)` | 按回调结果分组，返回 Map |
| `intersection(left, right)` | 去重后的交集，保留 left 顺序 |
| `difference(left, right)` | 去重后的差集，保留 left 顺序 |

不修改输入。集合操作采用 Set 的相等规则：NaN 可以去重，对象按引用比较。

```ts
import { chunk, groupBy, difference } from 'index-system';

chunk([1, 2, 3], 2); // [[1, 2], [3]]
groupBy([{ role: 'admin' }], user => user.role).get('admin');
difference([1, 2, 3], [2]); // [1, 3]
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

```ts
import { pick, get, deepMerge, deepClone } from 'index-system';

pick({ id: 1, name: 'Alice' }, ['name']); // { name: 'Alice' }
get<number>({ user: { score: 90 } }, 'user.score', 0); // 90
get<number>({ 'a.b': 5 }, ['a.b']); // 5
deepMerge({ user: { name: 'Alice' } }, { user: { score: 90 } });
const cloned = deepClone({ items: [1, null], createdAt: new Date() });
```

get 支持点分路径或显式键数组，不解析方括号语法；缺失或 undefined 使用默认值，null 保持不变。pick 和 omit 支持 Symbol 键。

deepClone 支持普通对象、数组、Date、RegExp、Map、Set、循环引用、Symbol 属性和属性描述符。函数和其他类实例保留原引用。

deepMerge 合并可枚举自有属性，不修改输入；读取 getter，不保留属性描述符，返回 `Record<string, any>`。普通对象递归路径出现循环时抛错，其他值按 deepClone 规则处理。

isEmpty 将 null、undefined、空字符串、空数组、空 Map/Set，以及无可枚举自有属性的对象视为空；0 和 false 不为空。copy 仅适合 JSON 数据，不保留特殊类型；循环引用和 BigInt 会导致失败。

### 类型与相等比较

| 函数 | 行为 |
| --- | --- |
| `whatType(value)` | 返回小写类型名称，例如 array、object、null、undefined、map |
| `isEqual(a, b)` | 深比较普通对象和数组的可枚举自有属性，支持循环引用 |
| `shallowEqual(a, b)` | 比较一层可枚举自有属性，属性值使用 Object.is |
| `arrayIsEqual(...arrays)` | 深比较多个数组 |

isEqual 比较对象原型；Date、RegExp 按值比较，其他特殊实例按引用比较。whatType 基于 Object.prototype.toString。

```ts
import { whatType, isEqual, shallowEqual } from 'index-system';

whatType([]); // 'array'
isEqual({ a: 1, b: 2 }, { b: 2, a: 1 }); // true
shallowEqual({ user: {} }, { user: {} }); // false
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
| `debounce(fn, delay)` | 尾部防抖，使用最后一次调用的参数和 this |
| `throttle(fn, delay)` | 首次立即执行，间隔内的调用在尾部使用最新参数执行 |
| `once(fn)` | 缓存首次成功返回的结果 |

防抖和节流的普通调用返回 void，提供 cancel() 取消待执行调用、flush() 执行待处理调用并返回其结果，无待处理调用时返回 undefined。once 同步抛错后可重试；返回的 Promise（包括拒绝状态）会被缓存。

```ts
import { debounce } from 'index-system';

const save = debounce((text: string) => console.log(text), 300);
save('draft');
save('final');
save.flush(); // 立即输出 final
save.cancel();
```

### 异步控制

| 函数 | 行为 |
| --- | --- |
| `sleep(delay)` | 返回 Promise<void>，等待指定毫秒数 |
| `retry(task, options?)` | 默认额外重试 3 次，delay 默认 0；task 接收从 1 开始的尝试次数 |
| `withTimeout(promise, delay)` | 超时后拒绝，不取消底层操作 |
| `mapLimit(values, limit, mapper)` | 限制并发，结果保持输入顺序，mapper 接收值和索引 |

retries 必须为非负整数，limit 必须为正整数。mapLimit 失败后停止启动新任务，已启动任务继续运行。所有延迟必须为 0 到 2147483647 之间的有限毫秒数。

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

### 随机工具

`randomInt(min, max, random?)` 返回闭区间内的安全整数；`shuffle(values, random?)` 返回乱序副本；`sample(values, random?)` 从数组取一个值，空数组返回 undefined。三者默认使用 Math.random，不适合生成秘密数据。`uuid()` 使用 `crypto.randomUUID` 或 `crypto.getRandomValues` 生成 RFC 4122 v4 UUID，安全加密 API 不可用时抛错。

### 缓存存储

`createStorage(storage, prefix?)` 封装 localStorage 兼容对象，提供 `set(key, value, ttl?)`、`get(key, fallback?)` 和 `remove(key)`。值使用 JSON 序列化；TTL 单位为毫秒，0 表示立即过期。过期或损坏数据会被删除，序列化和底层存储异常会向调用方抛出。

```ts
import { createStorage } from 'index-system';

const cache = createStorage(localStorage, 'app:');
cache.set('profile', { name: 'Alice' }, 60_000);
cache.get('profile');
```

### 事件系统

`EventEmitter<Events>` 提供 on、once、off、emit、clear 和 listenerCount。on、once 返回取消订阅函数。emit 按注册顺序同步执行监听器快照，无监听器时返回 false；监听器异常会向外抛出并停止本次派发。

### 数据结构

- `Queue<T>`：enqueue、dequeue、peek、size、clear。
- `Stack<T>`：push、pop、peek、size、clear。
- `PriorityQueue<T>`：基于二叉堆；比较函数返回负数的元素优先。
- `LRUCache<K, V>`：容量必须为正整数；成功 get 会刷新使用顺序，keys 从最久未使用到最近使用迭代。

### JSON

`safeJsonParse<T>(text)` 对无效 JSON 返回 `{ ok: false, error }`，不抛出语法错误；泛型只断言类型，不校验运行时数据。`stableStringify(value, space?)` 递归排序对象键并保留数组顺序，适合普通 JSON 数据；循环引用和 BigInt 会抛错，规范化前不会调用 toJSON。

### 数学统计

`median(values)`、`variance(values)`、`percentile(values, p)` 要求非空且全部为有限数值，不修改输入。variance 计算总体方差；percentile 接受 `[0, 1]` 范围并使用线性插值；计算采用 JavaScript 浮点数。

```ts
import { median, variance, percentile } from 'index-system';

median([3, 1, 2]); // 2
variance([1, 2, 3]); // 0.666666...
percentile([0, 10, 20], 0.25); // 5
```

### 集合、缓存与结果

- `keyBy`、`countBy` 返回 Map；重复键时 keyBy 保留最后一个值。
- `partition` 返回 `[匹配项, 非匹配项]`；`orderBy` 根据多个 iteratee 稳定排序，方向可为 asc 或 desc。
- `memoize(fn)` 按参数引用缓存并提供 clear；`memoizeAsync(fn)` 会删除拒绝的 Promise，使后续调用可以重试。this 不属于缓存键。
- `tryCatch`、`tryCatchAsync` 将异常转换为带 ok 判别字段的 Result。

### 断言

`invariant` 收窄真值条件，`assertDefined` 排除 null 和 undefined，`assertNever` 用于 TypeScript 穷尽分支；失败时抛出 Error。

### 编码

提供 Hex、UTF-8、Base64 和 Base64URL 与字节之间的双向转换：`bytesToHex`、`hexToBytes`、`utf8ToBytes`、`bytesToUtf8`、`bytesToBase64`、`base64ToBytes`、`bytesToBase64Url`、`base64UrlToBytes`。无效输入抛错；UTF-8 严格解码；Base64 需要全局 btoa/atob。

### 语义化版本

`parseVersion`、`compareVersion`、`satisfiesVersion` 支持严格版本和预发布版本优先级。范围支持精确版本、比较符、空格 AND、`||` OR、脱字符和波浪号；不支持通配符、连字符范围或 npm 的完整范围语法。

### 中国业务工具

`isChineseIdCard` 校验 15 位旧身份证，或校验含出生日期与校验码的 18 位身份证；`isChineseMobile` 检查大陆手机号宽泛格式；`isBankCard` 对 12–19 位数字执行 Luhn 校验。`maskChineseMobile`、`maskChineseIdCard` 对有效输入脱敏，无效输入原样返回。以上校验不能确认号码是否签发、存在或属于某人。

### 脱敏与轮询

`maskPhone`、`maskEmail`、`maskName`、`maskBankCard` 保留两端信息并用星号替换中间部分，只用于展示，不验证输入。

`poll(task, options)` 重复执行直到 isDone 返回 true；`waitUntil(predicate, options)` 等待真值。选项包含 interval、timeout、AbortSignal，默认 1000 ms 和 30000 ms。任务立即执行，因此 timeout 为 0 时也会执行一次；取消在两次尝试之间检查，不能终止正在运行的任务。

### Schema

`stringSchema`、`numberSchema`、`booleanSchema`、`literalSchema`、`arraySchema`、`objectSchema`、`unionSchema` 提供轻量运行时解析。每个 Schema 支持 parse、safeParse、optional、refine；失败返回或抛出带属性路径的 SchemaError。objectSchema 只返回声明的字符串键，不转换类型。

### 响应式与状态机

`createSignal` 提供 get、set、update、subscribe；通知同步执行，Object.is 相等的设置被忽略。`computed(compute, dependencies)` 根据显式依赖重新计算并提供 dispose；`watch` 返回取消监听函数。

`createStateMachine(config)` 提供 state、可变 context、send、subscribe。转换可以直接指定目标，也可包含 target、guard 和 action。guard 在 action 前执行，只有状态变化时才同步通知；未知或被阻止的事件返回 false。

### 数据差异

`objectDiff` 为普通对象属性生成 add、remove、replace 操作；数组和特殊对象整体替换。`applyPatch` 在深拷贝上应用操作，删除根节点时可返回 undefined。`arrayDiff` 通过深比较返回 added、removed，采用集合成员语义，不统计重复次数。

### 调度器与单位

`createScheduler(concurrency?)` 调度同步或 Promise 任务；已排队任务按高数值优先级执行，运行中的任务不会被抢占；提供 add、onIdle、pending、active。

`convertLength` 支持 mm、cm、m、km、in、ft、yd、mi；`convertWeight` 支持 mg、g、kg、oz、lb；另有摄氏与华氏转换。结果使用浮点数，比较时可能需要容差。

## 兼容性与已知限制

- 文件转换依赖 File、Blob、FileReader、atob 或 URL.createObjectURL；Excel 的 File 输入需要 arrayBuffer()。请确认环境提供对应 API。
- 旧名称仍导出：base64Tofile → base64ToFile、bolbToFile → blobToFile、fileToBolb → fileToBlob、isRqual → isEqual、arrayIsRqual → arrayIsEqual、arrayIsRqualShallow → shallowEqual。objectIsRqualShallow 保留深比较行为。
- 相比旧实现，Excel 路径读取返回数组，File 读取返回 Promise；文件转换回调形式也返回 Promise。blobToFile 默认保留输入 MIME 类型。升级时请检查相关调用。
- `isData` 保留旧拼写，`isDate` 是其别名；二者均验证完整的 YYYY-M-D 或 YYYY-MM-DD 日历日期。`isPhoneNumer` 同样保留旧拼写。
- 格式校验只检查语法。URL 接受 HTTP/HTTPS，域名要求纯字母顶级标签，手机号和身份证校验无法确认号码存在或归属。
- MD5、校验类 Is 和 src/excel/excel.ts 的 xlsx 再导出未通过包入口导出。
- 浏览器 FileReader 行为通过模拟测试验证，尚未完成真实浏览器验证。

## 本地开发

测试需要 Node.js 20 或更高版本。

```bash
git clone https://github.com/15998194741/utils.git
cd utils
npm install
npm run build
npm test
```

build 先检查类型，再清理项目内 dist 目录并生成 JavaScript 和类型声明。tsconfig.build.json 仅包含根入口与 src 下的 TypeScript 文件。测试涵盖数组、复制、比较、函数控制、异步、文件、Excel、对象、字符串、数值、URL 和树结构。

可通过 npx webpack 生成 UMD 文件，输出到 webpack 目录；npm 包入口使用 dist，两者不同。

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

## 发布

在干净工作区中更新到未使用过的版本，再构建和检查发布内容：

```bash
npm version patch
npm run build
npm pack --dry-run
npm login --registry=https://registry.npmjs.org/
npm publish --access public --registry=https://registry.npmjs.org/
```

需要拥有包发布权限，并按 npm 提示完成认证。发布失败后先确认本地和远端版本状态，再决定是否重试，不要重复增加版本号。

仓库提供 scripts/release.cjs，但当前 package.json 未配置 release 命令。如需运行该脚本，请先配置对应 npm scripts；现有可直接执行的命令为 build、test 和 versionAdd。Windows PowerShell 可使用 npm.cmd 避免 npm.ps1 对参数的处理。

## 参与贡献

欢迎提交 [Issue](https://github.com/15998194741/utils/issues) 或 Pull Request。问题反馈请包含库版本、运行环境、最小复现代码、预期结果和实际结果。代码贡献请说明变更目的和验证方式，并补充相关行为测试。

## 许可证

[LICENSE](./LICENSE) 包含 Apache License 2.0 文本，但 package.json 的 license 字段为 ISC。两处声明尚未统一，维护者需要确认适用许可证。
