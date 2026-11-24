<script setup lang="ts">
const route = useRoute()
const pool = useAppConfig().iconPool as string[]
const id = computed(() => Number(route.params.id ?? 0))
</script>
<template>
  <div>
    <header><UIcon :name="pickIcons(pool, id + 100000, 1)[0]!" /> Header</header>
    <slot />
  </div>
</template>
