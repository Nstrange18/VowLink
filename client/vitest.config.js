import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Keep test configuration separate from production build and chunk settings.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    environmentOptions: { jsdom: { url: 'http://localhost/' } },
  },
})
