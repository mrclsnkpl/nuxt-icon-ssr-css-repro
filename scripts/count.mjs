// Counts the SSR icon CSS blocks of every prerendered page and compares their rules with the icons the page renders.
// Usage: node scripts/count.mjs [.output/public] [--list]
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.output/public'
const list = process.argv.includes('--list')

const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (name === 'index.html') files.push(p)
  }
}
walk(root)

const unescape = (s) => s.replace(/\\(.)/g, '$1')
const totals = { pages: 0, withIcons: 0, noBlock: 0, twoOrMore: 0, foreignPages: 0, foreignRules: 0, missingPages: 0 }
const bad = []

for (const file of files) {
  const html = readFileSync(file, 'utf8')
  const icons = new Set([...html.matchAll(/class="iconify (i-[^\s"]+)/g)].map((m) => m[1]))
  const blocks = [...html.matchAll(/<style[^>]*>(@layer base \{:where\(\.i-[\s\S]*?)<\/style>/g)].map((m) => m[1])
  const rules = new Set(blocks.flatMap((b) => [...b.matchAll(/:where\(\.((?:\\.|[^)\\])+)\)/g)].map((m) => unescape(m[1]))))
  totals.pages++
  if (!icons.size) continue
  totals.withIcons++
  const foreign = [...rules].filter((r) => !icons.has(r))
  const missing = [...icons].filter((i) => !rules.has(i))
  if (blocks.length === 0) totals.noBlock++
  if (blocks.length >= 2) totals.twoOrMore++
  if (foreign.length) { totals.foreignPages++; totals.foreignRules += foreign.length }
  if (missing.length) totals.missingPages++
  if (blocks.length !== 1 || foreign.length || missing.length)
    bad.push(`${relative(root, file)}: blocks=${blocks.length} icons=${icons.size} missing=${missing.length} foreign=${foreign.length}`)
}

const pct = (n) => `${((100 * n) / (totals.withIcons || 1)).toFixed(1)} %`
console.log(`pages: ${totals.pages}, with icons: ${totals.withIcons}`)
console.log(`no icon block:        ${totals.noBlock} (${pct(totals.noBlock)})`)
console.log(`two or more blocks:   ${totals.twoOrMore} (${pct(totals.twoOrMore)})`)
console.log(`pages with foreign rules: ${totals.foreignPages} (${pct(totals.foreignPages)}), foreign rules: ${totals.foreignRules}`)
console.log(`pages missing a rule: ${totals.missingPages} (${pct(totals.missingPages)})`)
if (list) console.log(bad.join('\n'))
process.exitCode = bad.length ? 1 : 0
