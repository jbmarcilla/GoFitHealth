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
  caloric_density?: 'green' | 'yellow' | 'red'
  foods?: { food_category?: string } | null
}

const props = defineProps<{ meals: Meal[] }>()

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍿',
}

const FOOD_KEYWORDS: [string, string][] = [
  ['arroz', '🍚'], ['pollo', '🍗'], ['huevo', '🥚'], ['leche', '🥛'],
  ['pan', '🍞'], ['avena', '🥣'], ['carne', '🥩'], ['pescado', '🐟'],
  ['atún', '🐟'], ['salmón', '🐟'], ['manzana', '🍎'], ['plátano', '🍌'],
  ['banana', '🍌'], ['café', '☕'], ['yogurt', '🥛'], ['queso', '🧀'],
  ['pasta', '🍝'], ['fideos', '🍝'], ['sopa', '🍲'], ['ensalada', '🥗'],
  ['hamburguesa', '🍔'], ['pizza', '🍕'], ['sandwich', '🥪'], ['taco', '🌮'],
  ['fruta', '🍎'], ['jugo', '🧃'], ['agua', '💧'], ['galleta', '🍪'],
  ['torta', '🎂'], ['helado', '🍦'], ['papa', '🥔'], ['batata', '🍠'],
  ['brócoli', '🥦'], ['tomate', '🍅'], ['zanahoria', '🥕'], ['maíz', '🌽'],
  ['aguacate', '🥑'], ['palta', '🥑'], ['cerdo', '🥓'], ['tocino', '🥓'],
  ['camarón', '🦐'], ['almendra', '🥜'], ['maní', '🥜'], ['nuez', '🥜'],
]

const CATEGORY_ICONS: Record<string, string> = {
  protein: '🥩', grains: '🌾', vegetables: '🥦', fruits: '🍎',
  dairy: '🥛', fats: '🫒', nuts: '🥜', snacks: '🍪', liquids: '🥤',
}

function foodIcon(meal: Meal): string {
  const lower = meal.food_name.toLowerCase()
  for (const [kw, icon] of FOOD_KEYWORDS) {
    if (lower.includes(kw)) return icon
  }
  const cat = meal.foods?.food_category
  if (cat && CATEGORY_ICONS[cat]) return CATEGORY_ICONS[cat]
  return '🍽️'
}

const DENSITY_DOT: Record<string, string> = {
  green: 'bg-emerald-400',
  yellow: 'bg-amber-400',
  red: 'bg-rose-400',
}

interface MealGroup {
  type: string
  meals: Meal[]
  kcal: number
  protein: number
  carbs: number
  fat: number
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
      protein: items.reduce((s, m) => s + Number(m.estimated_protein ?? 0), 0),
      carbs: items.reduce((s, m) => s + Number(m.estimated_carbs ?? 0), 0),
      fat: items.reduce((s, m) => s + Number(m.estimated_fat ?? 0), 0),
    })
  }
  return result
})

const totalCalories = computed(() => props.meals.reduce((s, m) => s + m.estimated_calories, 0))
</script>

<template>
  <div v-if="meals.length" class="space-y-4">
    <div v-for="g in groups" :key="g.type" class="rounded-2xl border border-gray-100 bg-white">
      <!-- Group header -->
      <div class="flex items-center justify-between border-b border-gray-50 px-4 py-3">
        <div class="flex items-center gap-2">
          <span class="text-lg">{{ MEAL_ICONS[g.type] || '🍽️' }}</span>
          <span class="text-sm font-semibold text-gray-900">{{ MEAL_LABELS[g.type] || g.type }}</span>
        </div>
        <div class="text-right">
          <span class="text-sm font-bold tabular-nums text-gray-900">{{ g.kcal }} kcal</span>
          <p class="text-[11px] tabular-nums text-gray-400">
            {{ Math.round(g.protein) }}P · {{ Math.round(g.carbs) }}C · {{ Math.round(g.fat) }}G
          </p>
        </div>
      </div>

      <!-- Food items -->
      <div class="divide-y divide-gray-50">
        <div v-for="meal in g.meals" :key="meal.id" class="flex items-center gap-3 px-4 py-2.5">
          <span class="text-lg">{{ foodIcon(meal) }}</span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm text-gray-800">{{ meal.food_name }}</p>
            <p class="text-xs text-gray-400">
              {{ meal.quantity }} {{ UNIT_LABELS[meal.unit] || meal.unit }}
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span
              v-if="meal.caloric_density"
              class="h-2 w-2 rounded-full"
              :class="DENSITY_DOT[meal.caloric_density]"
              :title="meal.caloric_density"
            />
            <span class="text-sm font-medium tabular-nums text-gray-700">{{ meal.estimated_calories }} kcal</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="rounded-2xl border border-dashed border-gray-200 py-12 text-center">
    <p class="text-3xl">🍽️</p>
    <p class="mt-2 text-sm text-gray-400">No hay comidas registradas.</p>
    <p class="mt-1 text-xs text-gray-300">Dile a tu IA qué comiste</p>
  </div>
</template>
