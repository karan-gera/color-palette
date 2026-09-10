import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: [
        'src/helpers/**/*.ts',
        'src/hooks/**/*.ts',
        'src/lib/**/*.ts',
      ],
      thresholds: {
        statements: 81,
        branches: 76,
        functions: 77,
        lines: 82,
      },
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
