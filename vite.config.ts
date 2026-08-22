import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'api-photos-dev-server',
        configureServer(server) {
          const devPhotos = new Map();
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/photos')) {
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,PUT,OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

              if (req.method === 'OPTIONS') {
                res.statusCode = 200;
                res.end();
                return;
              }

              if (req.method === 'GET') {
                const photos = Array.from(devPhotos.values()).sort((a: any, b: any) => b.timestamp - a.timestamp);
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, photos, count: photos.length }));
                return;
              }

              if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', () => {
                  try {
                    const parsed = JSON.parse(body || '{}');
                    if (parsed.action === 'clear_all') {
                      devPhotos.clear();
                      res.statusCode = 200;
                      res.end(JSON.stringify({ success: true, photos: [] }));
                      return;
                    }
                    if (parsed.action === 'reset') {
                      devPhotos.clear();
                      res.statusCode = 200;
                      res.end(JSON.stringify({ success: true }));
                      return;
                    }
                    const photo = parsed.photo || parsed;
                    if (photo && photo.id) {
                      devPhotos.set(photo.id, photo);
                      res.statusCode = 200;
                      res.end(JSON.stringify({ success: true, photo, total: devPhotos.size }));
                      return;
                    }
                    res.statusCode = 400;
                    res.end(JSON.stringify({ success: false, error: 'Invalid photo data' }));
                  } catch (err: any) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ success: false, error: err.message }));
                  }
                });
                return;
              }

              if (req.method === 'PUT') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', () => {
                  try {
                    const parsed = JSON.parse(body || '{}');
                    if (parsed.id && devPhotos.has(parsed.id)) {
                      const existing = devPhotos.get(parsed.id);
                      const updated = { ...existing, ...parsed };
                      devPhotos.set(parsed.id, updated);
                      res.statusCode = 200;
                      res.end(JSON.stringify({ success: true, photo: updated }));
                      return;
                    }
                    res.statusCode = 404;
                    res.end(JSON.stringify({ success: false, error: 'Not found' }));
                  } catch (err: any) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ success: false, error: err.message }));
                  }
                });
                return;
              }

              if (req.method === 'DELETE') {
                const url = new URL(req.url, 'http://localhost:3000');
                const id = url.searchParams.get('id');
                if (id) {
                  devPhotos.delete(id);
                  res.statusCode = 200;
                  res.end(JSON.stringify({ success: true, deletedId: id }));
                  return;
                }
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, error: 'ID required' }));
                return;
              }
            }
            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
