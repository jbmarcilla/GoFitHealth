<script setup lang="ts">
const props = withDefaults(defineProps<{
  totalMl: number
  goalMl?: number
}>(), { goalMl: 2000 })

const percentage = computed(() => Math.min((props.totalMl / props.goalMl) * 100, 100))
const glasses = computed(() => Math.floor(props.totalMl / 250))
const goalGlasses = computed(() => Math.ceil(props.goalMl / 250))
</script>

<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xs font-medium uppercase tracking-wider text-gray-400">💧 Agua</h3>
      <span class="text-sm text-gray-500">{{ totalMl }} / {{ goalMl }} ml</span>
    </div>

    <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        class="h-full rounded-full bg-sky-500 transition-all duration-500 ease-out"
        :style="{ width: `${percentage}%` }"
      />
    </div>

    <div class="mt-3 flex items-center gap-1.5 flex-wrap">
      <span
        v-for="i in goalGlasses"
        :key="i"
        class="h-2.5 w-2.5 rounded-full transition-colors"
        :class="i <= glasses ? 'bg-sky-500' : 'bg-gray-200'"
        :title="`Vaso ${i}`"
      />
      <span class="ml-1 text-xs text-gray-400">{{ glasses }} de {{ goalGlasses }} vasos</span>
    </div>

    <p v-if="percentage >= 100" class="mt-2 text-sm font-medium text-sky-600">¡Meta cumplida! 🎉</p>
  </div>
</template>
