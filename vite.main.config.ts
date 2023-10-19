import { defineConfig, normalizePath } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config
export default defineConfig({
  publicDir: 'public',
  build: {
    lib: {
      entry: './src/main',
      fileName: 'main',
    },
  },
  plugins: [
    // Copy whisper-related files to build folder
    viteStaticCopy({
      targets: [
        {
          src: normalizePath(resolve(__dirname, 'src/addons')),
          dest: './',
        },
        {
          src: normalizePath(resolve(__dirname, 'src/assets')),
          dest: './',
        },
        // edge-impulse-standalone.js requires edge-impulse-standalone.wasm to be
        // in the root dir
        // TODO find a better way to fix this
        {
          src: normalizePath(
            resolve(
              __dirname,
              'src/packages/edge-impulse/edge-impulse-standalone.wasm'
            )
          ),
          dest: './',
        },
      ],
    }),
  ],
  resolve: {
    // Some libs that can run in both Web and Node.js, such as `axios`, we need to tell Vite to build them in Node.js.
    browserField: false,
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
});
