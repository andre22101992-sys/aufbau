import { defineConfig } from 'vitest/config';

// Die Tests prüfen reine Logik (TypeScript ohne Svelte-Komponenten), deshalb ohne Svelte-Plugin.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
