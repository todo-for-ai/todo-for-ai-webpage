#!/usr/bin/env node
/**
 * 架构治理审计（软件工程管理蓝图的自动化门禁，见主仓 docs/ENGINEERING_AT_SCALE.md）。
 *
 * FAIL（exit 1）：单文件 > --max-hard 行；分层边界违规（api→pages、components→pages、hooks→pages）
 * BASELINE：已登记在 arch_debt_baseline.txt 的存量债务（棘轮只减不增）
 * WARN：500~800 行；单目录文件 > 30 个；单目录 LOC > 20000
 *
 * 用法：node scripts/arch-audit.mjs [--max-warn 500] [--max-hard 800] [--update-baseline]
 */
import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const args = process.argv.slice(2)
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : dflt
}
const flag = name => args.includes(`--${name}`)
const MAX_WARN = Number(opt('max-warn', 500))
const MAX_HARD = Number(opt('max-hard', 800))
const BASELINE_FILE = 'arch_debt_baseline.txt'

const SRC = join(process.cwd(), 'src')
const SKIP = dir => ['node_modules', 'dist', '.vite'].includes(dir)

// 分层规则：目录前缀 → 禁止 import 的目录前缀（页面是叶子，谁都不能指向它）
const LAYER_RULES = [
  { layer: 'src/api', banned: ['src/pages', 'src/components', 'src/hooks'] },
  { layer: 'src/hooks', banned: ['src/pages'] },
  { layer: 'src/stores', banned: ['src/pages', 'src/components'] },
  { layer: 'src/components', banned: ['src/pages'] },
]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP(name)) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(name)) out.push(p)
  }
  return out
}

const files = walk(SRC)
const fails = []
const warns = []
const dirStats = new Map()

const importRe = /from\s+['"](\.[^'"]+|@\/[^'"]+)['"]/g
function resolveImport(fromFile, spec) {
  const base = spec.startsWith('@/')
    ? join(SRC, spec.slice(2))
    : join(fromFile, '..')
  const candidates = spec.startsWith('@/')
    ? [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]
    : [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]
  for (const c of candidates) {
    try { if (existsSync(c) && statSync(c).isFile()) return c } catch { /* noop */ }
  }
  return null
}

for (const file of files) {
  const rel = relative(process.cwd(), file).split(sep).join('/')
  const lines = readFileSync(file, 'utf8').split('\n').length
  const dir = rel.split('/').slice(0, -1).join('/')
  const st = dirStats.get(dir) ?? { files: 0, loc: 0 }
  st.files += 1; st.loc += lines
  dirStats.set(dir, st)

  if (lines > MAX_HARD) fails.push(`文件超硬上限 ${lines} 行（>${MAX_HARD}）: ${rel}`)
  else if (lines > MAX_WARN) warns.push(`文件超软上限 ${lines} 行（>${MAX_WARN}）: ${rel}`)

  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(importRe)) {
    const target = resolveImport(file, m[1])
    if (!target) continue
    const targetRel = relative(process.cwd(), target).split(sep).join('/')
    for (const rule of LAYER_RULES) {
      if (rel.startsWith(rule.layer + '/')) {
        const hit = rule.banned.find(b => targetRel.startsWith(b + '/'))
        if (hit) fails.push(`分层违规: ${rule.layer} 不得 import ${hit} — ${rel} → ${targetRel}`)
      }
    }
  }
}

for (const [dir, st] of [...dirStats].sort()) {
  const depth = dir.split('/').length
  if (depth <= 2 && st.files > 30) warns.push(`目录 ${dir}/ 平铺 ${st.files} 个文件——按域拆子目录`)
  if (depth <= 2 && st.loc > 20000) warns.push(`目录 ${dir}/ 达 ${st.loc} 行——评估拆分`)
}

console.log(`扫描 ${files.length} 个文件`)

const baselinePath = join(process.cwd(), BASELINE_FILE)
let baseline = new Set()
if (existsSync(baselinePath)) {
  baseline = new Set(readFileSync(baselinePath, 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')))
}
if (flag('update-baseline')) {
  writeFileSync(baselinePath, fails.sort().join('\n') + (fails.length ? '\n' : ''))
  console.log(`\n基线已重置：${fails.length} 项 FAIL 写入 ${BASELINE_FILE}`)
  process.exit(0)
}

const tracked = [], blocking = []
for (const f of fails) (baseline.has(f) ? tracked : blocking).push(f)
for (const f of tracked) console.log(`BASELINE（存量债务）  ${f}`)
for (const f of blocking) console.log(`FAIL  ${f}`)
for (const w of warns) console.log(`WARN  ${w}`)
const gone = [...baseline].filter(f => !fails.includes(f))
if (gone.length) {
  console.log('NOTE  基线中以下债务已消失，可删除（棘轮只紧不松）：')
  for (const g of gone) console.log(`  GONE  ${g}`)
}
if (blocking.length) {
  console.log(`\n结果：${blocking.length} 项新增 FAIL，${tracked.length} 项存量债务，${warns.length} 项 WARN`)
  process.exit(1)
}
console.log(`\n结果：PASS（存量债务 ${tracked.length} 项，WARN ${warns.length} 项）`)
