import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api/stacks': {
        target: 'https://api.testnet.hiro.so',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stacks/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'stacks-vendor': ['@stacks/connect', '@stacks/transactions', '@stacks/network'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'qr-vendor': ['html5-qrcode', 'qrcode.react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})

