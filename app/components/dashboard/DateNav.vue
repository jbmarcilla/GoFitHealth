<script setup lang="ts">
const props = defineProps<{
  weekDays: string[]
  selectedDate: string
  today: string
}>()

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
            class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-all"
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
