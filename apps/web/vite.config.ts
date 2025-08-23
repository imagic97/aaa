import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    allowedHosts: true
  },
  build: {
    target: 'esnext',
    outDir: '../../dist/web',
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          /** 转换 cjs 为 esm 的辅助函数 */
          if (id.includes('commonjsHelpers.js')) {
            return `vendor-others`
          }

          if (id.startsWith('\x00vite/')) {
            return 'vite'
          }

          if (id.includes('/node_modules/@babel/')) {
            return 'vendor-babel'
          }
          if (id.includes('/node_modules/@vue/compiler-sfc/')) {
            return 'vendor-vue-compiler-sfc'
          }
        },
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "sass:math"; ',
      },
    },
  },
})
