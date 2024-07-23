import { defineConfig } from 'vite';
import restart from 'vite-plugin-restart'

export default defineConfig({
  // Additional configuration if needed
  plugins: [
    restart({ restart: [ '../public/**', ] })
  ]
});