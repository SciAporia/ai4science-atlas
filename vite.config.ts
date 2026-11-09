import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative assets work on /, /repository-name/, and custom domains.
  base: './',
  build: { outDir: 'dist' },
});
