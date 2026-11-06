import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
const ttsProxy = {
  '/api/tts': {
    target: 'https://dashscope.aliyuncs.com',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api\/tts/, ''),
  },
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: ttsProxy,
  },
  preview: {
    proxy: ttsProxy,
  },
});
