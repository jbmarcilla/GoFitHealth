<script setup lang="ts">
import { formatNumber } from '~/utils/format'

interface WeekTotals {
  avg_calories_in: number
  avg_water_ml: number
  weight_change: number | null
}

defineProps<{
  current: WeekTotals | null
  previous: WeekTotals | null
}>()

function trendClass(curr: number, prev: number, lowerIsBetter = false) {
  if (curr === prev) return 'text-gray-500'
  const better = lowerIsBetter ? curr < prev : curr > prev
  return better ? 'text-green-600' : 'text-red-600'
}

function trendArrow(curr: number, prev: number) {
  if (curr > prev) return '↑'
  if (curr < prev) return '↓'
  return '='
}
</script>

<template>
  <div class="card">
    <h3 class="font-semibold text-gray-900 mb-4">📊 Esta semana vs. anterior</h3>

    <div v-if="current && previous" class="grid grid-cols-3 gap-4">
      <div class="text-center">
        <p class="text-xs text-gray-400 uppercase tracking-wider mb-2">Calorías/día</p>
        <p class="text-lg font-bold text-gray-900">{{ formatNumber(current.avg_calories_in) }}</p>
        <p
          class="text-xs font-medium mt-1"
          :class="trendClass(current.avg_calories_in, previous.avg_calories_in)"
        >
          {{ trendArrow(current.avg_calories_in, previous.avg_calories_in) }}
          {{ formatNumber(Math.abs(current.avg_calories_in - previous.avg_calories_in)) }}
        </p>
      </div>

      <div class="text-center">
        <p class="text-xs text-gray-400 uppercase tracking-wider mb-2">Agua/día</p>
        <p class="text-lg font-bold text-gray-900">{{ formatNumber(current.avg_water_ml) }} ml</p>
        <p
          class="text-xs font-medium mt-1"
          :class="trendClass(current.avg_water_ml, previous.avg_water_ml)"
        >
          {{ trendArrow(current.avg_water_ml, previous.avg_water_ml) }}
          {{ formatNumber(Math.abs(current.avg_water_ml - previous.avg_water_ml)) }} ml
        </p>
      </div>

      <div class="text-center">
        <p class="text-xs text-gray-400 uppercase tracking-wider mb-2">Cambio peso</p>
        <p class="text-lg font-bold text-gray-900">
          <template v-if="current.weight_change !== null">
            {{ current.weight_change > 0 ? '+' : '' }}{{ current.weight_change.toFixed(1) }} kg
          </template>
          <template v-else>—</template>
        </p>
        <p v-if="previous?.weight_change !== null" class="text-xs text-gray-400 mt-1">
          Anterior: {{ previous!.weight_change! > 0 ? '+' : '' }}{{ previous!.weight_change!.toFixed(1) }} kg
        </p>
      </div>
    </div>

    <p v-else class="text-sm text-gray-400 text-center py-8">
      Necesitas al menos dos semanas de datos para comparar.
    </p>
  </div>
</template>
