<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { formatDate } from '~/utils/format'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const props = defineProps<{
  data: Array<{ date: string; weight_kg: number }>
}>()

const chartData = computed(() => ({
  labels: props.data.map(d => formatDate(d.date)),
  datasets: [
    {
      label: 'Peso (kg)',
      data: props.data.map(d => d.weight_kg),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: '#10b981',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    tooltip: {
      callbacks: {
        label: (ctx: any) => `${ctx.parsed.y} kg`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { maxTicksLimit: 7, font: { size: 11 } },
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: {
        font: { size: 11 },
        callback: (v: any) => `${v} kg`,
      },
    },
  },
}
</script>

<template>
  <div class="card">
    <h3 class="font-semibold text-gray-900 mb-4">⚖️ Peso — últimos 30 días</h3>
    <div v-if="data.length" class="h-64">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <p v-else class="text-sm text-gray-400 text-center py-12">
      Sin registros de peso aún. ¡Empieza hoy!
    </p>
  </div>
</template>
