<script setup lang="ts">
import { MEAL_LABELS, UNIT_LABELS } from '~/utils/format'

interface Meal {
  id: string
  meal_type: string
  food_name: string
  quantity: number
  unit: string
  estimated_calories: number
  caloric_density?: 'green' | 'yellow' | 'red'
}

const props = defineProps<{
  meals: Meal[]
}>()

const grouped = computed(() => {
  const groups: Record<string, Meal[]> = {}
  for (const type of ['breakfast', 'lunch', 'dinner', 'snack']) {
    const items = props.meals.filter(m => m.meal_type === type)
    if (items.length) groups[type] = items
  }
  return groups
})

const totalCalories = computed(() =>
  props.meals.reduce((sum, m) => sum + m.estimated_calories, 0),
)
</script>

<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-semibold text-gray-900">🍽️ Comidas de hoy</h3>
      <span class="text-sm font-medium text-emerald-600">{{ totalCalories }} kcal</span>
    </div>

    <div v-if="meals.length" class="space-y-4">
      <div v-for="(items, type) in grouped" :key="type">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {{ MEAL_LABELS[type] || type }}
        </p>
        <div class="space-y-2">
          <div
            v-for="meal in items"
            :key="meal.id"
            class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-sm text-gray-900 truncate">{{ meal.food_name }}</span>
              <DashboardCaloricDensityBadge
                v-if="meal.caloric_density"
                :density="meal.caloric_density"
              />
            </div>
            <div class="flex items-center gap-3 shrink-0 text-sm">
              <span class="text-gray-400">
                {{ meal.quantity }} {{ UNIT_LABELS[meal.unit] || meal.unit }}
              </span>
              <span class="font-medium text-gray-700">{{ meal.estimated_calories }} kcal</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p v-else class="text-sm text-gray-400 text-center py-8">
      No has registrado comidas hoy.
    </p>
  </div>
</template>
