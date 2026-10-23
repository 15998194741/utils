// Hand written types for the `index-system/wasm` subpath.
//
// The declarations that wasm-bindgen generates are not usable here: they
// reference DOM only types such as `RequestInfo` and `Response`, and the
// `WebAssembly` namespace, none of which exist in a Node project that does
// not include the DOM library. A project that turns `skipLibCheck` off would
// fail to compile against them, so the public surface is declared by hand.

/**
 * The MD5 digest of a string, as 32 lowercase hexadecimal characters.
 *
 * The input is encoded as UTF-8, which matches the implementation in the
 * package entry.
 */
export declare function md5(input: string): string
