<script setup lang="ts">
const props = defineProps<{
  consumed: number
  goal: number | null
  burned: number
}>()

const R = 52
const C = 2 * Math.PI * R

const pct = computed(() => (props.goal ? Math.min(100, (props.consumed / props.goal) * 100) : 0))
const dash = computed(() => (pct.value / 100) * C)
const color = computed(() => {
  if (!props.goal) return '#10b981'
  if (props.consumed > props.goal * 1.1) return '#ef4444'
  if (props.consumed > props.goal) return '#f59e0b'
  return '#10b981'
})
const net = computed(() => props.consumed - props.burned)
const inZone = computed(() => {
  if (!props.goal) return false
  return props.consumed >= props.goal * 0.9 && props.consumed <= props.goal * 1.1
})

const fmt = (n: number) => n.toLocaleString('es-PE')
</script>

<template>
  <div class="flex flex-col items-center py-2">
    <div class="relative h-44 w-44">
      <svg viewBox="0 0 120 120" class="h-full w-full -rotate-90">
        <circle cx="60" cy="60" :r="R" fill="none" stroke="#f3f4f6" stroke-width="9" />
        <circle
          cx="60" cy="60" :r="R"
          fill="none"
          :stroke="color"
          stroke-width="9"
          stroke-linecap="round"
          :stroke-dasharray="`${dash} ${C}`"
          class="transition-all duration-700 ease-out"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span v-if="inZone" class="mb-0.5 text-emerald-500">
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
        </span>
        <p class="text-3xl font-bold tabular-nums text-gray-900">{{ fmt(consumed) }}</p>
        <p v-if="goal" class="text-sm tabular-nums text-gray-400">/ {{ fmt(goal) }}</p>
        <p class="text-xs text-gray-400">kcal</p>
      </div>
    </div>

    <!-- Calorie range bar -->
    <div v-if="goal" class="mt-4 w-full max-w-xs">
      <div class="relative h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          class="absolute inset-y-0 rounded-full bg-emerald-100"
          :style="{ left: '30%', right: '30%' }"
        />
        <div
          class="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          :class="consumed > goal * 1.1 ? 'bg-red-400' : consumed > goal ? 'bg-amber-400' : 'bg-emerald-500'"
          :style="{ width: `${Math.min(100, (consumed / (goal * 1.4)) * 100)}%` }"
        />
      </div>
      <div class="mt-1 flex justify-between text-[11px] tabular-nums text-gray-400">
        <span>{{ fmt(Math.round(goal * 0.8)) }}</span>
        <span>{{ fmt(Math.round(goal * 1.2)) }}</span>
      </div>
    </div>

    <!-- Burned & net -->
    <div class="mt-3 flex items-center gap-4 text-sm">
      <span v-if="burned > 0" class="flex items-center gap-1 text-orange-500">
        <span class="text-base">🔥</span>
        <span class="font-semibold tabular-nums">{{ fmt(burned) }}</span>
        <span class="text-gray-400">quemadas</span>
      </span>
      <span v-if="burned > 0" class="flex items-center gap-1 text-gray-500">
        <span class="font-semibold tabular-nums">{{ fmt(net) }}</span>
        <span class="text-gray-400">netas</span>
      </span>
    </div>
  </div>
</template>
