import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.js', 'tests/transport/**/*.test.js', 'tests/usecases/**/*.test.js'],
    coverage: {
      provider: 'v8',
    },
  },
});
