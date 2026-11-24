// Applies or reverts the one-line fix in the installed @nuxt/icon (dist/runtime/components/css.js):
// pass the head of this request's app to useHead, so the entry no longer depends on getCurrentInstance().
import { readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const file = join(realpathSync('node_modules/@nuxt/icon'), 'dist/runtime/components/css.js')
const mode = process.argv[2]
let src = readFileSync(file, 'utf8')
const fixed = /tagPriority: "low",\s*head: nuxt\.ssrContext\?\.head/
if (mode === 'apply') {
  if (fixed.test(src)) console.log('already applied')
  else {
    const next = src.replace(/tagPriority: "low"(\s*\})/, 'tagPriority: "low",\n                head: nuxt.ssrContext?.head$1')
    if (next === src) throw new Error(`pattern not found in ${file}`)
    writeFileSync(file, next)
    console.log('applied')
  }
} else if (mode === 'revert') {
  writeFileSync(file, src.replace(/tagPriority: "low",\s*head: nuxt\.ssrContext\?\.head/, 'tagPriority: "low"'))
  console.log('reverted')
} else throw new Error('usage: node scripts/toggle-patch.mjs apply|revert')
