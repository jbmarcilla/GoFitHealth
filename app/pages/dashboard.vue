<script setup lang="ts">
import { phraseOfTheDay } from '#shared/constants/phrases'

definePageMeta({ middleware: 'auth' })

const user = useSupabaseUser()
const {
  selectedDate, todayStr, weekDays, isToday,
  dayStatus, dayLoading, weekStatus, progress,
  selectDate, prevWeek, nextWeek, goToToday, refresh,
} = useDashboard()

const showMicros = ref(false)

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

const weights = computed<Array<{ date: string; weight_kg: number }>>(() => progress.value?.weights ?? [])
const weightOfDay = computed(() => (status.value?.weight?.weight_kg ? Number(status.value.weight.weight_kg) : null))
const latestKg = computed(() => weightOfDay.value ?? (weights.value.length ? Number(weights.value[weights.value.length - 1].weight_kg) : null))
const startKg = computed(() => (weights.value.length ? Number(weights.value[0].weight_kg) : null))
const weightDelta = computed(() => (latestKg.value !== null && startKg.value !== null ? latestKg.value - startKg.value : null))
const weightProgressPct = computed(() => {
  if (latestKg.value === null || startKg.value === null || targetKg.value === null) return null
  const total = Math.abs(startKg.value - targetKg.value)
  if (total < 0.1) return 100
  const done = Math.abs(startKg.value - latestKg.value)
  const towards = (startKg.value > targetKg.value) === (startKg.value > latestKg.value)
  return Math.max(0, Math.min(100, Math.round(((towards ? done : -done) / total) * 100)))
})

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
  <div class="relative mx-auto max-w-lg px-4 pb-16 pt-6">
    <!-- Loading overlay -->
    <Transition name="fade">
      <div v-if="dayLoading" class="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
        <div class="flex flex-col items-center gap-2">
          <span class="punch text-5xl">💪</span>
          <span class="text-xs font-medium text-emerald-700">Cargando tu día…</span>
        </div>
      </div>
    </Transition>

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
        :status="weekStatus ?? []"
        @select="selectDate"
        @prev="prevWeek"
        @next="nextWeek"
      />
      <p class="mt-2 text-center text-sm font-medium capitalize text-gray-700">{{ dateLabel }}</p>
      <p class="mt-1 text-center text-[10px] text-gray-400">✓ dentro del máximo · + te pasaste</p>
    </div>

    <!-- Calorie ring -->
    <div class="mb-6 rounded-2xl border border-gray-100 bg-white px-4 py-5">
      <DashboardCalorieRing
        :consumed="caloriesIn"
        :goal="calorieGoal"
        :burned="caloriesOut"
        :plan="status?.calorie_plan ?? null"
      />
    </div>

    <!-- Weight metric -->
    <div class="mb-6 rounded-2xl border border-gray-100 bg-white px-4 py-4">
      <div class="flex items-center justify-between">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">⚖️ Peso</p>
        <span v-if="weightDelta !== null && weights.length > 1" class="text-xs tabular-nums" :class="weightDelta < 0 ? 'text-emerald-600' : weightDelta > 0 ? 'text-amber-600' : 'text-gray-400'">
          {{ weightDelta > 0 ? '+' : '' }}{{ weightDelta.toFixed(1) }} kg en 30 días
        </span>
      </div>
      <div class="mt-2 flex items-end justify-between">
        <p class="text-2xl font-bold tabular-nums text-gray-900">
          <template v-if="latestKg !== null">{{ latestKg.toFixed(1) }}<span class="text-sm font-normal text-gray-400"> kg</span></template>
          <template v-else>—</template>
        </p>
        <p v-if="targetKg !== null" class="text-xs text-gray-400">
          Meta <b class="text-gray-700">{{ targetKg.toFixed(1) }} kg</b>
          <template v-if="latestKg !== null"> · faltan {{ Math.abs(latestKg - targetKg).toFixed(1) }}</template>
        </p>
        <NuxtLink v-else to="/settings" class="text-xs text-emerald-600 hover:underline">Definir meta →</NuxtLink>
      </div>
      <template v-if="weightProgressPct !== null">
        <div class="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
          <div class="h-full rounded-full bg-emerald-500 transition-all duration-700" :style="{ width: `${weightProgressPct}%` }" />
        </div>
        <div class="mt-1 flex justify-between text-[10px] tabular-nums text-gray-400">
          <span>{{ startKg?.toFixed(1) }} kg</span>
          <span>{{ weightProgressPct }}% del camino</span>
          <span>{{ targetKg?.toFixed(1) }} kg</span>
        </div>
      </template>
      <p v-else-if="latestKg === null" class="mt-1 text-xs text-gray-400">Dile a tu IA cuánto pesas hoy.</p>
      <p v-else-if="!weightOfDay && isToday" class="mt-1 text-xs text-amber-600">Hoy aún no te pesaste · último registro</p>
    </div>

    <!-- Macros (tap to see micronutrients) -->
    <div v-if="nutrition" class="mb-6 rounded-2xl border border-gray-100 bg-white px-4 py-5">
      <button class="w-full text-left" @click="showMicros = !showMicros">
        <DashboardMacroSummary
          :protein="proteinG"
          :carbs="carbsG"
          :fat="fatG"
          :fiber="fiberG"
          :protein-goal="proteinGoal"
        />
        <p class="mt-3 flex items-center justify-center gap-2 text-[11px] text-gray-400">
          <span v-if="fiberG > 0">Fibra {{ fiberG }} g ·</span>
          <span class="font-medium text-emerald-600">
            {{ showMicros ? 'Ocultar micronutrientes ▲' : `Ver micronutrientes (${microNutrients.length}) ▼` }}
          </span>
        </p>
      </button>
      <Transition name="fade">
        <div v-if="showMicros" class="mt-3 border-t border-gray-50 pt-3">
          <template v-if="microNutrients.length">
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
            <p class="mt-2 text-[10px] text-gray-400">% de lo recomendado al día · Verde: cubierto · Ámbar: bajo · Rojo: exceso</p>
          </template>
          <p v-else class="text-xs text-gray-400">Los alimentos de este día aún no tienen micronutrientes. Se completan solos con el uso.</p>
        </div>
      </Transition>
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

<style scoped>
.punch { animation: punch 0.9s ease-in-out infinite; display: inline-block; }
@keyframes punch {
  0%, 100% { transform: translateY(0) rotate(-8deg) scale(1); }
  50% { transform: translateY(-10px) rotate(8deg) scale(1.15); }
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
