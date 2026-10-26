<script setup lang="ts">
import { phraseOfTheDay } from '#shared/constants/phrases'

definePageMeta({ middleware: 'auth' })

const user = useSupabaseUser()
const { todayStatus, weekSummary, lastWeekSummary, progress, refresh } = useDashboard()

const firstName = computed(() => (user.value?.user_metadata?.full_name || user.value?.user_metadata?.name || '').split(' ')[0])
const phrase = phraseOfTheDay()
const todayLabel = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })

const status = computed(() => todayStatus.value as any)
const goal = computed(() => status.value?.goal ?? null)
const missing = computed<string[]>(() => status.value?.missing ?? [])

const weightToday = computed(() => (status.value?.weight?.weight_kg ? Number(status.value.weight.weight_kg) : null))
const lastWeight = computed(() => {
  const w = progress.value?.weights
  return w?.length ? Number(w[w.length - 1].weight_kg) : null
})
const weightShown = computed(() => weightToday.value ?? lastWeight.value)
const targetKg = computed(() => (goal.value?.target_weight_kg ? Number(goal.value.target_weight_kg) : null))
const calorieGoal = computed(() => (goal.value?.daily_calorie_target ? Number(goal.value.daily_calorie_target) : null))
const waterGoal = computed(() => (goal.value?.daily_water_ml ? Number(goal.value.daily_water_ml) : 2000))

const caloriesIn = computed(() => status.value?.calories_in ?? 0)
const caloriesOut = computed(() => status.value?.calories_out ?? 0)
const waterMl = computed(() => status.value?.water_total_ml ?? 0)

const pct = (value: number, target: number | null) => (target ? Math.min(100, Math.round((value / target) * 100)) : 0)
const fmt = (n: number) => n.toLocaleString('es-PE')
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-10">
    <header class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-xs font-medium capitalize tracking-wider text-gray-400">{{ todayLabel }}</p>
        <h1 class="mt-1 text-3xl font-semibold tracking-tight text-gray-900">Hola, {{ firstName || 'ahí' }}</h1>
        <p class="mt-2 text-emerald-700">"{{ phrase }}"</p>
      </div>
      <div v-if="missing.length" class="flex flex-wrap gap-1.5 md:justify-end">
        <span
          v-for="m in missing"
          :key="m"
          class="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"
        >
          Falta {{ m }}
        </span>
      </div>
      <p v-else-if="status" class="text-sm text-emerald-600">🎉 Todo registrado hoy</p>
    </header>

    <!-- Resumen de hoy -->
    <div class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div class="rounded-2xl border border-gray-200 bg-white p-5">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">⚖️ Peso</p>
        <p class="mt-2 text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">
          <template v-if="weightShown !== null">{{ weightShown.toFixed(1) }}<span class="ml-1 text-base font-normal text-gray-400">kg</span></template>
          <template v-else>—</template>
        </p>
        <p class="mt-1 text-xs text-gray-400">
          <template v-if="weightShown !== null && targetKg !== null">
            Meta {{ targetKg.toFixed(1) }} kg · faltan {{ Math.abs(weightShown - targetKg).toFixed(1) }}
          </template>
          <template v-else-if="weightShown !== null && weightToday === null">Último registro</template>
          <template v-else-if="weightShown === null">Regístralo abajo</template>
          <template v-else>Sin meta aún</template>
        </p>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-5">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">🍽️ Calorías</p>
        <p class="mt-2 text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">
          {{ fmt(caloriesIn) }}<span v-if="calorieGoal" class="ml-1 text-base font-normal text-gray-400">/ {{ fmt(calorieGoal) }}</span>
        </p>
        <div v-if="calorieGoal" class="mt-2.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div class="h-full rounded-full bg-emerald-500 transition-all duration-700" :style="{ width: `${pct(caloriesIn, calorieGoal)}%` }" />
        </div>
        <p v-else class="mt-1 text-xs text-gray-400">kcal consumidas</p>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-5">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">🏃 Quemadas</p>
        <p class="mt-2 text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">
          {{ fmt(caloriesOut) }}<span class="ml-1 text-base font-normal text-gray-400">kcal</span>
        </p>
        <p class="mt-1 text-xs text-gray-400">Neto {{ fmt(caloriesIn - caloriesOut) }} kcal</p>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-5">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">💧 Agua</p>
        <p class="mt-2 text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">
          {{ Math.round(waterMl / 250) }}<span class="ml-1 text-base font-normal text-gray-400">/ {{ Math.ceil(waterGoal / 250) }} vasos</span>
        </p>
        <div class="mt-2.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div class="h-full rounded-full bg-sky-500 transition-all duration-700" :style="{ width: `${pct(waterMl, waterGoal)}%` }" />
        </div>
      </div>
    </div>

    <DashboardQuickLogForm class="mb-6" @logged="refresh" />

    <div class="mb-6 grid gap-4 lg:grid-cols-2">
      <DashboardWeightChart :data="progress?.weights ?? []" />
      <DashboardCaloriesChart :data="progress?.daily_calories ?? []" />
    </div>

    <div class="mb-6 grid gap-4 lg:grid-cols-5">
      <div class="space-y-4 lg:col-span-3">
        <DashboardNutritionToday :nutrition="status?.nutrition ?? null" :protein-goal="goal?.daily_protein_g ?? null" />
        <DashboardMealLog :meals="status?.meals ?? []" />
      </div>
      <div class="space-y-4 lg:col-span-2">
        <DashboardWaterTracker :total-ml="waterMl" :goal-ml="waterGoal" />
        <DashboardExerciseLog :exercises="status?.exercises ?? []" />
      </div>
    </div>

    <DashboardWeekComparison
      :current="weekSummary?.totals ?? null"
      :previous="lastWeekSummary?.totals ?? null"
    />
  </div>
</template>
