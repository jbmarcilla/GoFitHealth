<script setup lang="ts">
import { DENSITY_CONFIG } from '~/utils/caloric-density'

const props = defineProps<{
  density: 'green' | 'yellow' | 'red'
}>()

const config = computed(() => DENSITY_CONFIG[props.density])
</script>

<template>
  <span
    class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border"
    :class="config.bgClass"
  >
    <span
      class="w-1.5 h-1.5 rounded-full"
      :style="{ backgroundColor: config.color }"
    />
    {{ config.label }}
  </span>
</template>
