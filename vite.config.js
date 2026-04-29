import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'data-persistence',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/data' && req.method === 'GET') {
            const dataPath = path.resolve(__dirname, 'data/db.json');
            if (fs.existsSync(dataPath)) {
              const data = fs.readFileSync(dataPath, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(data);
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'File not found' }));
            }
          } else if (req.url === '/api/data' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              const dataPath = path.resolve(__dirname, 'data/db.json');
              const dir = path.dirname(dataPath);
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
              fs.writeFileSync(dataPath, body);
              res.end('ok');
            });
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    watch: {
      ignored: ['**/data/**', '**/perfil_sistema/**']
    }
  }
})
