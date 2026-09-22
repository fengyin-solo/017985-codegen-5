#!/usr/bin/env node
/**
 * 构建前环境检查：失败时给出明确原因
 */
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const problems = []

// 1. Node 版本检查（Vite 5 要求 Node >= 18，项目约定 >= 20）
const major = Number(process.versions.node.split('.')[0])
if (major < 20) {
  problems.push(
    `Node.js 版本过低：当前 v${process.versions.node}，要求 >= 20。请升级 Node.js 后重试。`
  )
}

// 2. lockfile 必须存在，否则 npm ci / 可复现构建无从谈起
if (!existsSync(join(root, 'package-lock.json'))) {
  problems.push(
    '缺少 package-lock.json：无法固定依赖版本。请先执行 npm install 生成锁文件后再构建。'
  )
}

// 3. 依赖必须已安装
if (!existsSync(join(root, 'node_modules'))) {
  problems.push(
    '依赖未安装：缺少 node_modules 目录。请先执行 npm ci（不要直接 npm install，以保证版本与锁文件一致）。'
  )
}

if (problems.length > 0) {
  console.error('\n❌ 构建前检查失败：\n')
  problems.forEach((p, i) => console.error(`  ${i + 1}. ${p}`))
  console.error('')
  process.exit(1)
}

console.log(`✓ 环境检查通过（Node v${process.versions.node}）`)
