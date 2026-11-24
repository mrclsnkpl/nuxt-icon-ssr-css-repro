# @nuxt/icon: SSR icon CSS lands in the wrong page during prerender

Minimal reproduction for [nuxt/icon#587](https://github.com/nuxt/icon/issues/587).

In CSS mode every prerendered page should carry exactly one `<style>@layer base {…}</style>` block with the rules of
the icons it renders. With concurrent prerendering, some pages get **no** block and others get **two or more**, the
extra ones holding another page's icons.

## Setup

- `nuxt` 4.4.2, `vue` 3.5.32, `@nuxt/ui` 4.6.1, `@nuxt/icon` 2.2.1 (also tested with 2.6.3)
- `icon`: `provider: 'none'`, `serverBundle: false`, `cssLayer: 'base'`, `clientBundle.scan` + explicit `icons`
- `nitro.prerender.crawlLinks: true`, 600 routes `/p/1/` … `/p/600/` linked from `/`
- Nuxt's default prerender concurrency (`cpus * 4`)
- Every page renders a different set of icons (page, layout, nested components)
- Pages and nested components have async `setup()`:
  - `await useAsyncData(...)` / `await sharedData()`: one promise shared by every request that asks within 2 ms, like
    a shared data cache or a deduplicated fetch, so the renders of many routes resume in the same microtask flush;
  - then `await ticks(n)`: cache-hit style awaits that resume a varying number of microtask ticks later;
  - some instances stay synchronous.

## Steps

```sh
pnpm install
pnpm generate
pnpm count            # node scripts/count.mjs .output/public  (add --list for the affected pages)
```

Then the same with the one-line fix applied to the installed package:

```sh
pnpm patch:apply      # adds `head: nuxt.ssrContext?.head` to the useHead call in dist/runtime/components/css.js
pnpm generate && pnpm count
pnpm patch:revert
```

For 2.6.3: `pnpm add @nuxt/icon@2.6.3`, then the same steps (the patch script handles both versions).

Control: `REPRO_CONCURRENCY=1 pnpm generate && pnpm count` (one route at a time) is clean.

## Results (macOS, Node 22, 12 cores → concurrency 48; 601 pages each)

| @nuxt/icon | fix | no block | 2+ blocks | pages with foreign rules (rules) |
| --- | --- | --- | --- | --- |
| 2.2.1 | no | 36 / 41 / 43 | 16 / 17 / 17 | 16 / 17 / 19 (330 / 353 / 416) |
| 2.2.1 | yes | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| 2.6.3 | no | 56 / 48 / 52 | 23 / 21 / 23 | 24 / 21 / 23 (522 / 455 / 505) |
| 2.6.3 | yes | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| 2.2.1, concurrency 1 | no | 0 | 0 | 0 |

Which pages are affected changes from build to build.

## Why

`NuxtIconCss` registers its SSR head entry in `onServerPrefetch` after `await loadIcon(...)`. `useHead` resolves the
head through `useNuxtApp()`, and `tryUseNuxtApp` prefers `getCurrentInstance()?.appContext.app.$nuxt`. After the
`await`, the current instance can belong to another request: a component whose async `setup()` was just resumed
(`withAsyncContext` restore) and is not unset until its setup promise settles a tick later. The entry then goes into
that other request's head. The page itself never registers again, because its `Map` already exists.

A probe at that line (not included) counted the current instance over one build: 551 × none and 42 × a component of a
different request's app (40 pages without a block in that build). Without the
varying-depth awaits (`ticks`) the probe saw only `none` and every page was correct, which is probably why a setup with
a single async step per page does not reproduce it.

Fix: pass the component's own head explicitly, `useHead({...}, { tagPriority: 'low', head: nuxt.ssrContext?.head })`,
where `nuxt` is the `useNuxtApp()` captured synchronously in `setup()`.
