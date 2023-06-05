<script setup lang="ts">

import Diagnostic from './Diagnostic.ce.vue'

defineProps<{
  diagnostics?: any[]
  base: string
}>()
</script>

<template>
  <ul>
    <Diagnostic v-for="d in diagnostics" :diagnostic="d" :base="base" />
  </ul>
</template>

<style>
ul {
  list-style: none;
}

ul {
  padding-inline: 0;
  margin-block: 0;
}
</style>
