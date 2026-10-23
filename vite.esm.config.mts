import { fileURLToPath } from 'node:url'
import type { UserConfig } from 'vite'

/**
 * ES module build for the published npm package.
 *
 * `npm run build` compiles the CommonJS entry and the type declarations with
 * tsc, then runs this config to emit `dist/esm/index.js`. The CommonJS output
 * uses `__exportStar`, a runtime loop, so a bundler cannot tell which exports
 * a consumer actually uses. This build emits real static exports instead, which
 * is what makes per-function imports tree-shakeable.
 *
 * The browser bundle for `<script>` tags is a separate output; see
 * `vite.config.mts`.
 */
const config: UserConfig = {
  root: fileURLToPath(new URL('.', import.meta.url)),
  build: {
    outDir: 'dist/esm',
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
    lib: {
      entry: 'index.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      // xlsx is a runtime dependency, so it stays an import instead of being
      // inlined. A consumer that never touches the Excel helpers never pulls
      // it into their bundle.
      external: ['xlsx'],
      output: { exports: 'named' },
    },
  },
}

export default config
