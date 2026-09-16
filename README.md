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

TypeScript 编译输出位于 dist 目录。当前 `npm run build` 仅执行 `echo 1`，不会生成发布文件；仓库尚未配置测试脚本。

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
