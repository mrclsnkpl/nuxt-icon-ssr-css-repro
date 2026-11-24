<script setup lang="ts">
const props = defineProps<{ seed: number, depth: number }>()
const pool = useAppConfig().iconPool as string[]
// Mixed async setup: a shared data promise (all requests resume together), then cache-hit style awaits that resume a
// varying number of microtask ticks later; some instances stay synchronous.
if (props.seed % 3 !== 0) await sharedData()
if (props.seed % 2) await ticks(props.seed % 7)
if (props.seed % 5 > 1) await ticks((props.seed * 3) % 11)
const icons = pickIcons(pool, props.seed, 3)
</script>
<template>
  <section>
    <UIcon v-for="n in icons" :key="n" :name="n" />
    <AsyncBlock v-if="depth > 0" :seed="seed * 31 + depth" :depth="depth - 1" />
    <AsyncBlock v-if="depth > 1" :seed="seed * 17 + 3" :depth="depth - 2" />
  </section>
</template>
