<script setup lang="ts">
const route = useRoute()
const pool = useAppConfig().iconPool as string[]
const id = Number(route.params.id ?? 0)
await wait(id % 5)
</script>
<template>
  <div>
    <aside><UIcon v-for="n in pickIcons(pool, id + 200000, 2)" :key="n" :name="n" /></aside>
    <slot />
  </div>
</template>
