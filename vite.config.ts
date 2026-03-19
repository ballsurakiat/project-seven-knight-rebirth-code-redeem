import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/coupon': {
        target: 'https://coupon.netmarble.com',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // @ts-ignore
  test: {
    environment: 'jsdom',
    globals: true
  }
})
