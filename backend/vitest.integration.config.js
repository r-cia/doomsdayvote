import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.js'],
    globalSetup: ['./tests/integration/global-setup.js'],
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 240000,
  },
});
