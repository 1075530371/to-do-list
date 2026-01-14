import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path' // 引入 path 模块

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 将 @ 指向 src 目录（__dirname 是当前配置文件所在目录）
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    proxy: {
      // 代理 Qwen API 请求（解决跨域）
      '/api/qwen': {
        target: 'https://api.siliconflow.cn', // 直接写死API地址（恢复你之前的运行逻辑）
        changeOrigin: true, // 开启跨域
        rewrite: (path) => path.replace(/^\/api\/qwen/, ''), // 重写路径（去掉前缀）
        headers: {
          'Origin': 'https://api.siliconflow.cn', // 模拟合法 Origin
        },
      },
    },
  },
});