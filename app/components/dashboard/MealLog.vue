<script setup lang="ts">
import { MEAL_LABELS, UNIT_LABELS } from '~/utils/format'
import { DENSITY_INFO, DENSITY_ORDER, DENSITY_RULE, densityOfPortion, type Density, type DensityResult } from '#shared/constants/caloric-density'

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
  caloric_density?: Density
  foods?: { food_category?: string; caloric_density?: Density } | null
}

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

// --- Density (shared helper) ---

/** Density of one logged food, with the numbers that explain the color. */
function mealDensity(m: Meal): DensityResult | null {
  const grams = Number(m.estimated_grams ?? 0)
  if (grams > 0) return densityOfPortion(m.food_name, m.estimated_calories, grams)
  const known = m.foods?.caloric_density || m.caloric_density
  if (!known) return null
  const info = DENSITY_INFO[known]
  return { density: known, kcalPerGram: 0, info, explanation: `${m.food_name}: ${info.emoji} ${info.label} (${info.range}). ${info.advice}` }
}

/** Density of a whole meal: everything eaten, kcal over grams; else the color with most calories. */
function groupDensity(label: string, items: Meal[]): DensityResult | null {
  const withGrams = items.filter(m => Number(m.estimated_grams ?? 0) > 0)
  if (withGrams.length === items.length) {
    const grams = items.reduce((s, m) => s + Number(m.estimated_grams), 0)
    const kcal = items.reduce((s, m) => s + m.estimated_calories, 0)
    return densityOfPortion(label, kcal, grams)
  }
  const byColor: Record<Density, number> = { green: 0, yellow: 0, red: 0 }
  let any = false
  for (const m of items) {
    const d = mealDensity(m)
    if (d) { byColor[d.density] += m.estimated_calories; any = true }
  }
  if (!any) return null
  const top = DENSITY_ORDER.slice().sort((a, b) => byColor[b] - byColor[a])[0]
  const info = DENSITY_INFO[top]
  return { density: top, kcalPerGram: 0, info, explanation: `${label}: la mayoría de las calorías (${byColor[top]} kcal) vienen de alimentos ${info.emoji} ${info.label.toLowerCase()}. ${info.advice}` }
}

// --- Groups ---

interface MealGroup {
  type: string
  meals: Meal[]
  kcal: number
  protein: number
  carbs: number
  fat: number
  density: DensityResult | null
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
      density: groupDensity(MEAL_LABELS[type] || type, items),
    })
  }
  return result
})

// --- Day distribution ---

const densityStats = computed(() => {
  const st: Record<Density, { n: number; kcal: number }> = { green: { n: 0, kcal: 0 }, yellow: { n: 0, kcal: 0 }, red: { n: 0, kcal: 0 } }
  for (const m of props.meals) {
    const d = mealDensity(m)
    if (d) { st[d.density].n++; st[d.density].kcal += m.estimated_calories }
  }
  const total = st.green.kcal + st.yellow.kcal + st.red.kcal || 1
  const pct = (k: Density) => Math.round((st[k].kcal / total) * 100)
  return { st, hasAny: st.green.n + st.yellow.n + st.red.n > 0, pct }
})

const showLegend = ref(false)
const openTip = ref<string | null>(null)
function toggleTip(id: string) {
  openTip.value = openTip.value === id ? null : id
}
</script>

<template>
  <div v-if="meals.length">
    <div class="space-y-3">
      <div
        v-for="g in groups"
        :key="g.type"
        class="rounded-2xl border border-gray-100 bg-white"
        :class="g.density ? ['border-l-4', g.density.info.border] : ''"
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
              <p class="text-[11px] tabular-nums text-gray-400">{{ g.protein }}P · {{ g.carbs }}C · {{ g.fat }}G</p>
            </div>
          </div>
          <div v-if="g.density" class="group relative mt-2 inline-block">
            <button
              class="flex items-center gap-2 text-left text-[11px]"
              :title="g.density.explanation"
              @click="toggleTip(g.type)"
            >
              <span class="rounded-full px-2 py-0.5 font-semibold" :class="g.density.info.badge">
                ● {{ g.density.info.short }}<template v-if="g.density.kcalPerGram"> · {{ g.density.kcalPerGram.toFixed(1) }} kcal/g</template>
              </span>
              <span class="text-gray-400">{{ g.density.info.range }}</span>
            </button>
            <div
              class="absolute left-0 top-full z-20 mt-1 w-72 rounded-xl border border-gray-200 bg-white p-3 text-[11px] leading-relaxed text-gray-700 shadow-lg"
              :class="openTip === g.type ? 'block' : 'hidden group-hover:block'"
            >
              {{ g.density.explanation }}
            </div>
          </div>
        </div>

        <!-- Food items -->
        <div class="divide-y divide-gray-50">
          <div v-for="meal in g.meals" :key="meal.id" class="flex items-center gap-3 px-4 py-2.5">
            <span class="shrink-0 text-lg">{{ foodIcon(meal) }}</span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="truncate text-sm text-gray-800">{{ meal.food_name }}</p>
                <div v-if="mealDensity(meal)" class="group relative shrink-0">
                  <button
                    class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    :class="mealDensity(meal)!.info.badge"
                    :title="mealDensity(meal)!.explanation"
                    @click="toggleTip(meal.id)"
                  >
                    {{ mealDensity(meal)!.info.short }}
                  </button>
                  <div
                    class="absolute right-0 top-full z-20 mt-1 w-72 rounded-xl border border-gray-200 bg-white p-3 text-[11px] leading-relaxed text-gray-700 shadow-lg"
                    :class="openTip === meal.id ? 'block' : 'hidden group-hover:block'"
                  >
                    {{ mealDensity(meal)!.explanation }}
                  </div>
                </div>
              </div>
              <p class="text-xs text-gray-400">
                {{ meal.quantity }} {{ UNIT_LABELS[meal.unit] || meal.unit }}<template v-if="meal.estimated_grams"> ≈ {{ Math.round(Number(meal.estimated_grams)) }} g</template>
              </p>
            </div>
            <span class="shrink-0 text-sm font-medium tabular-nums text-gray-700">{{ meal.estimated_calories }} kcal</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Day distribution -->
    <div v-if="densityStats.hasAny" class="mt-4 rounded-2xl border border-gray-100 bg-white p-4">
      <div class="mb-2 flex items-center justify-between">
        <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Densidad calórica del día</p>
        <button class="text-[11px] font-medium text-emerald-600 hover:underline" @click="showLegend = !showLegend">
          {{ showLegend ? 'Ocultar' : '¿Qué es esto?' }}
        </button>
      </div>

      <div class="flex h-4 overflow-hidden rounded-full bg-gray-100">
        <div
          v-for="k in DENSITY_ORDER"
          :key="k"
          v-show="densityStats.pct(k) > 0"
          class="flex items-center justify-center text-[9px] font-bold text-white transition-all duration-500"
          :class="DENSITY_INFO[k].dot"
          :style="{ width: `${densityStats.pct(k)}%` }"
          :title="`${DENSITY_INFO[k].label}: ${densityStats.st[k].kcal} kcal (${densityStats.pct(k)}%)`"
        >
          <span v-if="densityStats.pct(k) >= 15">{{ densityStats.pct(k) }}%</span>
        </div>
      </div>

      <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span v-for="k in DENSITY_ORDER" :key="k" v-show="densityStats.st[k].n" class="flex items-center gap-1" :title="DENSITY_INFO[k].advice">
          <span class="h-2.5 w-2.5 rounded-full" :class="DENSITY_INFO[k].dot" />
          {{ densityStats.st[k].n }} {{ DENSITY_INFO[k].short.toLowerCase() }}{{ densityStats.st[k].n > 1 ? 's' : '' }}
          <span class="text-gray-400">({{ densityStats.st[k].kcal }} kcal)</span>
        </span>
      </div>

      <Transition name="fade">
        <div v-if="showLegend" class="mt-3 space-y-2 rounded-xl bg-gray-50 p-3 text-[12px] leading-relaxed text-gray-600">
          <p v-for="k in DENSITY_ORDER" :key="k">
            <span class="mr-1 inline-block h-3 w-3 rounded-full align-middle" :class="DENSITY_INFO[k].dot" />
            <b>{{ DENSITY_INFO[k].label }}</b> ({{ DENSITY_INFO[k].range }}) — {{ DENSITY_INFO[k].examples }}. {{ DENSITY_INFO[k].advice }}
          </p>
          <p class="pt-1 text-[11px] italic text-gray-400">💡 {{ DENSITY_RULE }}</p>
        </div>
      </Transition>
    </div>
  </div>

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
