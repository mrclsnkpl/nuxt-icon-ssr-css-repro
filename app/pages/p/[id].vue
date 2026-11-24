<script setup lang="ts">
const route = useRoute()
const id = Number(route.params.id)
const pool = useAppConfig().iconPool as string[]
definePageMeta({ layout: false })
const layout = id % 2 ? 'default' : 'alt'
const { data: icons } = await useAsyncData(`p-${id}`, async () => {
  await sharedData()
  return pickIcons(pool, id, 4)
})
</script>
<template>
  <NuxtLayout :name="layout">
    <h1>Page {{ id }}</h1>
    <UIcon v-for="n in icons" :key="n" :name="n" />
    <AsyncBlock :seed="id" :depth="2" />
  </NuxtLayout>
</template>
