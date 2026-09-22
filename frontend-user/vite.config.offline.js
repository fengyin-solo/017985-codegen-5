import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// 离线单文件分发版本构建配置
// 产出 dist-offline/index.html：所有 JS/CSS 内联，双击即可在浏览器打开，无需联网、无需服务器
export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    outDir: 'dist-offline',
    // 单文件版本：所有资源内联进 index.html，不单独产出 assets 目录
    assetsInlineLimit: 100 * 1024 * 1024,
    chunkSizeWarningLimit: 100 * 1024 * 1024,
    reportCompressedSize: false
  }
})
