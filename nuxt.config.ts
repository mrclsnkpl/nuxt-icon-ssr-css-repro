import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

// Every page renders its own icons, so all of them must be in the client bundle (provider 'none').
const require = createRequire(import.meta.url)
const names = (pkg: string, prefix: string, count: number) =>
  Object.keys(JSON.parse(readFileSync(require.resolve(`${pkg}/icons.json`), 'utf8')).icons)
    .slice(0, count)
    .map((n) => `${prefix}:${n}`)
export const ICONS = [...names('@iconify-json/carbon', 'carbon', 150), ...names('@iconify-json/material-symbols', 'material-symbols', 150)]

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  modules: ['@nuxt/ui'],
  css: ['~/assets/main.css'],
  devtools: { enabled: false },
  appConfig: { iconPool: ICONS },
  runtimeConfig: { public: { pages: Number(process.env.REPRO_PAGES ?? 600) } },
  icon: {
    provider: 'none',
    serverBundle: false,
    cssLayer: 'base',
    collections: ['carbon', 'material-symbols'],
    clientBundle: { scan: true, icons: ICONS },
  },
  // Nuxt's default prerender concurrency is cpus * 4; REPRO_CONCURRENCY=1 renders one route at a time (control run).
  nitro: { prerender: { crawlLinks: true, routes: ['/'], concurrency: Number(process.env.REPRO_CONCURRENCY) || undefined } },
})
