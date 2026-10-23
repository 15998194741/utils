# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- The package is now tree-shakeable for ES module consumers. The ESM entry was a
  wrapper that destructured the CommonJS bundle at runtime, and the CommonJS
  bundle re-exports through `__exportStar`, a runtime loop, so no bundler could
  tell which exports a consumer actually used. A consumer importing only
  `unique` received the whole 1.3 MB library including the bundled xlsx
  dependency. The ESM entry is now a real ES module with static exports, so the
  same consumer receives about 100 bytes and no xlsx. The CommonJS entry is
  unchanged, because CommonJS exports cannot be statically analyzed.
- A clean `npm install` no longer breaks `npm run build`. `@types/node` was only
  reachable as a transitive dependency of `webpack`, so its version floated to
  releases that require TypeScript 5.x syntax while this project compiles with
  TypeScript 4.9. The result was 50 parse errors in `node_modules/@types/node/ffi.d.ts`
  on every fresh clone. `@types/node` is now a pinned direct devDependency.
- `scripts/release.cjs` is reachable again through `npm run release`. The script
  documented that entry point, but `package.json` never defined it.
- The browser bundle now exposes a single `indexSystem` global. The webpack
  configuration set `libraryTarget: 'umd'` without `library.name`, so every
  export was written directly onto `window` instead of into a namespace.
- `src/excel/excel.ts` was removed. It re-exported the whole `xlsx` package but
  was unreachable from the package entry, and it made bundlers include xlsx
  twice for CommonJS consumers.
- `md5` now follows the standard for every kind of text. The implementation
  encoded a string by walking its UTF-16 code units, so a character outside
  the Basic Multilingual Plane, such as an emoji, was encoded as two separate
  three-byte sequences and produced a digest that no other MD5 implementation
  agrees with. It also folded `\r\n` into `\n` before hashing. Both are gone:
  the digest now matches `crypto.createHash('md5')` for ASCII, non-ASCII, and
  astral input, and for text with any line endings. Digests of strings that
  contain a carriage return, a line feed pair, or a character above U+FFFF
  change with this release.
- `arrayDiff` no longer compares every entry of one side against every entry
  of the other side. The quadratic comparison made a list of 16,000 records
  take 80 seconds. The entries are now indexed by a key that is consistent
  with `isEqual`, so only the few candidates that can still be equal are
  compared in full. The result is identical, and the cost is linear: the same
  list now takes 39 milliseconds, and 100,000 records take 265 milliseconds.
- `bytesToBase64` and `bytesToHex` no longer build their result one character
  at a time, which reallocated the string on every step. Converting a
  megabyte is about 13 times faster for base64 and 6 times faster for hex,
  and the language level `Uint8Array.prototype.toBase64` and `toHex` are used
  when the runtime has them.
- The examples in the README no longer call a kernel function that was
  removed before the release. The CommonJS example and the dynamic import
  example still referred to `add`, which the kernel no longer exports, so
  copying them threw `add is not a function`.

### Changed

- The `license` field now matches the `LICENSE` file. The repository ships the
  Apache License 2.0, while `package.json` declared ISC.
- Every exported API now carries JSDoc. The comments reach the published type
  declarations, so consumers see them while hovering an API in an editor.
- `whatType` returns the exported `WhatType` union. The previous local union
  claimed `Undefined` while the implementation returned `undefined`, and
  `types | string` collapsed the whole union into `string`.
- The ES module entry moved from `dist/index.mjs` to `dist/esm/index.js`, and
  the `module` and `exports.import` fields point at the new path. Importing the
  package by name is unaffected; only a deep import of the old file path
  changes, and the `exports` map did not allow it before either.
- `package.json` declares `sideEffects` as a list that only covers the
  WebAssembly kernel entry, which does load a module. Every other module in
  the package is free of side effects, so a bundler may still drop the
  package entirely when a consumer imports nothing from it.
- `xlsx` is installed from the official SheetJS distribution instead of the npm
  registry mirror, which drops the reported prototype-pollution and ReDoS advisories.
  The public API and the `xlsx` re-export are unchanged.
- The browser bundle is now built with Vite in library mode instead of webpack.
  The output moved from `webpack/` to `dist-umd/`, and the two files are now
  `index-system.umd.js` and `index-system.es.js`.
- The browser bundle is configured by `vite.config.mts` and type-checked by
  `tsconfig.node.json`. Vite 8 publishes its type declarations only through an
  `exports` map, which the project's `moduleResolution: node` cannot read, and
  the package itself is CommonJS, so the config file needs its own settings.
- `@types/node` moved from 18 to 20, which is what Vite 8 requires. TypeScript
  4.9 still compiles the project against it.
- TypeScript output now uses LF line endings on every platform, so a package
  built on Windows no longer differs from one built elsewhere.

### Added

- `objectIsEqual`, the correctly spelled counterpart to the legacy
  `objectIsRqualShallow`. It performs a deep comparison, matching the historical
  behavior of the legacy name.
- Type guards in `src/guard`: `isObject`, `isPlainObject`, `isArray`,
  `isString`, `isNumber`, `isBoolean`, `isFunction`, `isNil`, and `isPromise`.
  `isNumber` rejects `NaN`, and `isPromise` uses duck typing so it also matches
  plain thenables.
- Path operations in `src/path`: `set`, `unset`, and `update`. All three are
  immutable and follow the same path rules as `get`.
- Search helpers in `src/search`: `binarySearch` and `sortedIndex`.
- Array helpers: `range`, `toArray`, `flatten`, `first`, `last`, `compact`,
  `take`, `drop`, `zip`, `unzip`, and `arrayMove`.
- Object helpers: `pickBy`, `omitBy`, `defaults`, and `assign`.
- Functional helpers: `compose`, `pipe`, and `curry`.
- `md5` is now exported from the package entry. The implementation was already
  present but unreachable, and it matches `crypto.createHash('md5')` for ASCII
  and UTF-8 input. It is documented as a checksum, not a cryptographic hash.
- `debounce` accepts `leading` and `maxWait` options, `throttle` accepts
  `leading`, and `retry` accepts `backoff` and `maxDelay`. Without options all
  three behave exactly as before.
- `npm run build:umd` builds the browser bundles with Vite into `dist-umd`, and
  `npm run build:all` builds both the npm package and the browser bundles.
- `npm run lint` runs ESLint over the TypeScript sources and the build scripts.
  The configuration lives in `eslint.config.js` and `.eslintignore`.
- `npm run format` runs Prettier. The configuration lives in `.prettierrc.json`
  and `.prettierignore`.
- A GitHub Actions workflow that installs, lints, builds, tests, and verifies the
  packed tarball contents on Node 20.19, 22.12, and 24.
- A Rust kernel compiled to WebAssembly, published as the `index-system/wasm`
  subpath so that it never affects the tree-shaking of the JavaScript helpers.
  The entry initializes itself, works in Node and in the browser, and is
  verified in a real browser. It currently exposes `md5`, which is about 23
  times faster than the JavaScript implementation on a megabyte of text.
- The workflow pins one npm version across the Node matrix, moves the checkout
  and setup-node actions to v5, and pins the runner to `ubuntu-24.04` instead
  of the floating `ubuntu-latest` label.
- `npm run verify:docs` runs every example in the README files and compares
  the documented results with what the code actually produced. It also reports
  a documented expression that never ran, which is how an example can call an
  API that no longer exists without anything failing.

### Deprecated

- The legacy misspelled aliases are kept for backward compatibility but are now
  marked `@deprecated`: `base64Tofile`, `bolbToFile`, `fileToBolb`, `isRqual`,
  `arrayIsRqual`, `arrayIsRqualShallow`, and `objectIsRqualShallow`. Use
  `base64ToFile`, `blobToFile`, `fileToBlob`, `isEqual`, `arrayIsEqual`,
  `shallowEqual`, and `objectIsEqual` instead. They will be removed in the next
  major release.

### Removed

- The `ts-lint` devDependency. It was discontinued, had no configuration in the
  repository, and pulled in the vulnerable `optimist` and `minimist` packages.
- The `eslint-plugin-prettier` devDependency. Formatting is available through
  `npm run format`; ESLint no longer reports formatting as lint errors.
- The `webpack`, `webpack-cli`, and `ts-loader` devDependencies and
  `webpack.config.js`. They were never part of the build, test, or publish
  pipeline; only the browser bundle used them, and Vite now covers that.

## [1.1.4] - 2026-09-19

- Added an `exports` map so bundlers and Node resolve the ESM and CommonJS
  entries separately.
- The `module` field now points at `dist/index.mjs` instead of the CommonJS
  bundle.

## [1.1.3] - 2026-09-16

- Added general-purpose modules: assertions, Chinese business helpers,
  collections, data structures, dates, diffing, encoding, events, JSON, masking,
  math, memoization, observables, polling, random values, results, scheduling,
  schemas, semantic versions, state machines, storage, and unit conversion.

## [1.1.2] - 2026-09-16

- Added the English README.

## [1.1.1] - 2026-09-16

- Added APIs for arrays, asynchronous control, files, function control, numbers,
  objects, strings, trees, URL query parameters, and copying.
- Added the automated test suite.

## [1.1.0] - 2026-09-16

- Added the sorting module with bubble, insertion, selection, shell, quick,
  merge, and heap sorts.
- Added the TypeScript build script and the release script.

This version was tagged in the repository but was never published to the npm
registry. The published sequence goes from 1.0.10 straight to 1.1.1.

## [1.0.10] - 2022-01-27

- Exported the `xlsx` package from the Excel module.

## [1.0.9] - 2022-01-27

- Added file conversion helpers and Excel reading.

## [1.0.9-4] - 2022-02-10

- Pre-release iteration of 1.0.9.

## [1.0.9-3] - 2022-01-27

- Pre-release iteration of 1.0.9.

## [1.0.9-2] - 2022-01-27

- Pre-release iteration of 1.0.9.

## [1.0.9-1] - 2022-01-27

- Pre-release iteration of 1.0.9.

## [1.0.8] - 2022-01-26

- Earlier published release.

## [1.0.7] - 2022-01-26

- Earlier published release.

[Unreleased]: https://github.com/15998194741/utils/compare/v1.1.4...HEAD
[1.1.4]: https://github.com/15998194741/utils/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/15998194741/utils/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/15998194741/utils/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/15998194741/utils/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/15998194741/utils/compare/v1.0.10...v1.1.0
[1.0.10]: https://github.com/15998194741/utils/compare/v1.0.9...v1.0.10
[1.0.9]: https://github.com/15998194741/utils/compare/v1.0.9-4...v1.0.9
[1.0.9-4]: https://github.com/15998194741/utils/compare/v1.0.9-3...v1.0.9-4
[1.0.9-3]: https://github.com/15998194741/utils/compare/v1.0.9-2...v1.0.9-3
[1.0.9-2]: https://github.com/15998194741/utils/compare/v1.0.9-1...v1.0.9-2
[1.0.9-1]: https://github.com/15998194741/utils/compare/v1.0.9...v1.0.9-1
[1.0.8]: https://github.com/15998194741/utils/compare/v1.0.7...v1.0.8
[1.0.7]: https://github.com/15998194741/utils/releases/tag/v1.0.7
