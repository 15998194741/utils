// CommonJS entry for the `index-system/wasm` subpath.
//
// The node target of wasm-pack reads the binary and instantiates the module
// synchronously at import time, so the functions are usable right away.
module.exports = require('./node/index_system_wasm.js')
