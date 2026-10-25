<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  trend?: number
}>()
</script>

<template>
  <div class="stat-card">
    <div class="flex items-center justify-between">
      <span v-if="icon" class="text-2xl">{{ icon }}</span>
      <span
        v-if="trend !== undefined && trend !== 0"
        class="text-xs font-medium px-2 py-0.5 rounded-full"
        :class="trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
      >
        {{ trend > 0 ? '↑' : '↓' }} {{ Math.abs(trend).toFixed(1) }}
      </span>
    </div>
    <p class="text-3xl font-bold text-gray-900 mt-2">{{ value }}</p>
    <p class="text-sm font-medium text-gray-500">{{ title }}</p>
    <p v-if="subtitle" class="text-xs text-gray-400 mt-1">{{ subtitle }}</p>
  </div>
</template>
