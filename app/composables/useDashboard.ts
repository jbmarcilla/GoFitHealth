export function useDashboard() {
  const todayStr = new Date().toISOString().split('T')[0]
  const selectedDate = ref(todayStr)

  const { data: dayStatus, refresh: refreshDay, status: dayFetchStatus } = useFetch('/api/summary/today', {
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

  const dayLoading = computed(() => dayFetchStatus.value === 'pending')

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

  const { data: weekStatus } = useFetch('/api/summary/week', {
    lazy: true,
    query: computed(() => ({ from: weekDays.value[0], to: weekDays.value[6] })),
    watch: [weekDays],
    default: () => [] as Array<{ date: string; met: boolean | null; remaining: number | null }>,
  })

  const shift = (date: string, days: number) => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  }

  function selectDate(date: string) {
    if (date <= todayStr) selectedDate.value = date
  }
  // Previous week lands on its last day (Sunday), next week on its first (Monday).
  function prevWeek() {
    selectedDate.value = shift(weekDays.value[0], -1)
  }
  function nextWeek() {
    const monday = shift(weekDays.value[6], 1)
    selectedDate.value = monday <= todayStr ? monday : todayStr
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
    dayLoading,
    weekStatus,
    progress,
    selectDate,
    prevWeek,
    nextWeek,
    goToToday,
    refresh,
  }
}
