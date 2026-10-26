<script setup lang="ts">
interface ExerciseEntry {
  id?: string
  exercise_name: string
  duration_minutes: number
  calories_burned: number
}

const props = defineProps<{
  exercises: ExerciseEntry[]
}>()

const totalBurned = computed(() =>
  props.exercises.reduce((sum, e) => sum + e.calories_burned, 0),
)
</script>

<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xs font-medium uppercase tracking-wider text-gray-400">🏃 Ejercicio</h3>
      <span class="text-sm font-medium text-orange-600">{{ totalBurned }} kcal</span>
    </div>

    <div v-if="exercises.length" class="space-y-2">
      <div
        v-for="(ex, i) in exercises"
        :key="ex.id || i"
        class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
      >
        <div>
          <p class="text-sm text-gray-900">{{ ex.exercise_name }}</p>
          <p class="text-xs text-gray-400">{{ ex.duration_minutes }} min</p>
        </div>
        <span class="text-sm font-medium text-gray-700">{{ ex.calories_burned }} kcal</span>
      </div>
    </div>

    <p v-else class="text-sm text-gray-400 text-center py-8">
      Sin ejercicio registrado hoy.
    </p>
  </div>
</template>
