#!/usr/bin/env node
/**
 * 将 dist-offline/index.html 打包成可分发的 zip：
 *   release/guqin-audio-analyzer-offline-<version>.zip
 *
 * 零依赖：使用 Node 内置 zlib 手写 ZIP（DEFLATE），打包机无需安装 zip 命令或任何 npm 包。
 * 解压后是一个同名文件夹，内含 index.html 和使用说明，斫琴师双击 index.html 即可使用。
 */
import { deflateRawSync } from 'node:zlib'
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const htmlPath = join(projectRoot, 'dist-offline', 'index.html')
const releaseDir = join(projectRoot, 'release')

function fail(reason, detail) {
  console.error('\n❌ 离线版本打包失败：' + reason)
  if (detail) console.error('   原因: ' + detail)
  process.exit(1)
}

if (!existsSync(htmlPath)) {
  fail('dist-offline/index.html 不存在，请先执行 npm run build:offline。')
}

const { version } = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'))
const folderName = `guqin-audio-analyzer-offline-${version}`

const readme = `古琴音频分析软件 — 离线单文件版 v${version}
==========================================

使用方法
--------
1. 把本文件夹拷贝到任意位置（U 盘也可以），无需联网。
2. 双击 index.html，用浏览器（Chrome 80+ / Edge 80+ / Firefox 75+ / Safari 13+）打开。
3. 上传要分析的音频文件即可使用，所有计算都在本机浏览器内完成。

说明
----
- 本版本为单文件静态包，不安装任何软件、不依赖网络。
- 历史记录保存在浏览器本地（localStorage），清除浏览器数据会一并清除记录。
`

// 文件列表：ZIP 内部路径 -> Buffer
const files = [
  [`${folderName}/index.html`, readFileSync(htmlPath)],
  [`${folderName}/README.txt`, Buffer.from(readme, 'utf8')]
]

// ---------- 最小 ZIP 实现（local file header + central directory, DEFLATE） ----------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const localParts = []
const central = []
let offset = 0

for (const [nameBuf, data] of files.map(([n, b]) => [Buffer.from(n, 'utf8'), b])) {
  const crc = crc32(data)
  // ZIP 需要 raw DEFLATE（无 zlib 头尾）
  const compressed = deflateRawSync(data, { level: 9 })
  const flags = 0x0800 // bit 11: UTF-8 文件名编码

  const local = Buffer.alloc(30)
  local.writeUInt32LE(0x04034b50, 0)
  local.writeUInt16LE(20, 4) // 需要 2.0 版本解压
  local.writeUInt16LE(flags, 6)
  local.writeUInt16LE(8, 8) // DEFLATE
  local.writeUInt16LE(0, 10) // mod time
  local.writeUInt16LE(0x21, 12) // mod date (1980-01-01)
  local.writeUInt32LE(crc, 14)
  local.writeUInt32LE(compressed.length, 18)
  local.writeUInt32LE(data.length, 22)
  local.writeUInt16LE(nameBuf.length, 26)
  local.writeUInt16LE(0, 28)

  localParts.push(local, nameBuf, compressed)

  const cen = Buffer.alloc(46)
  cen.writeUInt32LE(0x02014b50, 0)
  cen.writeUInt16LE(20, 4)
  cen.writeUInt16LE(20, 6)
  cen.writeUInt16LE(flags, 8)
  cen.writeUInt16LE(8, 10)
  cen.writeUInt16LE(0, 12)
  cen.writeUInt16LE(0x21, 14)
  cen.writeUInt32LE(crc, 16)
  cen.writeUInt32LE(compressed.length, 20)
  cen.writeUInt32LE(data.length, 24)
  cen.writeUInt16LE(nameBuf.length, 28)
  cen.writeUInt32LE(offset, 42)
  central.push(Buffer.concat([cen, nameBuf]))

  offset += local.length + nameBuf.length + compressed.length
}

const centralBuf = Buffer.concat(central)
const localBuf = Buffer.concat(localParts)

const end = Buffer.alloc(22)
end.writeUInt32LE(0x06054b50, 0)
end.writeUInt16LE(files.length, 8)
end.writeUInt16LE(files.length, 10)
end.writeUInt32LE(centralBuf.length, 12)
end.writeUInt32LE(localBuf.length, 16)

mkdirSync(releaseDir, { recursive: true })
const zipPath = join(releaseDir, `${folderName}.zip`)
writeFileSync(zipPath, Buffer.concat([localBuf, centralBuf, end]))

const sizeKb = statSync(zipPath).size / 1024
console.log(`✅ 离线分发包已生成: release/${folderName}.zip (${sizeKb.toFixed(1)} KB)`)
