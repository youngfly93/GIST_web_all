import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Build a single UMD bundle that Shiny can load with a plain <script> tag.
// All runtime deps (React, react-markdown, r2wc) are inlined so the consumer
// only needs the one file.
export default defineConfig({
  plugins: [react()],
  define: {
    // react-markdown / react-dom check NODE_ENV at bundle time
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    sourcemap: false,
    lib: {
      entry: fileURLToPath(new URL('src/entry.ts', import.meta.url)),
      name: 'DbgistChatWidget',
      formats: ['umd'],
      fileName: () => 'dbgist-chat.umd.js'
    },
    rollupOptions: {
      // no externals — everything bundled
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
