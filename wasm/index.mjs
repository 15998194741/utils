// ES module entry for the `index-system/wasm` subpath.
//
// One file has to serve Node and the browser, and the two environments can
// only obtain the binary in different ways:
//
//   - Node reads the file from disk.
//   - A browser, or a bundler that emits the binary as an asset, fetches it
//     over http(s).
//
// The web target of wasm-pack resolves the binary with `new URL(...,
// import.meta.url)` and fetches it, which is the pattern a bundler rewrites
// into the URL of the asset it emits. Node's fetch cannot read a file: URL,
// so there the bytes come from the file system instead.
//
// `process.getBuiltinModule` reaches the file system without an import
// statement. A static `import 'node:fs'` would make the module impossible to
// bundle for the browser, and even a guarded dynamic import is resolved by
// bundlers and breaks the browser build.
import init, { initSync, md5 } from './web/index_system_wasm.js'

const nodeFs = globalThis.process?.getBuiltinModule?.('node:fs')

if (nodeFs) {
  initSync({ module: nodeFs.readFileSync(new URL('./web/index_system_wasm_bg.wasm', import.meta.url)) })
} else {
  await init()
}

export { md5 }
