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
  targetKg?: number | null
}>()

const chartData = computed(() => {
  const datasets: any[] = [
    {
      label: 'Peso (kg)',
      data: props.data.map(d => d.weight_kg),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.08)',
      fill: true,
      tension: 0.35,
      pointRadius: 4,
      pointBackgroundColor: '#10b981',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverRadius: 6,
    },
  ]

  if (props.targetKg && props.data.length) {
    datasets.push({
      label: 'Meta',
      data: props.data.map(() => props.targetKg),
      borderColor: '#f59e0b',
      borderDash: [8, 4],
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: false,
      tension: 0,
    })
  }

  return {
    labels: props.data.map(d => formatDate(d.date)),
    datasets,
  }
})

const chartOptions = computed(() => {
  const weights = props.data.map(d => d.weight_kg)
  const allValues = [...weights]
  if (props.targetKg) allValues.push(props.targetKg)
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)
  const padding = Math.max(1, (max - min) * 0.15)

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y} kg`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 7, font: { size: 11 }, color: '#9ca3af' },
        border: { display: false },
      },
      y: {
        min: Math.floor(min - padding),
        max: Math.ceil(max + padding),
        grid: { color: 'rgba(0,0,0,0.04)' },
        border: { display: false },
        ticks: {
          font: { size: 11 },
          color: '#9ca3af',
          callback: (v: any) => `${v}`,
        },
      },
    },
  }
})

const latestKg = computed(() => props.data.length ? props.data[props.data.length - 1].weight_kg : null)
const diff = computed(() => {
  if (!latestKg.value || !props.targetKg) return null
  return Math.abs(latestKg.value - props.targetKg).toFixed(1)
})
</script>

<template>
  <div class="rounded-2xl border border-gray-100 bg-white p-5">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400">⚖️ Peso</h3>
      <div v-if="latestKg" class="flex items-center gap-2 text-sm">
        <span class="font-bold tabular-nums text-gray-900">{{ latestKg }} kg</span>
        <span v-if="targetKg" class="text-xs text-gray-400">
          meta {{ targetKg }} kg
          <span v-if="diff" class="text-amber-500">(faltan {{ diff }})</span>
        </span>
      </div>
    </div>
    <div v-if="data.length >= 2" class="h-56">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <div v-else-if="data.length === 1" class="flex flex-col items-center py-8 text-center">
      <p class="text-4xl font-bold text-gray-900">{{ data[0].weight_kg }} kg</p>
      <p class="mt-1 text-sm text-gray-400">Primer registro. Sigue pesándote para ver tu progreso.</p>
    </div>
    <p v-else class="py-10 text-center text-sm text-gray-400">
      Sin registros de peso. Pésate hoy para empezar.
    </p>
  </div>
</template>
