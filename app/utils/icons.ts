// Deterministic pseudo-random icon set per page and slot: every page renders a different set.
export function pickIcons(pool: string[], seed: number, count: number): string[] {
  let x = (seed * 2654435761) >>> 0
  const out = new Set<string>()
  while (out.size < count) {
    x = (x * 1103515245 + 12345) >>> 0
    out.add(`i-${pool[x % pool.length]!.replace(':', '-')}`)
  }
  return [...out]
}
export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

// One promise shared by every request that asks within the same few milliseconds, like a shared data cache or a
// deduplicated fetch: all waiters resume in the same microtask flush, so renders of different routes interleave.
let pending: Promise<void> | null = null
export function sharedData(): Promise<void> {
  pending ??= new Promise<void>((r) => setTimeout(() => { pending = null; r() }, 2))
  return pending
}

// Resolves after `n` microtask ticks, like a cache hit behind a few async helpers.
export async function ticks(n: number): Promise<void> {
  for (let i = 0; i < n; i++) await Promise.resolve()
}
