<script setup lang="ts">
const props = defineProps<{
  protein: number
  carbs: number
  fat: number
  fiber: number
  proteinGoal?: number | null
  carbsGoal?: number | null
  fatGoal?: number | null
}>()

const macros = computed(() => {
  const kcal = { p: props.protein * 4, c: props.carbs * 4, f: props.fat * 9 }
  const total = kcal.p + kcal.c + kcal.f || 1
  return [
    { key: 'p', label: 'Proteínas', grams: props.protein, pct: Math.round((kcal.p / total) * 100), goal: props.proteinGoal ?? null, color: 'bg-emerald-500', track: 'bg-emerald-100' },
    { key: 'c', label: 'Carbos', grams: props.carbs, pct: Math.round((kcal.c / total) * 100), goal: props.carbsGoal ?? null, color: 'bg-amber-400', track: 'bg-amber-100' },
    { key: 'f', label: 'Grasas', grams: props.fat, pct: Math.round((kcal.f / total) * 100), goal: props.fatGoal ?? null, color: 'bg-rose-400', track: 'bg-rose-100' },
  ]
})

function progress(current: number, goal: number | null) {
  if (!goal) return 0
  return Math.min(100, Math.round((current / goal) * 100))
}
</script>

<template>
  <div class="grid grid-cols-3 gap-4">
    <div v-for="m in macros" :key="m.key" class="text-center">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{{ m.label }}</p>
      <p class="mt-1 text-lg font-bold tabular-nums text-gray-900">
        {{ m.grams }}<span v-if="m.goal" class="text-sm font-normal text-gray-400"> / {{ m.goal }}</span><span class="ml-0.5 text-xs font-normal text-gray-400">g</span>
      </p>
      <div v-if="m.goal" class="mx-auto mt-1.5 h-1.5 w-full max-w-[80px] overflow-hidden rounded-full" :class="m.track">
        <div class="h-full rounded-full transition-all duration-500" :class="m.color" :style="{ width: `${progress(m.grams, m.goal)}%` }" />
      </div>
      <p class="mt-1 text-[11px] tabular-nums text-gray-400">{{ m.pct }}%</p>
    </div>
  </div>
</template>
