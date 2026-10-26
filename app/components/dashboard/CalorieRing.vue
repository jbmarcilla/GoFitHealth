<script setup lang="ts">
interface Plan {
  auto: boolean
  method: 'mifflin' | 'approx'
  tdee: number
  bmr: number
  adjustment: number
  direction: 'lose' | 'gain' | 'maintain'
  weeks_to_goal: number | null
  kg_to_goal: number
  missing: string[]
}

const props = defineProps<{
  consumed: number
  goal: number | null
  burned: number
  plan?: Plan | null
}>()

const showHow = ref(false)
const planText = computed(() => {
  const p = props.plan
  if (!p) return ''
  const gasto = `Tu cuerpo gasta ≈ ${p.tdee.toLocaleString('es-PE')} kcal al día${p.method === 'mifflin' ? ' (metabolismo basal × tu actividad)' : ' (estimado solo por tu peso)'}`
  if (p.direction === 'lose') return `${gasto}. Comer ${Math.abs(p.adjustment)} kcal menos baja ≈ ${(Math.abs(p.adjustment) * 7 / 7700).toFixed(1)} kg por semana${p.weeks_to_goal ? `, llegarías en ≈ ${p.weeks_to_goal} semanas` : ''}. Cada vez que te pesas, el máximo se recalcula y el déficit se suaviza al acercarte.`
  if (p.direction === 'gain') return `${gasto}. Con ${p.adjustment} kcal extra subes gradual${p.weeks_to_goal ? ` (≈ ${p.weeks_to_goal} semanas)` : ''}. Se recalcula con cada pesada.`
  return `${gasto}. Comer alrededor de eso mantiene tu peso.`
})

const R = 46
const C = 2 * Math.PI * R

const pct = computed(() => (props.goal ? (props.consumed / props.goal) * 100 : 0))
const dash = computed(() => (Math.min(100, pct.value) / 100) * C)

const remaining = computed(() => (props.goal ? props.goal - props.consumed + props.burned : 0))
const isOver = computed(() => props.goal !== null && remaining.value < 0)
const net = computed(() => props.consumed - props.burned)

const ringColor = computed(() => {
  if (!props.goal) return '#d1d5db'
  if (pct.value > 110) return '#ef4444'
  if (pct.value > 100) return '#f59e0b'
  return '#10b981'
})

const barColor = computed(() => {
  if (pct.value > 110) return 'bg-red-400'
  if (pct.value > 100) return 'bg-amber-400'
  if (pct.value > 85) return 'bg-emerald-500'
  return 'bg-emerald-400'
})

const fmt = (n: number) => Math.abs(n).toLocaleString('es-PE')
</script>

<template>
  <div>
    <!-- With goal -->
    <template v-if="goal">
      <p class="mb-3 text-center text-[10px] font-medium uppercase tracking-wider text-gray-400">
        Restante = Meta − Comida + Ejercicio
      </p>
      <div class="flex items-center gap-5">
        <div class="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 120 120" class="h-full w-full -rotate-90">
            <circle cx="60" cy="60" :r="R" fill="none" stroke="#f3f4f6" stroke-width="10" />
            <circle
              cx="60" cy="60" :r="R"
              fill="none"
              :stroke="ringColor"
              stroke-width="10"
              stroke-linecap="round"
              :stroke-dasharray="`${dash} ${C}`"
              class="transition-all duration-700"
            />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <p class="text-2xl font-bold tabular-nums" :class="isOver ? 'text-red-600' : 'text-gray-900'">
              {{ fmt(remaining) }}
            </p>
            <p class="text-[11px]" :class="isOver ? 'text-red-400' : 'text-gray-400'">
              {{ isOver ? 'Exceso' : 'Restante' }}
            </p>
          </div>
        </div>

        <div class="flex-1 space-y-2.5 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-gray-500">🎯 Meta</span>
            <span class="font-semibold tabular-nums text-gray-900">{{ fmt(goal) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-500">🍴 Comida</span>
            <span class="font-semibold tabular-nums text-gray-900">−{{ fmt(consumed) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-500">🔥 Ejercicio</span>
            <span class="font-semibold tabular-nums" :class="burned > 0 ? 'text-emerald-600' : 'text-gray-400'">
              +{{ fmt(burned) }}
            </span>
          </div>
          <div class="border-t border-gray-100 pt-2">
            <div class="flex items-center justify-between">
              <span class="font-medium text-gray-700">= {{ isOver ? 'Exceso' : 'Restante' }}</span>
              <span class="font-bold tabular-nums" :class="isOver ? 'text-red-600' : 'text-emerald-600'">
                {{ isOver ? '−' : '' }}{{ fmt(remaining) }} kcal
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Max bar -->
      <div class="mt-5">
        <div class="mb-1 flex items-center justify-between text-[11px] text-gray-400">
          <span>Consumido</span>
          <span>Máximo del día: <b class="text-gray-600">{{ fmt(goal) }} kcal</b></span>
        </div>
        <div v-if="plan?.auto" class="mb-2 rounded-xl bg-emerald-50/60 px-3 py-2 text-[11px] leading-relaxed text-emerald-800">
          <button class="flex w-full items-center justify-between font-medium" @click="showHow = !showHow">
            <span>🧮 Calculado con tu peso{{ plan.method === 'approx' ? ' (aprox.)' : '' }} · se ajusta en cada pesada</span>
            <span>{{ showHow ? '▲' : '¿cómo? ▼' }}</span>
          </button>
          <p v-if="showHow" class="mt-1.5 text-emerald-900/80">{{ planText }}</p>
          <p v-if="showHow && plan.missing.length" class="mt-1 text-amber-700">
            Para afinarlo, dile a tu IA tu {{ plan.missing.map(m => ({ height_cm: 'estatura', birth_year: 'edad', sex: 'sexo' })[m]).join(', ') }} y cuánto te mueves a la semana.
          </p>
        </div>
        <div class="relative h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            class="h-full rounded-full transition-all duration-700"
            :class="barColor"
            :style="{ width: `${Math.min(100, pct)}%` }"
          />
          <div v-if="pct > 100" class="absolute inset-y-0 right-0 w-1 bg-red-600" />
        </div>
        <div class="mt-1 flex justify-between text-[11px] tabular-nums">
          <span class="font-medium text-gray-700">{{ fmt(consumed) }} kcal ({{ Math.round(pct) }}%)</span>
          <span v-if="pct > 100" class="text-red-500">+{{ fmt(consumed - goal) }} sobre el máximo</span>
          <span v-else class="text-gray-400">faltan {{ fmt(goal - consumed) }} al máximo</span>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-center text-sm">
        <span v-if="remaining > 0" class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
          ✅ <span class="font-medium">En déficit — te quedan {{ fmt(remaining) }} kcal</span>
        </span>
        <span v-else-if="isOver" class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-800">
          🌱 <span class="font-medium">Te pasaste {{ fmt(remaining) }} kcal. No pasa nada, mañana equilibras.</span>
        </span>
        <span v-else class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
          🎯 <span class="font-medium">Justo en la meta</span>
        </span>
      </div>
    </template>

    <!-- Without goal -->
    <template v-else>
      <div class="flex items-center gap-5">
        <div class="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 120 120" class="h-full w-full">
            <circle cx="60" cy="60" :r="R" fill="none" stroke="#f3f4f6" stroke-width="10" />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <p class="text-2xl font-bold tabular-nums text-gray-900">{{ fmt(net) }}</p>
            <p class="text-[11px] text-gray-400">netas</p>
          </div>
        </div>
        <div class="flex-1 space-y-2.5 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-gray-500">🍴 Comida</span>
            <span class="font-semibold tabular-nums text-gray-900">{{ fmt(consumed) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-500">🔥 Ejercicio</span>
            <span class="font-semibold tabular-nums" :class="burned > 0 ? 'text-emerald-600' : 'text-gray-400'">
              −{{ fmt(burned) }}
            </span>
          </div>
          <div class="border-t border-gray-100 pt-2">
            <div class="flex items-center justify-between">
              <span class="font-medium text-gray-700">= Neto</span>
              <span class="font-bold tabular-nums text-gray-900">{{ fmt(net) }} kcal</span>
            </div>
          </div>
        </div>
      </div>
      <NuxtLink
        to="/settings"
        class="mt-4 flex items-center justify-between rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 px-3 py-2.5 text-sm text-emerald-700 transition hover:bg-emerald-50"
      >
        <span>⚖️ Registra tu peso y tu máximo diario se calcula solo</span>
        <span>→</span>
      </NuxtLink>
    </template>
  </div>
</template>
