# index-system

一个使用 TypeScript 编写的 JavaScript 工具库，提供对象复制、类型判断、格式校验、文件转换和 Excel 读取功能。

[npm](https://www.npmjs.com/package/index-system) · [源码](https://github.com/15998194741/utils) · [问题反馈](https://github.com/15998194741/utils/issues)

## 安装

```bash
npm install index-system
# 或
pnpm add index-system
# 或
yarn add index-system
```

## 快速开始

```ts
import { copy, whatType, isEmail } from 'index-system';

const source = { name: 'Alice', tags: ['TypeScript'] };
const cloned = copy(source);

console.log(cloned === source); // false
console.log(whatType(source)); // 'object'
console.log(isEmail('alice@example.com')); // true
```

CommonJS 项目可以使用：

```js
const { whatType, isEmail } = require('index-system');

console.log(whatType([])); // 'array'
```

## API

### 排序算法

```ts
import { quickSort, mergeSort } from 'index-system';

const numbers = [3, 1, 2];
quickSort(numbers); // [1, 2, 3]，原数组不变
quickSort(numbers, (a, b) => b - a); // [3, 2, 1]
mergeSort([{ score: 90 }, { score: 80 }], (a, b) => a.score - b.score);
```

所有排序函数接收只读数组，返回新的浅拷贝数组。数字默认升序；字符串、对象等类型需要提供比较函数。比较函数返回负数表示前者排在前面，零表示相等，正数表示后者排在前面。数字默认比较适用于不含 NaN 的数值。

| 导出 | 算法 | 时间复杂度（平均 / 最坏） | 稳定排序 |
| --- | --- | --- | --- |
| `bubbleSort` | 冒泡排序 | O(n²) / O(n²) | 是 |
| `selectionSort` | 选择排序 | O(n²) / O(n²) | 否 |
| `insertionSort` | 插入排序 | O(n²) / O(n²) | 是 |
| `shellSort` | 希尔排序（折半步长） | 取决于输入 / O(n²) | 否 |
| `mergeSort` | 归并排序 | O(n log n) / O(n log n) | 是 |
| `quickSort` | 三路快速排序 | O(n log n) / O(n²) | 否 |
| `heapSort` | 堆排序 | O(n log n) / O(n log n) | 否 |

以下工具均为包入口的命名导出。默认导出为字符串 `欢迎使用`，不是工具对象。

### 对象复制

#### `copy(value)`

通过 JSON 序列化和反序列化复制对象或数组，适用于可进行 JSON 序列化的数据。

```ts
import { copy } from 'index-system';

const cloned = copy({ user: { name: 'Alice' }, scores: [90, 95] });
```

该方法不保留函数、undefined、Symbol 等值；Date 会转换为字符串，Map 和 Set 不会保留原有内容。循环引用和 BigInt 会导致序列化失败。

#### `copy.deepcopy(value)`

递归复制对象属性和数组元素，不支持循环引用、Date、Map、Set 等特殊对象，也不保留对象原型。

当前实现会将直接传入的基本类型转换为空对象，因此数组中的基本类型元素也无法正确复制。使用前需注意此限制。

### 类型判断

#### `whatType(value): string`

通过 `Object.prototype.toString` 判断类型，返回小写类型名称。

```ts
import { whatType } from 'index-system';

whatType(42); // 'number'
whatType('hello'); // 'string'
whatType([]); // 'array'
whatType({}); // 'object'
whatType(null); // 'null'
whatType(undefined); // 'undefined'
whatType(new Map()); // 'map'
whatType(new Set()); // 'set'
whatType(/hello/); // 'regexp'
```

### 格式校验

所有校验函数返回 boolean。函数名称保留当前版本的拼写，例如 `isPhoneNumer` 和 `isData`。

| 函数 | 参数 | 用途 |
| --- | --- | --- |
| `isEmail` | `string` | 邮箱格式 |
| `isId` | `string` | 身份证号码格式 |
| `isPhoneNumer` | `string \| number` | 手机号格式 |
| `isDomainName` | `string` | 域名格式 |
| `isInternetUrl` | `string` | URL 格式 |
| `isData` | `string` | 日期字符串格式 |
| `isXml` | `string` | XML 文件名格式 |
| `isChinese` | `string` | 是否全部为指定范围内的汉字 |
| `isIp` | `string` | IPv4 格式 |
| `isLowerCase` | `string` | 是否全部为小写英文字母 |
| `isUpperCase` | `string` | 是否全部为大写英文字母 |
| `isAlphabets` | `string` | 是否全部为英文字母 |

```ts
import { isEmail, isChinese, isLowerCase } from 'index-system';

isEmail('alice@example.com'); // true
isChinese('你好'); // true
isLowerCase('hello'); // true
isLowerCase('Hello'); // false
```

这些函数提供正则格式检查，不验证地址是否存在或号码是否有效。当前实现存在以下限制：

- `isId` 的 15 位校验结果会被后续赋值覆盖，且未检查身份证校验码。
- 手机号规则仅包含部分号段。
- `isData` 仅检查日期格式前缀，不验证实际日期，也不要求匹配完整字符串。
- `isDomainName`、`isIp` 和 `isXml` 的正则存在转义问题，可能无法识别正常输入。

### 浏览器文件转换

这些 API 依赖浏览器的 File、Blob、FileReader、atob 或 URL.createObjectURL，使用前应确认运行环境提供对应 API。

| 函数 | 返回值 | 用途 |
| --- | --- | --- |
| `fileToBase64(file)` | `Promise<string>` | File 转 Base64 Data URL |
| `base64Tofile(base, filename?)` | `File` | Data URL 转 File；默认文件名为 png |
| `bolbToFile(blob, fileName?, type?)` | `File` | Blob 转 File；默认 MIME 类型为 image/png |
| `fileToBolb(file)` | `Promise<any>` | File 转 Blob |
| `fileToUrl(file)` | `string` | 创建对象 URL |
| `base64ToBlob(base64, mimeType?)` | `Blob` | Data URL 转 Blob |
| `blobToDataURL(blob)` | `Promise<any>` | Blob 转 Data URL |

名称和大小写按当前导出保留。Base64 转换函数接收包含 MIME 信息的完整 Data URL，例如 `data:image/png;base64,...`。

```ts
import { base64ToBlob, fileToUrl } from 'index-system';

const blob = base64ToBlob('data:text/plain;base64,SGVsbG8=');
const file = new File([blob], 'hello.txt', { type: 'text/plain' });
const url = fileToUrl(file);

// 使用完毕后释放对象 URL。
URL.revokeObjectURL(url);
```

`fileToBase64`、`fileToBolb` 和 `blobToDataURL` 还提供回调重载。当前实现中，不传回调时 Promise 可能一直处于 pending 状态；传入返回 undefined 的回调时可以收到转换结果。读取失败也没有对应的 Promise 拒绝处理。

### Excel 读取

#### `readExcelToJSON(file, sheetName?)`

用于读取 Excel 并将工作表转换为 JSON，未指定 sheetName 时选择第一个工作表。当前类型声明接受文件路径或浏览器 File，返回类型声明为 `Record<string, any>`。

当前实现使用 `xlsx.readFile`，且将工作表名称直接传给 `sheet_to_json`，未获取 `workbook.Sheets[sheetName]`。因此此 API 尚不能作为可靠的 Excel 转换接口使用，浏览器 File 重载也未实现对应的读取流程。

## 运行环境与导出范围

- 包入口配置为 `dist/index.js`，TypeScript 类型入口为 `dist/index.d.ts`。
- 对象复制、类型判断和格式校验不依赖浏览器 DOM API。
- 文件转换需要浏览器相关 API；Excel 当前使用文件系统读取方式。
- 相等比较工具（`src/utils/equal.ts`）、MD5（`src/encry`）、校验类 Is 和 `src/excel/excel.ts` 中的 xlsx 再导出，均未通过包入口导出。

## 本地开发

```bash
git clone https://github.com/15998194741/utils.git
cd utils
npm install
npx tsc -p tsconfig.json
```

运行 `npm run build` 会先检查类型，再清理项目内的 dist 目录并生成 JavaScript 和类型声明。发布构建使用 tsconfig.build.json，仅包含包入口和 src 下的 TypeScript 文件；仓库尚未配置测试脚本。

## 自动发布

先安装依赖，并通过 `npm login --registry=https://registry.npmjs.org/` 登录拥有包发布权限的账户。

```bash
# 只检查类型、Git 配置及变更格式，不修改版本或发布
npm.cmd run release:check

# 提交改动，更新补丁版本并发布
npm.cmd run release

# 更新次版本或主版本
npm.cmd run release -- minor
npm.cmd run release -- major
```

以上命令适用于 Windows PowerShell，使用 npm.cmd 避免参数被 npm.ps1 包装脚本处理；其他平台使用 npm 即可。脚本会自动提交仓库中所有未被 Git 忽略的改动（包括新文件），然后创建版本提交和 v 开头的标签、构建、检查实际 npm 压缩包、发布到 npmjs 的 latest 标签，最后将当前分支和版本标签推送到 origin。运行前请检查 `git status`，确保所有改动均需要提交。发布时按 npm 提示完成认证。

任一步骤失败都会停止。npm 发布和 Git 推送不是一个事务：如果 npm 发布成功但 Git 推送失败，按脚本输出重试 Git 推送即可；如果已更新本地版本但发布失败，先检查本地标签和 npm 上的版本状态，不要直接重复执行 release，以免再次增加版本号。打包文件保存在脚本生成的系统临时目录中。

仓库还提供 webpack 配置，可通过 `npx webpack` 生成 UMD 打包文件，输出目录为 webpack，与 npm 包入口使用的 dist 目录不同。

```text
utils/
├── index.ts             # 包入口
├── sample.ts            # 源码使用示例
├── src/
│   ├── index.ts         # 模块汇总导出
│   ├── utils/           # 复制、类型判断与相等比较
│   ├── regular/         # 正则校验
│   ├── file/            # 浏览器文件转换
│   ├── excel/           # Excel 读取
│   └── encry/           # MD5 实现
├── tsconfig.json
└── webpack.config.js
```

## 参与贡献

欢迎通过 [Issues](https://github.com/15998194741/utils/issues) 提交问题或功能建议，也欢迎提交 Pull Request。

提交问题时，请提供运行环境、库版本、最小复现代码以及预期和实际结果。提交代码时，请说明变更目的及验证方式。

## 许可证

仓库的 [LICENSE](./LICENSE) 文件包含 Apache License 2.0 文本，但 package.json 的 license 字段当前为 ISC。两处声明尚未统一，项目维护者需要确认适用许可证。
