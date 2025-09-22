<script setup lang="ts">
import {computed, ref} from "vue";
import Diagnostic from "./Diagnostic.ce.vue";
import {useVirtualizer} from "@tanstack/vue-virtual";

const parentRef = ref<HTMLElement | null>(null)

const props = withDefaults(
    defineProps<{
      ulStyle?: string
      base: string
      checkerResults: any[]
    }>(),
    {
      ulStyle: '',
    }
)

const diagnostics = computed(() => props.checkerResults.flatMap(item => item.diagnostics))

const rowVirtualizer = useVirtualizer({
  count: diagnostics.value.length,
  getScrollElement: () => parentRef.value,
  estimateSize: () => 220,
  overscan: 5,
})

const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems())

const totalSize = computed(() => rowVirtualizer.value.getTotalSize())

</script>

<template>
  <div ref="parentRef" class="parent-container">
    <ul :style="`height: ${totalSize}px; width: 100%; position: relative; ${ulStyle}`">
      <li
          v-for="virtualRow in virtualRows"
          :key="virtualRow.index"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
          }"
      >
        <Diagnostic :diagnostic="diagnostics[virtualRow.index]" :base="base"/>
      </li>
    </ul>
  </div>
</template>

<style>
ul,
li {
  list-style: none;
}

ul {
  padding-inline: 0;
  margin-block: 0;
}

.parent-container {
  height: 100%;
  overflow: auto;
}
</style>
