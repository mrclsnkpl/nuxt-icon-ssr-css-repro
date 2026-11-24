<script setup lang="ts">
const N = useRuntimeConfig().public.pages as number
</script>
<template>
  <ul>
    <li v-for="i in N" :key="i"><NuxtLink :to="`/p/${i}/`">Page {{ i }}</NuxtLink></li>
  </ul>
</template>
