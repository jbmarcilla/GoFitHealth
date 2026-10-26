export function useDashboard() {
  const todayStr = new Date().toISOString().split('T')[0]
  const selectedDate = ref(todayStr)

  const { data: dayStatus, refresh: refreshDay } = useFetch('/api/summary/today', {
    lazy: true,
    query: computed(() => ({ date: selectedDate.value })),
    watch: [selectedDate],
    default: () => ({
      weight: null,
      meals: [],
      water_total_ml: 0,
      exercises: [],
      calories_in: 0,
      calories_out: 0,
      missing: [] as string[],
      date: selectedDate.value,
      goal: null as any,
      nutrition: null as any,
    }),
  })

  const { data: progress, refresh: refreshProgress } = useFetch('/api/summary/progress', {
    lazy: true,
    query: { days: 30 },
    default: () => ({ weights: [], daily_calories: [], period_days: 30 }),
  })

  const weekDays = computed(() => {
    const d = new Date(selectedDate.value + 'T12:00:00')
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const monday = new Date(d)
    monday.setDate(d.getDate() + diff)
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      return date.toISOString().split('T')[0]
    })
  })

  const isToday = computed(() => selectedDate.value === todayStr)

  function selectDate(date: string) {
    if (date <= todayStr) selectedDate.value = date
  }
  function prevWeek() {
    const d = new Date(selectedDate.value + 'T12:00:00')
    d.setDate(d.getDate() - 7)
    selectedDate.value = d.toISOString().split('T')[0]
  }
  function nextWeek() {
    const d = new Date(selectedDate.value + 'T12:00:00')
    d.setDate(d.getDate() + 7)
    const next = d.toISOString().split('T')[0]
    if (next <= todayStr) selectedDate.value = next
  }
  function goToToday() {
    selectedDate.value = todayStr
  }

  async function refresh() {
    await Promise.all([refreshDay(), refreshProgress()])
  }

  return {
    selectedDate,
    todayStr,
    weekDays,
    isToday,
    dayStatus,
    progress,
    selectDate,
    prevWeek,
    nextWeek,
    goToToday,
    refresh,
  }
}
