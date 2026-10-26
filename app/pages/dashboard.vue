<script setup lang="ts">
import { phraseOfTheDay } from '#shared/constants/phrases'

definePageMeta({ middleware: 'auth' })

const user = useSupabaseUser()
const {
  selectedDate, todayStr, weekDays, isToday,
  dayStatus, progress,
  selectDate, prevWeek, nextWeek, goToToday, refresh,
} = useDashboard()

const firstName = computed(() =>
  (user.value?.user_metadata?.full_name || user.value?.user_metadata?.name || '').split(' ')[0],
)
const phrase = phraseOfTheDay()

const status = computed(() => dayStatus.value as any)
const goal = computed(() => status.value?.goal ?? null)
const missing = computed<string[]>(() => status.value?.missing ?? [])
const nutrition = computed(() => status.value?.nutrition ?? null)

const caloriesIn = computed(() => status.value?.calories_in ?? 0)
const caloriesOut = computed(() => status.value?.calories_out ?? 0)
const calorieGoal = computed(() => (goal.value?.daily_calorie_target ? Number(goal.value.daily_calorie_target) : null))
const waterMl = computed(() => status.value?.water_total_ml ?? 0)
const waterGoal = computed(() => (goal.value?.daily_water_ml ? Number(goal.value.daily_water_ml) : 2000))
const targetKg = computed(() => (goal.value?.target_weight_kg ? Number(goal.value.target_weight_kg) : null))

const proteinG = computed(() => nutrition.value?.protein_g ?? 0)
const carbsG = computed(() => nutrition.value?.carbs_g ?? 0)
const fatG = computed(() => nutrition.value?.fat_g ?? 0)
const fiberG = computed(() => nutrition.value?.fiber_g ?? 0)
const proteinGoal = computed(() => goal.value?.daily_protein_g ?? null)

const microNutrients = computed(() => (nutrition.value?.nutrients ?? []).filter((n: any) => n.key !== 'fiber'))

const dateLabel = computed(() => {
  if (isToday.value) return 'Hoy'
  const d = new Date(selectedDate.value + 'T12:00:00')
  return d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
})

function fmt(n: { amount: number; unit: string }) {
  const v = n.amount
  const s = v >= 100 ? Math.round(v).toString() : v >= 10 ? v.toFixed(1) : v.toFixed(2).replace(/\.?0+$/, '')
  return `${s} ${n.unit}`
}

function microTone(n: { percent: number | null; is_limit: boolean }) {
  if (n.percent === null) return 'border-gray-200 text-gray-500'
  if (n.is_limit) return n.percent > 100 ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500'
  if (n.percent >= 90) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (n.percent < 50) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-gray-200 text-gray-500'
}
</script>

<template>
  <div class="mx-auto max-w-lg px-4 pb-16 pt-6">
    <!-- Header -->
    <header class="mb-6 flex items-end justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">
          Hola, {{ firstName || 'ahí' }}
        </h1>
        <p class="mt-1 text-sm text-emerald-600">"{{ phrase }}"</p>
      </div>
      <button
        v-if="!isToday"
        class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
        @click="goToToday"
      >
        Ir a hoy
      </button>
    </header>

    <!-- Date navigation -->
    <div class="mb-6 rounded-2xl border border-gray-100 bg-white px-2 py-3">
      <DashboardDateNav
        :week-days="weekDays"
        :selected-date="selectedDate"
        :today="todayStr"
        @select="selectDate"
        @prev="prevWeek"
        @next="nextWeek"
      />
      <p class="mt-2 text-center text-sm font-medium capitalize text-gray-700">{{ dateLabel }}</p>
    </div>

    <!-- Calorie ring -->
    <div class="mb-6 rounded-2xl border border-gray-100 bg-white px-4 py-5">
      <DashboardCalorieRing
        :consumed="caloriesIn"
        :goal="calorieGoal"
        :burned="caloriesOut"
      />
    </div>

    <!-- Macros -->
    <div v-if="nutrition" class="mb-6 rounded-2xl border border-gray-100 bg-white px-4 py-5">
      <DashboardMacroSummary
        :protein="proteinG"
        :carbs="carbsG"
        :fat="fatG"
        :fiber="fiberG"
        :protein-goal="proteinGoal"
      />
      <p v-if="fiberG > 0" class="mt-3 text-center text-[11px] text-gray-400">
        Fibra: {{ fiberG }} g
      </p>
    </div>

    <!-- Missing chips -->
    <div v-if="missing.length && isToday" class="mb-6 flex flex-wrap gap-1.5">
      <span
        v-for="m in missing"
        :key="m"
        class="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"
      >
        Falta {{ m }}
      </span>
    </div>
    <p v-else-if="status && isToday && status.meals?.length" class="mb-6 text-center text-sm font-medium text-emerald-600">
      🎉 Todo registrado hoy
    </p>

    <!-- Meals -->
    <div class="mb-6">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-gray-900">Comidas</h2>
        <span v-if="status?.meals?.length" class="text-sm font-bold tabular-nums text-gray-900">
          {{ caloriesIn.toLocaleString('es-PE') }} kcal
        </span>
      </div>
      <DashboardMealLog :meals="status?.meals ?? []" />
    </div>

    <!-- Micronutrients -->
    <div v-if="microNutrients.length" class="mb-6 rounded-2xl border border-gray-100 bg-white px-4 py-4">
      <p class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Micronutrientes · % del día</p>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="n in microNutrients"
          :key="n.key"
          class="rounded-full border px-2.5 py-1 text-xs tabular-nums"
          :class="microTone(n)"
          :title="fmt(n)"
        >
          {{ n.name }} <b v-if="n.percent !== null">{{ n.percent }}%</b><template v-else>{{ fmt(n) }}</template>
        </span>
      </div>
      <p class="mt-2 text-[10px] text-gray-400">Verde: cubierto · Ámbar: bajo · Rojo: exceso</p>
    </div>

    <!-- Exercise (full width, prominent) -->
    <div class="mb-6 rounded-2xl border border-gray-100 bg-white p-4">
      <div class="flex items-center justify-between">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">🔥 Ejercicio</p>
        <span v-if="caloriesOut > 0" class="flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold tabular-nums text-orange-600">
          🔥 {{ caloriesOut.toLocaleString('es-PE') }} kcal
        </span>
      </div>
      <div v-if="status?.exercises?.length" class="mt-3 space-y-2">
        <div
          v-for="e in status.exercises"
          :key="e.id"
          class="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5"
        >
          <div>
            <p class="text-sm font-medium text-gray-800">{{ e.exercise_name }}</p>
            <p class="text-xs text-gray-400">{{ e.duration_minutes }} minutos</p>
          </div>
          <span class="text-sm font-semibold tabular-nums text-orange-600">{{ e.calories_burned }} kcal</span>
        </div>
      </div>
      <p v-else class="mt-3 text-center text-sm text-gray-400">
        Sin ejercicio registrado. Dile a tu IA qué entrenamiento hiciste.
      </p>
    </div>

    <!-- Water -->
    <div class="mb-6 rounded-2xl border border-gray-100 bg-white p-4">
      <div class="flex items-center justify-between">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">💧 Agua</p>
        <span class="text-xs text-gray-400">{{ waterMl }} / {{ waterGoal }} ml</span>
      </div>
      <p class="mt-2 text-2xl font-bold tabular-nums text-gray-900">
        {{ Math.round(waterMl / 250) }}<span class="text-sm font-normal text-gray-400"> / {{ Math.ceil(waterGoal / 250) }} vasos</span>
      </p>
      <div class="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          class="h-full rounded-full bg-sky-500 transition-all duration-500"
          :style="{ width: `${Math.min(100, (waterMl / waterGoal) * 100)}%` }"
        />
      </div>
      <p v-if="waterMl >= waterGoal" class="mt-2 text-sm font-medium text-sky-600">🎉 ¡Meta de agua cumplida!</p>
    </div>

    <!-- Weight chart -->
    <div class="mb-6">
      <DashboardWeightChart
        :data="progress?.weights ?? []"
        :target-kg="targetKg"
      />
    </div>

    <!-- Quick log form (secondary) -->
    <DashboardQuickLogForm class="mb-6" @logged="refresh" />
  </div>
</template>
