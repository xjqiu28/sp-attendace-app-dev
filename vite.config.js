import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' makes built asset paths relative, so the site works
// whether it's served from the domain root or from a GitHub Pages
// project subpath (https://username.github.io/repo-name/) without
// needing to hardcode the repo name here.
export default defineConfig({
  plugins: [react()],
  base: './',
});
