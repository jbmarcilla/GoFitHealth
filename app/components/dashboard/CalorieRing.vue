<script setup lang="ts">
const props = defineProps<{
  consumed: number
  goal: number | null
  burned: number
}>()

const R = 46
const C = 2 * Math.PI * R

const pct = computed(() => (props.goal ? Math.min(100, (props.consumed / props.goal) * 100) : 0))
const dash = computed(() => (pct.value / 100) * C)

const remaining = computed(() => (props.goal ? props.goal - props.consumed + props.burned : 0))
const isOver = computed(() => props.goal !== null && remaining.value < 0)
const net = computed(() => props.consumed - props.burned)

const ringColor = computed(() => {
  if (!props.goal) return '#d1d5db'
  if (pct.value > 110) return '#ef4444'
  if (pct.value > 100) return '#f59e0b'
  return '#10b981'
})

const fmt = (n: number) => Math.abs(n).toLocaleString('es-PE')
</script>

<template>
  <div>
    <!-- With goal: ring + breakdown like MyFitnessPal -->
    <template v-if="goal">
      <p class="mb-3 text-center text-[10px] font-medium uppercase tracking-wider text-gray-400">
        Restante = Meta − Comida + Ejercicio
      </p>
      <div class="flex items-center gap-5">
        <!-- Ring -->
        <div class="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 120 120" class="h-full w-full -rotate-90">
            <circle cx="60" cy="60" :r="R" fill="none" stroke="#f3f4f6" stroke-width="10" />
            <circle
              cx="60" cy="60" :r="R"
              fill="none"
              :stroke="ringColor"
              stroke-width="10"
              stroke-linecap="round"
              :stroke-dasharray="`${dash} ${C}`"
              class="transition-all duration-700"
            />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <p class="text-2xl font-bold tabular-nums" :class="isOver ? 'text-red-600' : 'text-gray-900'">
              {{ fmt(remaining) }}
            </p>
            <p class="text-[11px]" :class="isOver ? 'text-red-400' : 'text-gray-400'">
              {{ isOver ? 'Exceso' : 'Restante' }}
            </p>
          </div>
        </div>

        <!-- Breakdown -->
        <div class="flex-1 space-y-2.5 text-sm">
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-1.5 text-gray-500">🎯 Meta</span>
            <span class="font-semibold tabular-nums text-gray-900">{{ fmt(goal) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-1.5 text-gray-500">🍴 Comida</span>
            <span class="font-semibold tabular-nums text-gray-900">−{{ fmt(consumed) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-1.5 text-gray-500">🔥 Ejercicio</span>
            <span class="font-semibold tabular-nums" :class="burned > 0 ? 'text-emerald-600' : 'text-gray-400'">
              +{{ fmt(burned) }}
            </span>
          </div>
          <div class="border-t border-gray-100 pt-2">
            <div class="flex items-center justify-between">
              <span class="font-medium text-gray-700">= {{ isOver ? 'Exceso' : 'Restante' }}</span>
              <span class="font-bold tabular-nums" :class="isOver ? 'text-red-600' : 'text-emerald-600'">
                {{ isOver ? '−' : '' }}{{ fmt(remaining) }} kcal
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Deficit / surplus indicator -->
      <div class="mt-4 flex items-center justify-center gap-2 text-sm">
        <template v-if="remaining > 0">
          <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
            <span class="text-base">✅</span>
            <span class="font-medium">En déficit — te quedan {{ fmt(remaining) }} kcal</span>
          </span>
        </template>
        <template v-else-if="isOver">
          <span class="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-red-700">
            <span class="text-base">⚠️</span>
            <span class="font-medium">Exceso de {{ fmt(remaining) }} kcal</span>
          </span>
        </template>
        <template v-else>
          <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
            <span class="text-base">🎯</span>
            <span class="font-medium">Justo en la meta</span>
          </span>
        </template>
      </div>
    </template>

    <!-- Without goal: simple display -->
    <template v-else>
      <div class="flex flex-col items-center py-4">
        <p class="text-4xl font-bold tabular-nums text-gray-900">{{ fmt(consumed) }}</p>
        <p class="text-sm text-gray-400">kcal consumidas</p>
        <div v-if="burned > 0" class="mt-4 flex items-center gap-5 text-sm">
          <span class="flex items-center gap-1.5 font-medium text-orange-500">
            <span class="text-lg">🔥</span> {{ fmt(burned) }} quemadas
          </span>
          <span class="font-medium text-gray-600">
            {{ fmt(net) }} netas
          </span>
        </div>
        <p class="mt-3 text-xs text-gray-400">
          Define tu meta de calorías en Ajustes para ver tu balance
        </p>
      </div>
    </template>
  </div>
</template>
