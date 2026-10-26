<script setup lang="ts">
const props = defineProps<{
  weekDays: string[]
  selectedDate: string
  today: string
  status?: Array<{ date: string; met: boolean | null; remaining: number | null }>
}>()

const byDate = computed(() => Object.fromEntries((props.status ?? []).map(s => [s.date, s])))
function mark(date: string) {
  const s = byDate.value[date]
  if (!s || s.met === null) return null
  return s.met
    ? { icon: '✓', cls: 'bg-emerald-500 text-white', title: `Dentro del máximo · quedaron ${s.remaining} kcal` }
    : { icon: '+', cls: 'bg-amber-400 text-white', title: `Te pasaste ${Math.abs(s.remaining ?? 0)} kcal` }
}

const emit = defineEmits<{
  select: [date: string]
  prev: []
  next: []
}>()

const DAY_NAMES = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const monthLabel = computed(() => {
  const d = new Date(props.weekDays[0] + 'T12:00:00')
  const d2 = new Date(props.weekDays[6] + 'T12:00:00')
  const m1 = d.toLocaleDateString('es-PE', { month: 'short' })
  const m2 = d2.toLocaleDateString('es-PE', { month: 'short' })
  return m1 === m2 ? m1 : `${m1} – ${m2}`
})
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <p class="text-xs font-medium capitalize text-gray-400">{{ monthLabel }}</p>
    <div class="flex w-full items-center gap-1">
      <button
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        @click="emit('prev')"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>

      <div class="grid flex-1 grid-cols-7 gap-0.5">
        <div v-for="(date, i) in weekDays" :key="date" class="flex flex-col items-center gap-1">
          <span class="text-[10px] font-semibold tracking-wider text-gray-400">{{ DAY_NAMES[i] }}</span>
          <button
            class="relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-all"
            :title="mark(date)?.title"
            :class="[
              date === selectedDate
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                : date === today && date !== selectedDate
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : date > today
                    ? 'text-gray-300 cursor-default'
                    : 'text-gray-700 hover:bg-gray-100'
            ]"
            :disabled="date > today"
            @click="emit('select', date)"
          >
            {{ new Date(date + 'T12:00:00').getDate() }}
            <span
              v-if="mark(date)"
              class="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold leading-none"
              :class="mark(date)!.cls"
            >{{ mark(date)!.icon }}</span>
          </button>
        </div>
      </div>

      <button
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        :class="{ 'opacity-30 pointer-events-none': weekDays[6] >= today }"
        @click="emit('next')"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </button>
    </div>
  </div>
</template>
