#!/usr/bin/env node
/**
 * 离线单文件构建产物校验：
 * 确保 dist-offline/index.html 完全自包含（无外链 JS/CSS），可离线直接打开。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'dist-offline')
const htmlPath = join(outDir, 'index.html')
const problems = []

if (!existsSync(htmlPath)) {
  console.error(`\n❌ 离线构建校验失败：未找到产物 ${htmlPath}`)
  console.error('   可能原因：vite 构建未成功输出，请检查上方的构建日志。\n')
  process.exit(1)
}

const html = readFileSync(htmlPath, 'utf8')

// 不允许存在外链脚本/样式（data: 与内联除外）
const externalScript = html.match(/<script[^>]+src=["'](?!data:)[^"']+["'][^>]*>/i)
if (externalScript) {
  problems.push(`index.html 仍引用外部脚本：${externalScript[0]}，单文件内联未生效。`)
}
const externalCss = html.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/i)
if (externalCss) {
  problems.push(`index.html 仍引用外部样式：${externalCss[0]}，单文件内联未生效。`)
}

// 必须包含内联脚本，且体积合理（Chart.js 内联后应 > 100KB）
if (!/<script[^>]*type=["']module["'][^>]*>/.test(html) && !/<script>/.test(html)) {
  problems.push('index.html 中未找到内联脚本，应用代码可能未被打包进去。')
}
const size = statSync(htmlPath).size
if (size < 100 * 1024) {
  problems.push(`index.html 体积异常（${(size / 1024).toFixed(1)} KB），依赖可能未完整内联。`)
}

// 产物目录中不允许残留构建缓存或依赖目录
const stray = readdirSync(outDir).filter(
  (name) => name === 'node_modules' || name === '.vite' || name === 'package.json'
)
if (stray.length > 0) {
  problems.push(`产物目录混入构建缓存/依赖文件：${stray.join(', ')}`)
}

if (problems.length > 0) {
  console.error('\n❌ 离线构建校验失败：\n')
  problems.forEach((p, i) => console.error(`  ${i + 1}. ${p}`))
  console.error('')
  process.exit(1)
}

console.log(`✓ 离线单文件校验通过：dist-offline/index.html（${(size / 1024).toFixed(1)} KB，完全自包含）`)
