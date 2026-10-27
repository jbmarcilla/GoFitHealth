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

type Weigh = { date: string; weight_kg: number }

const props = defineProps<{
  data: Weigh[]
  targetKg?: number | null
  weeksToGoal?: number | null
  weightOfDay?: number | null
  isToday?: boolean
}>()

const points = computed(() => props.data.map(d => ({ date: d.date, kg: Number(d.weight_kg) })))
const latest = computed(() => points.value.at(-1) ?? null)
const previous = computed(() => points.value.at(-2) ?? null)
const start = computed(() => points.value[0] ?? null)

const lastChange = computed(() => (latest.value && previous.value ? latest.value.kg - previous.value.kg : null))
const delta30 = computed(() => (latest.value && start.value && points.value.length > 1 ? latest.value.kg - start.value.kg : null))
const toGoal = computed(() => (latest.value && props.targetKg ? props.targetKg - latest.value.kg : null))

const progressPct = computed(() => {
  if (!latest.value || !start.value || !props.targetKg) return null
  const total = Math.abs(start.value.kg - props.targetKg)
  if (total < 0.1) return 100
  const done = start.value.kg - latest.value.kg
  const towards = start.value.kg > props.targetKg ? done : -done
  return Math.max(0, Math.min(100, Math.round((towards / total) * 100)))
})

function addDays(date: string, days: number) {
  const d = new Date(date + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// Straight path from the last weigh-in to the goal at the estimated arrival date.
const projection = computed(() => {
  if (!latest.value || !props.targetKg || !props.weeksToGoal || props.weeksToGoal <= 0) return [] as Array<{ date: string; kg: number }>
  const weeks = props.weeksToGoal
  const steps = Math.min(weeks, 10)
  const stepWeeks = weeks / steps
  const diff = props.targetKg - latest.value.kg
  return Array.from({ length: steps }, (_, i) => {
    const t = (i + 1) / steps
    return { date: addDays(latest.value!.date, Math.round(stepWeeks * (i + 1) * 7)), kg: Math.round((latest.value!.kg + diff * t) * 10) / 10 }
  })
})

const arrivalDate = computed(() => projection.value.at(-1)?.date ?? null)

const chartData = computed(() => {
  const real = points.value
  const proj = projection.value
  const labels = [...real.map(p => p.date), ...proj.map(p => p.date)]
  const n = labels.length

  const datasets: any[] = [
    {
      label: 'Peso',
      data: [...real.map(p => p.kg), ...proj.map(() => null)],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.10)',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: '#10b981',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverRadius: 6,
      spanGaps: false,
    },
  ]

  if (proj.length && latest.value) {
    datasets.push({
      label: 'Proyección',
      data: [...real.map((_, i) => (i === real.length - 1 ? latest.value!.kg : null)), ...proj.map(p => p.kg)],
      borderColor: '#34d399',
      borderDash: [3, 5],
      borderWidth: 2,
      pointRadius: (ctx: any) => (ctx.dataIndex === n - 1 ? 5 : 0),
      pointBackgroundColor: '#f59e0b',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverRadius: 6,
      fill: false,
      tension: 0,
      spanGaps: false,
    })
  }

  if (props.targetKg) {
    datasets.push({
      label: 'Meta',
      data: labels.map(() => props.targetKg),
      borderColor: '#f59e0b',
      borderDash: [8, 4],
      borderWidth: 1.5,
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: false,
      tension: 0,
    })
  }

  return { labels: labels.map(formatDate), datasets }
})

const chartOptions = computed(() => {
  const all = points.value.map(p => p.kg)
  if (props.targetKg) all.push(props.targetKg)
  const min = Math.min(...all)
  const max = Math.max(...all)
  const pad = Math.max(0.8, (max - min) * 0.2)

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      tooltip: {
        filter: (item: any) => item.parsed.y !== null,
        callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y} kg` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 6, font: { size: 10 }, color: '#9ca3af', maxRotation: 0 },
        border: { display: false },
      },
      y: {
        min: Math.floor((min - pad) * 2) / 2,
        max: Math.ceil((max + pad) * 2) / 2,
        grid: { color: 'rgba(0,0,0,0.04)' },
        border: { display: false },
        ticks: { font: { size: 10 }, color: '#9ca3af', stepSize: 1 },
      },
    },
  }
})

const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(1)}`
const tone = (n: number | null) => {
  if (n === null || Math.abs(n) < 0.05) return 'text-gray-400'
  const good = props.targetKg && latest.value ? (props.targetKg < latest.value.kg ? n < 0 : n > 0) : n < 0
  return good ? 'text-emerald-600' : 'text-amber-600'
}
</script>

<template>
  <div class="rounded-2xl border border-gray-100 bg-white px-4 py-4">
    <div class="flex items-center justify-between">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">⚖️ Peso</p>
      <span v-if="delta30 !== null" class="text-xs tabular-nums" :class="tone(delta30)">
        {{ signed(delta30) }} kg en 30 días
      </span>
    </div>

    <div class="mt-2 flex items-end justify-between gap-3">
      <div>
        <p class="text-3xl font-bold tabular-nums leading-none text-gray-900">
          <template v-if="latest">{{ latest.kg.toFixed(1) }}<span class="text-sm font-normal text-gray-400"> kg</span></template>
          <template v-else>—</template>
        </p>
        <p v-if="lastChange !== null && previous" class="mt-1.5 text-xs tabular-nums" :class="tone(lastChange)">
          {{ lastChange > 0 ? '▲' : lastChange < 0 ? '▼' : '▬' }} {{ signed(lastChange) }} kg desde el {{ formatDate(previous.date) }}
        </p>
        <p v-else-if="latest" class="mt-1.5 text-xs text-gray-400">Primer registro · pésate mañana para ver cómo varía</p>
        <p v-else class="mt-1.5 text-xs text-gray-400">Dile a tu IA cuánto pesas hoy.</p>
      </div>

      <div v-if="targetKg" class="text-right">
        <p class="text-[11px] text-gray-400">Meta</p>
        <p class="text-lg font-semibold tabular-nums leading-none text-amber-600">{{ targetKg.toFixed(1) }} <span class="text-xs font-normal">kg</span></p>
        <p v-if="toGoal !== null" class="mt-1 text-[11px] tabular-nums text-gray-500">
          faltan {{ Math.abs(toGoal).toFixed(1) }} kg<template v-if="weeksToGoal"> · ≈ {{ weeksToGoal }} sem</template>
        </p>
      </div>
      <NuxtLink v-else to="/settings" class="text-xs text-emerald-600 hover:underline">Definir meta →</NuxtLink>
    </div>

    <div v-if="latest" class="mt-4 h-52">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <div v-if="latest" class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-400">
      <span class="flex items-center gap-1"><span class="h-0.5 w-4 rounded bg-emerald-500" /> Tus pesadas</span>
      <span v-if="projection.length" class="flex items-center gap-1"><span class="h-0.5 w-4 rounded border-t-2 border-dotted border-emerald-400" /> Proyección</span>
      <span v-if="targetKg" class="flex items-center gap-1"><span class="h-0.5 w-4 rounded border-t-2 border-dashed border-amber-500" /> Meta</span>
      <span v-if="arrivalDate" class="ml-auto text-amber-600">🎯 ≈ {{ formatDate(arrivalDate) }}</span>
    </div>

    <template v-if="progressPct !== null">
      <div class="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
        <div class="h-full rounded-full bg-emerald-500 transition-all duration-700" :style="{ width: `${progressPct}%` }" />
      </div>
      <div class="mt-1 flex justify-between text-[10px] tabular-nums text-gray-400">
        <span>{{ start?.kg.toFixed(1) }} kg</span>
        <span>{{ progressPct }}% del camino</span>
        <span>{{ targetKg?.toFixed(1) }} kg</span>
      </div>
    </template>

    <p v-if="latest && !weightOfDay && isToday" class="mt-2 text-xs text-amber-600">Hoy aún no te pesaste · mostrando tu último registro</p>
    <p v-if="latest && points.length >= 2" class="mt-2 text-[11px] leading-relaxed text-gray-400">
      El peso sube y baja hasta ±1 kg de un día a otro por agua y digestión. Mira la tendencia, no el día.
    </p>
  </div>
</template>
