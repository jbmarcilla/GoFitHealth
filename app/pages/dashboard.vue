<script setup lang="ts">
const user = useSupabaseUser()

watchEffect(() => {
  if (!user.value) navigateTo('/login')
})

const { todayStatus, weekSummary, lastWeekSummary, progress, refresh } = useDashboard()
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Welcome -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Hola, {{ user?.user_metadata?.full_name?.split(' ')[0] || 'ahí' }} 👋
      </h1>
      <p class="text-sm text-gray-500 mt-1">
        Aquí está tu resumen de hoy.
        <span
          v-if="todayStatus?.missing?.length"
          class="text-amber-600"
        >
          Falta registrar: {{ todayStatus.missing.join(', ') }}
        </span>
      </p>
    </div>

    <!-- Quick Log -->
    <DashboardQuickLogForm class="mb-8" @logged="refresh" />

    <!-- Stat Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <UiStatCard
        icon="⚖️"
        :value="todayStatus?.weight?.weight_kg ? `${todayStatus.weight.weight_kg} kg` : '—'"
        title="Peso hoy"
      />
      <UiStatCard
        icon="🔥"
        :value="todayStatus?.calories_in ?? 0"
        title="Calorías consumidas"
        subtitle="kcal"
      />
      <UiStatCard
        icon="🏃"
        :value="todayStatus?.calories_out ?? 0"
        title="Calorías quemadas"
        subtitle="kcal"
      />
      <UiStatCard
        icon="💧"
        :value="`${todayStatus?.water_total_ml ?? 0} ml`"
        title="Agua hoy"
      />
    </div>

    <!-- Charts Row -->
    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <DashboardWeightChart :data="progress?.weights ?? []" />
      <DashboardCaloriesChart :data="progress?.daily_calories ?? []" />
    </div>

    <!-- Content Row -->
    <div class="grid lg:grid-cols-5 gap-6 mb-8">
      <div class="lg:col-span-3">
        <DashboardMealLog :meals="todayStatus?.meals ?? []" />
      </div>
      <div class="lg:col-span-2 space-y-6">
        <DashboardWaterTracker
          :total-ml="todayStatus?.water_total_ml ?? 0"
          :goal-ml="2000"
        />
        <DashboardExerciseLog :exercises="todayStatus?.exercises ?? []" />
      </div>
    </div>

    <!-- Week Comparison -->
    <DashboardWeekComparison
      :current="weekSummary?.totals ?? null"
      :previous="lastWeekSummary?.totals ?? null"
    />
  </div>
</template>
