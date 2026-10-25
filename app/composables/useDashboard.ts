export function useDashboard() {
  const { data: todayStatus, refresh: refreshToday } = useFetch('/api/summary/today', {
    lazy: true,
    default: () => ({
      weight: null,
      meals: [],
      water_total_ml: 0,
      exercises: [],
      calories_in: 0,
      calories_out: 0,
      missing: [],
    }),
  })

  const { data: weekSummary, refresh: refreshWeek } = useFetch('/api/summary/weekly', {
    lazy: true,
    query: { offset: 0 },
    default: () => ({ days: [], totals: null }),
  })

  const { data: lastWeekSummary, refresh: refreshLastWeek } = useFetch('/api/summary/weekly', {
    lazy: true,
    query: { offset: -1 },
    default: () => ({ days: [], totals: null }),
    key: 'last-week-summary',
  })

  const { data: progress, refresh: refreshProgress } = useFetch('/api/summary/progress', {
    lazy: true,
    query: { days: 30 },
    default: () => ({ weights: [], daily_calories: [], period_days: 30 }),
  })

  async function refresh() {
    await Promise.all([
      refreshToday(),
      refreshWeek(),
      refreshLastWeek(),
      refreshProgress(),
    ])
  }

  return {
    todayStatus,
    weekSummary,
    lastWeekSummary,
    progress,
    refresh,
  }
}
