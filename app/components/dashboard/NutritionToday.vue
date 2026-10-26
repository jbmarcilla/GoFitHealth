<script setup lang="ts">
interface NutrientTotal {
  key: string
  name: string
  unit: string
  category: string
  amount: number
  percent: number | null
  is_limit: boolean
}

interface Nutrition {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  nutrients: NutrientTotal[]
}

const props = defineProps<{
  nutrition: Nutrition | null
  proteinGoal?: number | null
}>()

const macros = computed(() => {
  const n = props.nutrition
  if (!n) return []
  const kcal = { p: n.protein_g * 4, c: n.carbs_g * 4, f: n.fat_g * 9 }
  const total = kcal.p + kcal.c + kcal.f || 1
  return [
    { key: 'p', name: 'Proteína', grams: n.protein_g, pct: Math.round((kcal.p / total) * 100), color: 'bg-emerald-500', goal: props.proteinGoal ?? null },
    { key: 'c', name: 'Carbohidratos', grams: n.carbs_g, pct: Math.round((kcal.c / total) * 100), color: 'bg-amber-400', goal: null },
    { key: 'f', name: 'Grasa', grams: n.fat_g, pct: Math.round((kcal.f / total) * 100), color: 'bg-rose-400', goal: null },
  ]
})

const micro = computed(() => (props.nutrition?.nutrients ?? []).filter(n => n.key !== 'fiber'))

function fmt(n: NutrientTotal) {
  const v = n.amount
  const s = v >= 100 ? Math.round(v).toString() : v >= 10 ? v.toFixed(1) : v.toFixed(2).replace(/\.?0+$/, '')
  return `${s} ${n.unit}`
}

function tone(n: NutrientTotal) {
  if (n.percent === null) return 'border-gray-200 text-gray-600'
  if (n.is_limit) return n.percent > 100 ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600'
  if (n.percent >= 90) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (n.percent < 50) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-gray-200 text-gray-600'
}
</script>

<template>
  <div class="card">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-xs font-medium uppercase tracking-wider text-gray-400">🥗 Nutrición de hoy</h3>
      <span v-if="nutrition" class="text-xs text-gray-400">Fibra {{ nutrition.fiber_g }} g</span>
    </div>

    <template v-if="nutrition">
      <div class="mb-2 flex h-2 overflow-hidden rounded-full bg-gray-100">
        <div v-for="m in macros" :key="m.key" class="h-full" :class="m.color" :style="{ width: `${m.pct}%` }" />
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div v-for="m in macros" :key="m.key">
          <p class="flex items-center gap-1.5 text-xs text-gray-400"><span class="h-2 w-2 rounded-full" :class="m.color" />{{ m.name }}</p>
          <p class="mt-0.5 text-lg font-semibold tabular-nums text-gray-900">
            {{ m.grams }}<span class="text-xs font-normal text-gray-400"> g<template v-if="m.goal"> / {{ m.goal }}</template></span>
          </p>
          <p class="text-[11px] text-gray-400">{{ m.pct }}% de la energía</p>
        </div>
      </div>

      <div v-if="micro.length" class="mt-5">
        <p class="mb-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">Micronutrientes · % del día</p>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="n in micro"
            :key="n.key"
            class="rounded-full border px-2.5 py-1 text-xs tabular-nums"
            :class="tone(n)"
            :title="fmt(n)"
          >
            {{ n.name }} <b v-if="n.percent !== null">{{ n.percent }}%</b><template v-else>{{ fmt(n) }}</template>
          </span>
        </div>
        <p class="mt-2 text-[11px] text-gray-400">Verde: cubierto · Ámbar: bajo · Rojo: te pasas (sodio, azúcar)</p>
      </div>
      <p v-else class="mt-4 text-xs text-gray-400">
        Los alimentos de hoy aún no tienen micronutrientes en la base. Dile a tu IA que los complete.
      </p>
    </template>

    <p v-else class="py-8 text-center text-sm text-gray-400">Registra una comida para ver tus macros y micronutrientes.</p>
  </div>
</template>
