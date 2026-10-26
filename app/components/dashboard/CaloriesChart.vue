<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { formatDate } from '~/utils/format'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps<{
  data: Array<{ date: string; calories_in: number; calories_out: number }>
}>()

const chartData = computed(() => ({
  labels: props.data.map(d => formatDate(d.date)),
  datasets: [
    {
      label: 'Consumidas',
      data: props.data.map(d => d.calories_in),
      backgroundColor: 'rgba(16, 185, 129, 0.7)',
      borderRadius: 6,
    },
    {
      label: 'Quemadas',
      data: props.data.map(d => d.calories_out),
      backgroundColor: 'rgba(249, 115, 22, 0.7)',
      borderRadius: 6,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: { font: { size: 12 }, usePointStyle: true, pointStyle: 'circle' },
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y} kcal`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 } },
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: {
        font: { size: 11 },
        callback: (v: any) => `${v} kcal`,
      },
    },
  },
}
</script>

<template>
  <div class="card">
    <h3 class="text-xs font-medium uppercase tracking-wider text-gray-400 mb-4">🔥 Calorías — esta semana</h3>
    <div v-if="data.length" class="h-64">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
    <p v-else class="text-sm text-gray-400 text-center py-12">
      Sin datos de calorías esta semana.
    </p>
  </div>
</template>
