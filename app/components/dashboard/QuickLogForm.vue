<script setup lang="ts">
const emit = defineEmits<{
  logged: []
}>()

const activeTab = ref<'weight' | 'meal' | 'water' | 'exercise'>('weight')
const loading = ref(false)
const success = ref('')

const weight = ref<number | null>(null)
const meal = ref({
  meal_type: 'lunch' as string,
  food_name: '',
  quantity: 1,
  unit: 'porcion' as string,
  estimated_calories: 0,
})
const exercise = ref({
  exercise_name: '',
  duration_minutes: 30,
  calories_burned: 0,
})

async function submitWeight() {
  if (!weight.value) return
  loading.value = true
  await $fetch('/api/weight', { method: 'POST', body: { weight_kg: weight.value } })
  weight.value = null
  showSuccess('Peso registrado')
}

async function submitMeal() {
  if (!meal.value.food_name) return
  loading.value = true
  await $fetch('/api/meals', { method: 'POST', body: meal.value })
  meal.value = { meal_type: 'lunch', food_name: '', quantity: 1, unit: 'porcion', estimated_calories: 0 }
  showSuccess('Comida registrada')
}

async function submitWater(ml: number) {
  loading.value = true
  await $fetch('/api/water', { method: 'POST', body: { amount_ml: ml } })
  showSuccess(`+${ml}ml de agua`)
}

async function submitExercise() {
  if (!exercise.value.exercise_name) return
  loading.value = true
  await $fetch('/api/exercises', { method: 'POST', body: exercise.value })
  exercise.value = { exercise_name: '', duration_minutes: 30, calories_burned: 0 }
  showSuccess('Ejercicio registrado')
}

function showSuccess(msg: string) {
  loading.value = false
  success.value = msg
  emit('logged')
  setTimeout(() => { success.value = '' }, 2000)
}

const tabs = [
  { key: 'weight' as const, label: '⚖️ Peso' },
  { key: 'meal' as const, label: '🍽️ Comida' },
  { key: 'water' as const, label: '💧 Agua' },
  { key: 'exercise' as const, label: '🏃 Ejercicio' },
]
</script>

<template>
  <div class="card">
    <p class="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">Registrar ahora</p>
    <div class="flex items-center gap-2 mb-4 overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border"
        :class="activeTab === tab.key
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-200 text-gray-500 hover:border-gray-300'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div
      v-if="success"
      class="mb-4 p-3 bg-emerald-50 text-emerald-700 text-sm rounded-xl font-medium"
    >
      ✓ {{ success }}
    </div>

    <!-- Weight -->
    <form v-if="activeTab === 'weight'" class="flex gap-3" @submit.prevent="submitWeight">
      <input
        v-model.number="weight"
        type="number"
        step="0.1"
        min="20"
        max="300"
        placeholder="Peso en kg"
        class="input flex-1"
        required
      >
      <button type="submit" class="btn-primary" :disabled="loading">
        Registrar
      </button>
    </form>

    <!-- Meal -->
    <form v-if="activeTab === 'meal'" class="space-y-3" @submit.prevent="submitMeal">
      <div class="grid grid-cols-2 gap-3">
        <select v-model="meal.meal_type" class="input">
          <option value="breakfast">Desayuno</option>
          <option value="lunch">Almuerzo</option>
          <option value="dinner">Cena</option>
          <option value="snack">Snack</option>
        </select>
        <input
          v-model="meal.food_name"
          type="text"
          placeholder="Alimento"
          class="input"
          required
        >
      </div>
      <div class="grid grid-cols-3 gap-3">
        <input
          v-model.number="meal.quantity"
          type="number"
          step="0.5"
          min="0.1"
          placeholder="Cantidad"
          class="input"
        >
        <select v-model="meal.unit" class="input">
          <option value="porcion">Porción</option>
          <option value="g">Gramos</option>
          <option value="puno">Puño</option>
          <option value="taza">Taza</option>
          <option value="mano">Mano</option>
          <option value="cucharada">Cucharada</option>
          <option value="ml">ml</option>
        </select>
        <input
          v-model.number="meal.estimated_calories"
          type="number"
          min="0"
          placeholder="kcal (aprox)"
          class="input"
        >
      </div>
      <button type="submit" class="btn-primary w-full" :disabled="loading">
        Registrar comida
      </button>
    </form>

    <!-- Water -->
    <div v-if="activeTab === 'water'" class="flex flex-wrap gap-3">
      <button
        v-for="ml in [250, 500, 750, 1000]"
        :key="ml"
        class="btn-secondary flex-1 min-w-[100px] justify-center"
        :disabled="loading"
        @click="submitWater(ml)"
      >
        {{ ml >= 1000 ? `${ml / 1000}L` : `${ml}ml` }}
      </button>
    </div>

    <!-- Exercise -->
    <form v-if="activeTab === 'exercise'" class="space-y-3" @submit.prevent="submitExercise">
      <input
        v-model="exercise.exercise_name"
        type="text"
        placeholder="Ejercicio (ej: correr, pesas)"
        class="input"
        required
      >
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">Duración (min)</label>
          <input
            v-model.number="exercise.duration_minutes"
            type="number"
            min="1"
            class="input"
          >
        </div>
        <div>
          <label class="label">Calorías quemadas</label>
          <input
            v-model.number="exercise.calories_burned"
            type="number"
            min="0"
            class="input"
          >
        </div>
      </div>
      <button type="submit" class="btn-primary w-full" :disabled="loading">
        Registrar ejercicio
      </button>
    </form>
  </div>
</template>
