<script setup lang="ts">
const route = useRoute()
const token = route.params.token as string

const { data: report, error } = await useFetch(`/api/report/${token}`)
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div v-if="error" class="card text-center py-16">
      <span class="text-4xl">🔒</span>
      <h1 class="mt-4 text-xl font-bold text-gray-900">Reporte no disponible</h1>
      <p class="mt-2 text-gray-500">Este enlace ha expirado o no es válido.</p>
      <NuxtLink to="/" class="btn-primary mt-6">Ir a GoFit</NuxtLink>
    </div>

    <template v-else-if="report">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Reporte de progreso
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            {{ report.user_name || 'Usuario GoFit' }}
          </p>
        </div>
        <span class="text-3xl">💪</span>
      </div>

      <!-- Weight Progress -->
      <section v-if="report.weights?.length" class="card mb-6">
        <h2 class="font-semibold text-gray-900 mb-4">Progreso de peso</h2>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div class="stat-card">
            <span class="text-2xl font-bold text-gray-900">{{ report.weights[0]?.weight_kg }}</span>
            <span class="text-xs text-gray-500">Inicio (kg)</span>
          </div>
          <div class="stat-card">
            <span class="text-2xl font-bold text-gray-900">{{ report.weights[report.weights.length - 1]?.weight_kg }}</span>
            <span class="text-xs text-gray-500">Actual (kg)</span>
          </div>
          <div class="stat-card">
            <span
              class="text-2xl font-bold"
              :class="(report.weights[report.weights.length - 1]?.weight_kg - report.weights[0]?.weight_kg) <= 0 ? 'text-emerald-600' : 'text-red-500'"
            >
              {{ ((report.weights[report.weights.length - 1]?.weight_kg - report.weights[0]?.weight_kg) || 0).toFixed(1) }}
            </span>
            <span class="text-xs text-gray-500">Cambio (kg)</span>
          </div>
        </div>
      </section>

      <!-- Weekly Summary -->
      <section v-if="report.summary" class="card mb-6">
        <h2 class="font-semibold text-gray-900 mb-4">Resumen semanal</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="stat-card">
            <span class="text-2xl font-bold text-gray-900">{{ Math.round(report.summary.totals.avg_calories_in) }}</span>
            <span class="text-xs text-gray-500">Kcal/día promedio</span>
          </div>
          <div class="stat-card">
            <span class="text-2xl font-bold text-gray-900">{{ Math.round(report.summary.totals.avg_water_ml) }}</span>
            <span class="text-xs text-gray-500">Agua ml/día</span>
          </div>
          <div class="stat-card">
            <span class="text-2xl font-bold text-gray-900">{{ report.summary.totals.total_exercises }}</span>
            <span class="text-xs text-gray-500">Ejercicios</span>
          </div>
          <div class="stat-card">
            <span class="text-2xl font-bold text-gray-900">{{ report.summary.totals.water_days_complete }}/7</span>
            <span class="text-xs text-gray-500">Días con agua</span>
          </div>
        </div>
      </section>

      <!-- Daily Breakdown -->
      <section v-if="report.summary?.days?.length" class="card">
        <h2 class="font-semibold text-gray-900 mb-4">Detalle por día</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 border-b">
                <th class="pb-2">Día</th>
                <th class="pb-2">Peso</th>
                <th class="pb-2">Kcal in</th>
                <th class="pb-2">Kcal out</th>
                <th class="pb-2">Agua</th>
                <th class="pb-2">Comidas</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="day in report.summary.days" :key="day.date" class="border-b border-gray-50">
                <td class="py-2">{{ new Date(day.date).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' }) }}</td>
                <td>{{ day.weight_kg ? `${day.weight_kg} kg` : '-' }}</td>
                <td>{{ day.calories_in }}</td>
                <td>{{ day.calories_out }}</td>
                <td>{{ day.water_ml }} ml</td>
                <td>{{ day.meals_count }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p class="text-center text-xs text-gray-400 mt-8">
        Generado con GoFit Health — gofit.health
      </p>
    </template>
  </div>
</template>
