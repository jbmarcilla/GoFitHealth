<script setup lang="ts">
import { MEAL_LABELS, UNIT_LABELS } from '~/utils/format'

interface Meal {
  id: string
  meal_type: string
  food_name: string
  quantity: number
  unit: string
  estimated_calories: number
  estimated_protein?: number | null
  estimated_carbs?: number | null
  estimated_fat?: number | null
  estimated_grams?: number | null
  caloric_density?: 'green' | 'yellow' | 'red'
  foods?: { food_category?: string; caloric_density?: 'green' | 'yellow' | 'red' } | null
}

type Density = 'green' | 'yellow' | 'red'

const props = defineProps<{ meals: Meal[] }>()

// --- Icons ---

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍿',
}

const FOOD_KW: [string, string][] = [
  ['arroz', '🍚'], ['pollo', '🍗'], ['huevo', '🥚'], ['leche', '🥛'],
  ['pan', '🍞'], ['avena', '🥣'], ['carne', '🥩'], ['pescado', '🐟'],
  ['atún', '🐟'], ['salmón', '🐟'], ['manzana', '🍎'], ['plátano', '🍌'],
  ['banana', '🍌'], ['café', '☕'], ['yogurt', '🥛'], ['queso', '🧀'],
  ['pasta', '🍝'], ['fideos', '🍝'], ['sopa', '🍲'], ['ensalada', '🥗'],
  ['hamburguesa', '🍔'], ['pizza', '🍕'], ['sandwich', '🥪'], ['taco', '🌮'],
  ['jugo', '🧃'], ['agua', '💧'], ['galleta', '🍪'], ['torta', '🎂'],
  ['helado', '🍦'], ['papa', '🥔'], ['brócoli', '🥦'], ['tomate', '🍅'],
  ['zanahoria', '🥕'], ['maíz', '🌽'], ['aguacate', '🥑'], ['palta', '🥑'],
  ['cerdo', '🥓'], ['tocino', '🥓'], ['camarón', '🦐'], ['almendra', '🥜'],
  ['maní', '🥜'], ['nuez', '🥜'], ['chocolate', '🍫'], ['aceite', '🫒'],
]

const CAT_ICONS: Record<string, string> = {
  protein: '🥩', grains: '🌾', vegetables: '🥦', fruits: '🍎',
  dairy: '🥛', fats: '🫒', nuts: '🥜', snacks: '🍪', liquids: '🥤',
}

function foodIcon(m: Meal): string {
  const l = m.food_name.toLowerCase()
  for (const [kw, ic] of FOOD_KW) { if (l.includes(kw)) return ic }
  const cat = m.foods?.food_category
  if (cat && CAT_ICONS[cat]) return CAT_ICONS[cat]
  return '🍽️'
}

// --- Density ---

const DENSITY: Record<Density, { label: string; cls: string; dot: string; border: string; hint: string }> = {
  green:  { label: 'Ligero',   cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400', border: 'border-l-emerald-400', hint: 'Mucha agua y fibra, pocas calorías por gramo' },
  yellow: { label: 'Moderado', cls: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400',   border: 'border-l-amber-400',   hint: 'Base de tu alimentación, porciones moderadas' },
  red:    { label: 'Denso',    cls: 'bg-rose-100 text-rose-700',       dot: 'bg-rose-400',    border: 'border-l-rose-400',    hint: 'Muchas calorías por gramo, porciones pequeñas' },
}

function densityFromRatio(kcalPerGram: number): Density {
  if (kcalPerGram < 1) return 'green'
  if (kcalPerGram <= 2.5) return 'yellow'
  return 'red'
}

function getDensity(m: Meal): Density | null {
  const known = m.foods?.caloric_density || m.caloric_density
  if (known) return known
  const grams = Number(m.estimated_grams ?? 0)
  if (grams > 0) return densityFromRatio(m.estimated_calories / grams)
  return null
}

/** Density of a whole meal: kcal per gram of everything eaten, or the dominant color by kcal. */
function groupDensity(items: Meal[]): Density | null {
  const grams = items.reduce((s, m) => s + Number(m.estimated_grams ?? 0), 0)
  const kcal = items.reduce((s, m) => s + m.estimated_calories, 0)
  if (grams > 0) return densityFromRatio(kcal / grams)
  const byColor: Record<Density, number> = { green: 0, yellow: 0, red: 0 }
  let any = false
  for (const m of items) {
    const d = getDensity(m)
    if (d) { byColor[d] += m.estimated_calories; any = true }
  }
  if (!any) return null
  return (Object.keys(byColor) as Density[]).sort((a, b) => byColor[b] - byColor[a])[0]
}

function groupKcalPerGram(items: Meal[]): string | null {
  const grams = items.reduce((s, m) => s + Number(m.estimated_grams ?? 0), 0)
  if (!grams) return null
  const kcal = items.reduce((s, m) => s + m.estimated_calories, 0)
  return (kcal / grams).toFixed(1)
}

// --- Groups ---

interface MealGroup {
  type: string
  meals: Meal[]
  kcal: number
  protein: number
  carbs: number
  fat: number
  density: Density | null
  kcalPerGram: string | null
}

const groups = computed<MealGroup[]>(() => {
  const order = ['breakfast', 'lunch', 'dinner', 'snack']
  const result: MealGroup[] = []
  for (const type of order) {
    const items = props.meals.filter(m => m.meal_type === type)
    if (!items.length) continue
    result.push({
      type,
      meals: items,
      kcal: items.reduce((s, m) => s + m.estimated_calories, 0),
      protein: Math.round(items.reduce((s, m) => s + Number(m.estimated_protein ?? 0), 0)),
      carbs: Math.round(items.reduce((s, m) => s + Number(m.estimated_carbs ?? 0), 0)),
      fat: Math.round(items.reduce((s, m) => s + Number(m.estimated_fat ?? 0), 0)),
      density: groupDensity(items),
      kcalPerGram: groupKcalPerGram(items),
    })
  }
  return result
})

// --- Density stats ---

const densityStats = computed(() => {
  const st = { green: { n: 0, kcal: 0 }, yellow: { n: 0, kcal: 0 }, red: { n: 0, kcal: 0 } }
  for (const m of props.meals) {
    const d = getDensity(m)
    if (d && st[d]) { st[d].n++; st[d].kcal += m.estimated_calories }
  }
  const total = st.green.kcal + st.yellow.kcal + st.red.kcal || 1
  return {
    ...st,
    hasAny: st.green.n + st.yellow.n + st.red.n > 0,
    greenPct: Math.round((st.green.kcal / total) * 100),
    yellowPct: Math.round((st.yellow.kcal / total) * 100),
    redPct: Math.round((st.red.kcal / total) * 100),
  }
})

const showLegend = ref(false)
</script>

<template>
  <div v-if="meals.length">
    <!-- Meal groups -->
    <div class="space-y-3">
      <div
        v-for="g in groups"
        :key="g.type"
        class="rounded-2xl border border-gray-100 bg-white"
        :class="g.density ? ['border-l-4', DENSITY[g.density].border] : ''"
      >
        <!-- Group header -->
        <div class="border-b border-gray-50 px-4 py-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ MEAL_ICONS[g.type] || '🍽️' }}</span>
              <span class="text-sm font-semibold text-gray-900">{{ MEAL_LABELS[g.type] || g.type }}</span>
            </div>
            <div class="text-right">
              <span class="text-sm font-bold tabular-nums text-gray-900">{{ g.kcal }} kcal</span>
              <p class="text-[11px] tabular-nums text-gray-400">
                {{ g.protein }}P · {{ g.carbs }}C · {{ g.fat }}G
              </p>
            </div>
          </div>
          <div v-if="g.density" class="mt-2 flex items-center gap-2 text-[11px]">
            <span class="rounded-full px-2 py-0.5 font-semibold" :class="DENSITY[g.density].cls">
              ● {{ DENSITY[g.density].label }}<template v-if="g.kcalPerGram"> · {{ g.kcalPerGram }} kcal/g</template>
            </span>
            <span class="text-gray-400">{{ DENSITY[g.density].hint }}</span>
          </div>
        </div>

        <!-- Food items -->
        <div class="divide-y divide-gray-50">
          <div v-for="meal in g.meals" :key="meal.id" class="flex items-center gap-3 px-4 py-2.5">
            <span class="text-lg shrink-0">{{ foodIcon(meal) }}</span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="truncate text-sm text-gray-800">{{ meal.food_name }}</p>
                <span
                  v-if="getDensity(meal)"
                  class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  :class="DENSITY[getDensity(meal)!].cls"
                >
                  {{ DENSITY[getDensity(meal)!].label }}
                </span>
              </div>
              <p class="text-xs text-gray-400">
                {{ meal.quantity }} {{ UNIT_LABELS[meal.unit] || meal.unit }}
              </p>
            </div>
            <span class="shrink-0 text-sm font-medium tabular-nums text-gray-700">
              {{ meal.estimated_calories }} kcal
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Density distribution -->
    <div v-if="densityStats.hasAny" class="mt-4 rounded-2xl border border-gray-100 bg-white p-4">
      <div class="mb-2 flex items-center justify-between">
        <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Densidad calórica del día</p>
        <button
          class="text-[11px] font-medium text-emerald-600 hover:underline"
          @click="showLegend = !showLegend"
        >
          {{ showLegend ? 'Ocultar' : '¿Qué es esto?' }}
        </button>
      </div>

      <!-- Bar -->
      <div class="flex h-4 overflow-hidden rounded-full bg-gray-100">
        <div
          v-if="densityStats.greenPct > 0"
          class="flex items-center justify-center bg-emerald-400 text-[9px] font-bold text-white transition-all duration-500"
          :style="{ width: `${densityStats.greenPct}%` }"
        >
          <span v-if="densityStats.greenPct >= 15">{{ densityStats.greenPct }}%</span>
        </div>
        <div
          v-if="densityStats.yellowPct > 0"
          class="flex items-center justify-center bg-amber-400 text-[9px] font-bold text-white transition-all duration-500"
          :style="{ width: `${densityStats.yellowPct}%` }"
        >
          <span v-if="densityStats.yellowPct >= 15">{{ densityStats.yellowPct }}%</span>
        </div>
        <div
          v-if="densityStats.redPct > 0"
          class="flex items-center justify-center bg-rose-400 text-[9px] font-bold text-white transition-all duration-500"
          :style="{ width: `${densityStats.redPct}%` }"
        >
          <span v-if="densityStats.redPct >= 15">{{ densityStats.redPct }}%</span>
        </div>
      </div>

      <!-- Counts -->
      <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span v-if="densityStats.green.n" class="flex items-center gap-1">
          <span class="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          {{ densityStats.green.n }} verde{{ densityStats.green.n > 1 ? 's' : '' }}
          <span class="text-gray-400">({{ densityStats.green.kcal }} kcal)</span>
        </span>
        <span v-if="densityStats.yellow.n" class="flex items-center gap-1">
          <span class="h-2.5 w-2.5 rounded-full bg-amber-400" />
          {{ densityStats.yellow.n }} amarillo{{ densityStats.yellow.n > 1 ? 's' : '' }}
          <span class="text-gray-400">({{ densityStats.yellow.kcal }} kcal)</span>
        </span>
        <span v-if="densityStats.red.n" class="flex items-center gap-1">
          <span class="h-2.5 w-2.5 rounded-full bg-rose-400" />
          {{ densityStats.red.n }} rojo{{ densityStats.red.n > 1 ? 's' : '' }}
          <span class="text-gray-400">({{ densityStats.red.kcal }} kcal)</span>
        </span>
      </div>

      <!-- Legend (expandable) -->
      <Transition name="fade">
        <div v-if="showLegend" class="mt-3 space-y-2 rounded-xl bg-gray-50 p-3 text-[12px] leading-relaxed text-gray-600">
          <p>
            <span class="mr-1 inline-block h-3 w-3 rounded-full bg-emerald-400 align-middle" />
            <b>Verde</b> (menos de 1 kcal/g) — Frutas, verduras, sopas. Puedes comer libremente, son alimentos con mucha agua y fibra.
          </p>
          <p>
            <span class="mr-1 inline-block h-3 w-3 rounded-full bg-amber-400 align-middle" />
            <b>Amarillo</b> (1–2.5 kcal/g) — Arroz, pan, carne, legumbres. Porciones moderadas, son la base de tu alimentación.
          </p>
          <p>
            <span class="mr-1 inline-block h-3 w-3 rounded-full bg-rose-400 align-middle" />
            <b>Rojo</b> (más de 2.5 kcal/g) — Frutos secos, dulces, aceites, queso. Son nutritivos pero concentrados: porciones pequeñas.
          </p>
          <p class="pt-1 text-[11px] italic text-gray-400">
            💡 Ningún alimento es malo. Los colores te ayudan a equilibrar: llena tu plato con verdes, complementa con amarillos, y disfruta los rojos en porciones conscientes.
          </p>
        </div>
      </Transition>
    </div>
  </div>

  <!-- Empty state -->
  <div v-else class="rounded-2xl border border-dashed border-gray-200 py-12 text-center">
    <p class="text-3xl">🍽️</p>
    <p class="mt-2 text-sm text-gray-400">No hay comidas registradas.</p>
    <p class="mt-1 text-xs text-gray-300">Dile a tu IA qué comiste</p>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; max-height: 0; overflow: hidden; }
.fade-enter-to, .fade-leave-from { opacity: 1; max-height: 500px; }
</style>
