import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'yf-proxy',
      configureServer(server) {
        server.middlewares.use('/api/yf', async (req: IncomingMessage, res: ServerResponse) => {
          const qs = req.url?.replace(/^\?/, '') ?? '';
          const params = new URLSearchParams(qs);
          const host = params.get('_host') === '2'
            ? 'https://query2.finance.yahoo.com'
            : 'https://query1.finance.yahoo.com';
          const yfPath = params.get('_path') ?? '';
          params.delete('_host');
          params.delete('_path');
          const remaining = params.toString();
          const upstream = `${host}${yfPath}${remaining ? '?' + remaining : ''}`;
          try {
            const r = await fetch(upstream, {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; MarketDaily/1.0)',
              },
            });
            const body = await r.text();
            res.writeHead(r.status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(body);
          } catch (e: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
