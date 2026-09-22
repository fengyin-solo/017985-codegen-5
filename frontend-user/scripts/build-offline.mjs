#!/usr/bin/env node
/**
 * 离线单文件版本构建脚本
 *
 * 产出：dist-offline/index.html —— 唯一一个自包含 HTML，
 * 所有 JS/CSS 已内联，可直接双击打开（file://），运行时无需联网、无需安装任何依赖。
 *
 * 构建失败时会打印明确原因并以非零状态退出。
 */
import { build } from 'vite'
import { readFileSync, readdirSync, rmSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const outDir = join(projectRoot, 'dist-offline')

function fail(reason, detail) {
  console.error('\n❌ 离线版本构建失败：' + reason)
  if (detail) console.error('   原因: ' + detail)
  console.error('   请修复后重新执行 npm run build:offline\n')
  process.exit(1)
}

async function run() {
  // 0. 清理旧产物，避免残留文件混入
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true })

  // 1. 执行 Vite 构建（使用离线专用配置）
  console.log('▶ 开始构建离线单文件版本…')
  try {
    await build({ configFile: join(projectRoot, 'vite.config.offline.js'), logLevel: 'info' })
  } catch (err) {
    fail('Vite 构建出错。', err?.message || String(err))
  }

  // 2. 校验产物目录
  if (!existsSync(outDir)) {
    fail('未找到构建输出目录 dist-offline/，构建可能被中断。')
  }

  const entries = readdirSync(outDir, { recursive: true }).map(String)
  if (entries.length === 0) fail('构建输出目录 dist-offline/ 为空。')

  // 3. 必须且只能有一个文件：index.html
  const expected = ['index.html']
  const unexpected = entries.filter((e) => !expected.includes(e))
  const missing = expected.filter((e) => !entries.includes(e))
  if (missing.length) fail(`产物缺少必需文件: ${missing.join(', ')}。`)
  if (unexpected.length) {
    fail(
      '产物中存在多余文件（离线版本必须是单文件，不能带构建缓存或其它静态资源）。',
      `多余文件: ${unexpected.join(', ')}`
    )
  }

  // 4. 校验 HTML 内容：不得引用任何外部资源
  const html = readFileSync(join(outDir, 'index.html'), 'utf8')

  const externalRefs = []
  for (const re of [
    /<script[^>]*\bsrc\s*=\s*["']https?:\/\//gi,
    /<link[^>]*\bhref\s*=\s*["']https?:\/\//gi,
    /<script[^>]*\bsrc\s*=\s*["'](?!data:|#)[^"']+["']/gi,
    /<link[^>]*\bhref\s*=\s*["'](?!data:)[^"']+["']/gi,
    /url\(\s*["']?https?:\/\//gi,
    /@import\s+["']?https?:\/\//gi
  ]) {
    const m = html.match(re)
    if (m) externalRefs.push(...m)
  }
  if (externalRefs.length) {
    fail(
      '产物中存在外部资源引用，离线环境下无法加载。',
      [...new Set(externalRefs)].slice(0, 5).join(' | ')
    )
  }

  // 5. 内联完整性检查：JS 与 CSS 都应已内联
  const hasInlinedJs = /<script[^>]*>[\s\S]+?<\/script>/.test(html)
  if (!hasInlinedJs) fail('产物中没有内联的 JavaScript，应用无法运行。')
  const usesCss = existsSync(join(projectRoot, 'src', 'styles'))
  const hasInlinedCss = /<style[^>]*>[\s\S]+?<\/style>/.test(html)
  if (usesCss && !hasInlinedCss) fail('样式没有被内联进 HTML。')

  const sizeKb = Buffer.byteLength(html, 'utf8') / 1024
  console.log(`\n✅ 离线版本构建成功: dist-offline/index.html (${sizeKb.toFixed(1)} KB)`)
  console.log('   双击该文件即可在浏览器中打开使用，无需联网。')
}

run().catch((err) => fail('构建脚本发生未预期错误。', err?.stack || String(err)))
