import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\/app\b/, replacement: path.resolve(__dirname, './app') },
      { find: /^@\/auth$/, replacement: path.resolve(__dirname, './src/auth') },
      // Specific aliases before general ones - ORDER MATTERS!
      { find: /^@\/lib\/cms\/templates\b/, replacement: path.resolve(__dirname, './src/lib/cms/templates') },
      // src/lib/cms specific files (style, embed, themeTokens, etc.)
      { find: /^@\/lib\/cms\/style\b/, replacement: path.resolve(__dirname, './src/lib/cms/style') },
      { find: /^@\/lib\/cms\/embed\b/, replacement: path.resolve(__dirname, './src/lib/cms/embed') },
      { find: /^@\/lib\/cms\/themeTokens\b/, replacement: path.resolve(__dirname, './src/lib/cms/themeTokens') },
      { find: /^@\/lib\/cms\/css-generator\b/, replacement: path.resolve(__dirname, './src/lib/cms/css-generator') },
      { find: /^@\/lib\/cms\/blockFactory\b/, replacement: path.resolve(__dirname, './src/lib/cms/blockFactory') },
      // lib/cms for blockPositioning, blockRegistry, blockValidation, fonts, validation
      { find: /^@\/lib\/cms\b/, replacement: path.resolve(__dirname, './lib/cms') },
      { find: /^@\/lib\b/, replacement: path.resolve(__dirname, './src/lib') },
      { find: /^@\/env\b/, replacement: path.resolve(__dirname, './src/env') },
      { find: /^@\/i18n\b/, replacement: path.resolve(__dirname, './src/i18n') },
      { find: /^@\/components\b/, replacement: path.resolve(__dirname, './components') },
      { find: /^@\/context\b/, replacement: path.resolve(__dirname, './context') },
      { find: /^@\/types\b/, replacement: path.resolve(__dirname, './types') },
      { find: /^@\//, replacement: path.resolve(__dirname, './src/') },
    ],
  },
  test: {
    environment: 'happy-dom',
    include: [
      'test/**/*.test.ts',
      'test/**/*.test.tsx',
    ],
    exclude: [
      'e2e/**',
      'node_modules/**',
    ],
    setupFiles: ['test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/lib/**',
        'app/api/**/route.ts',
      ],
      exclude: [
        'src/lib/prisma.ts',
      ],
    },
  },
})
