import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootAssetsDir = path.resolve(__dirname, '../assets');

function serveRootAssets() {
  return {
    name: 'serve-root-assets',
    configureServer(server) {
      server.middlewares.use('/assets', (req, res, next) => {
        const urlPath = decodeURIComponent((req.url || '').split('?')[0]);
        const filePath = path.resolve(rootAssetsDir, `.${urlPath}`);

        if (!filePath.startsWith(rootAssetsDir) || !existsSync(filePath)) {
          next();
          return;
        }

        const stat = statSync(filePath);
        if (!stat.isFile()) {
          next();
          return;
        }

        createReadStream(filePath).pipe(res);
      });
    }
  };
}

export default defineConfig({
  plugins: [serveRootAssets()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/voicebox-api': {
        target: process.env.VOICEBOX_URL || 'http://127.0.0.1:17493',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/voicebox-api/, '')
      }
    }
  },
  build: {
    target: 'esnext'
  },
  optimizeDeps: {
    exclude: ['onnxruntime-web']
  }
});
