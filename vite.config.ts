import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'dev-api-mock',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/projects') {
            const raw = fs.readFileSync(path.resolve(__dirname, 'src/data/projects.json'), 'utf8');
            const data = JSON.parse(raw).map((p: any) => ({ ...p, publishState: 'PUBLISHED' }));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data, source: 'vite-dev' }));
            return;
          }
          next();
        });
      },
    },
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
