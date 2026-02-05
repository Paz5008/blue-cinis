import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Rename this file to `vitest.config.mts` to enable Vitest aliases locally/CI.
// Requires devDependency: vite
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './components'),
      '@/context': path.resolve(__dirname, './context'),
      '@/types': path.resolve(__dirname, './types'),
    },
  },
  test: {
    environment: 'node',
  },
})
