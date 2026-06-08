import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/yf': {
        changeOrigin: true,
        router: (req) => {
          const qs = req.url?.split('?')[1] ?? '';
          const params = new URLSearchParams(qs);
          return params.get('_host') === '2'
            ? 'https://query2.finance.yahoo.com'
            : 'https://query1.finance.yahoo.com';
        },
        rewrite: (path) => {
          const [, qs] = path.split('?');
          const params = new URLSearchParams(qs);
          const yfPath = params.get('_path') ?? '';
          params.delete('_host');
          params.delete('_path');
          const remaining = params.toString();
          return yfPath + (remaining ? '?' + remaining : '');
        },
      },
    },
  },
});
