import { fileURLToPath } from 'node:url'
import type { UserConfig } from 'vite'

/**
 * Browser bundle for `<script>` tag and CDN usage.
 *
 * The npm package entry is built separately by `npm run build` (tsc), which
 * emits `dist/` with CommonJS, ESM, and type declarations. This config only
 * produces the standalone browser files under `dist-umd/`.
 */
const config: UserConfig = {
  // Pin the root to the project directory so the entry resolves the same way
  // regardless of the directory the command is run from.
  root: fileURLToPath(new URL('.', import.meta.url)),
  build: {
    outDir: 'dist-umd',
    emptyOutDir: true,
    sourcemap: false,
    // The browser bundle is for direct script inclusion, so xlsx is bundled
    // in rather than left as an external import.
    lib: {
      entry: 'index.ts',
      // Global name for the UMD build, e.g. window.indexSystem.unique(...).
      name: 'indexSystem',
      formats: ['umd', 'es'],
      fileName: (format) => `index-system.${format}.js`,
    },
    rollupOptions: {
      output: { exports: 'named' },
    },
  },
}

export default config
