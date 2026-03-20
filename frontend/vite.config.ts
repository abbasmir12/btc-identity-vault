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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'stacks-vendor': ['@stacks/connect', '@stacks/transactions', '@stacks/network'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          // Heavy libraries
          'qr-vendor': ['html5-qrcode', 'qrcode.react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})

