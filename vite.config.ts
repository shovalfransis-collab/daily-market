import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
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
      {
        name: 'chat-proxy',
        configureServer(server) {
          server.middlewares.use('/api/chat', async (req: IncomingMessage, res: ServerResponse) => {
            if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }
            try {
              const chunks: Buffer[] = [];
              for await (const chunk of req) chunks.push(Buffer.from(chunk));
              const body = JSON.parse(Buffer.concat(chunks).toString());

              const apiKey = env.ANTHROPIC_API_KEY ?? '';
              if (!apiKey || apiKey === 'your_api_key_here') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ content: [{ text: 'AI Assistant not configured. Add ANTHROPIC_API_KEY to your .env file.' }] }));
                return;
              }

              const upstream = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': apiKey,
                  'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                  model: 'claude-haiku-4-5-20251001',
                  max_tokens: 1024,
                  system: body.system,
                  messages: body.messages,
                }),
              });

              const data = await upstream.json();
              res.writeHead(upstream.status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              res.end(JSON.stringify(data));
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
  };
});
