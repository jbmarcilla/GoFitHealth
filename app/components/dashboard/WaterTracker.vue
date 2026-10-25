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
      <h3 class="font-semibold text-gray-900">💧 Agua</h3>
      <span class="text-sm text-gray-500">{{ totalMl }} / {{ goalMl }} ml</span>
    </div>

    <div class="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-500 ease-out"
        :class="percentage >= 100 ? 'bg-blue-500' : 'bg-blue-400'"
        :style="{ width: `${percentage}%` }"
      />
    </div>

    <div class="mt-3 flex items-center gap-1 flex-wrap">
      <span
        v-for="i in goalGlasses"
        :key="i"
        class="text-lg"
        :class="i <= glasses ? 'opacity-100' : 'opacity-20'"
      >
        🥤
      </span>
    </div>

    <p
      v-if="percentage >= 100"
      class="mt-2 text-sm text-blue-600 font-medium"
    >
      ¡Meta cumplida! 🎉
    </p>
  </div>
</template>
