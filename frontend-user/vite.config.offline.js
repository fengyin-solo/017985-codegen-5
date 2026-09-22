import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// 离线单文件分发构建：
// - 所有 JS/CSS 内联进唯一一个 index.html，双击 file:// 即可打开，无需联网
// - base 使用相对路径，拷贝到任意目录/U 盘均可使用
// - 不拷贝 public 目录（测试音频不打进离线产物）
// - preview 端口与本地开发、容器保持一致：8081
export default defineConfig({
  base: './',
  plugins: [
    viteSingleFile({
      useRecommendedBuildConfig: true,
      removeViteModuleLoader: true
    })
  ],
  preview: {
    host: '0.0.0.0',
    port: 8081
  },
  build: {
    outDir: 'dist-offline',
    assetsDir: 'assets',
    copyPublicDir: false,
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    sourcemap: false
  }
})
