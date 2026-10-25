<script setup lang="ts">
const user = useSupabaseUser()

const features = [
  {
    icon: '⚖️',
    title: 'Peso diario',
    description: 'Registra tu peso cada día y visualiza tu progreso con gráficos claros.',
  },
  {
    icon: '🍽️',
    title: 'Comidas y calorías',
    description: 'Registra desayuno, almuerzo y cena. Mide en gramos o porciones (puño, taza, mano).',
  },
  {
    icon: '💧',
    title: 'Hidratación',
    description: 'Lleva el control de tu consumo de agua diario y semanal.',
  },
  {
    icon: '🏃',
    title: 'Ejercicio',
    description: 'Registra tus actividades físicas y calorías quemadas.',
  },
  {
    icon: '🤖',
    title: 'MCP para Claude',
    description: 'Registra todo desde Claude. Solo dile qué comiste, cuánto pesaste o qué ejercicio hiciste.',
  },
  {
    icon: '🚦',
    title: 'Densidad calórica',
    description: 'Verde, amarillo y rojo — entiende la densidad calórica de tus alimentos sin culpa.',
  },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div class="max-w-6xl mx-auto px-4 py-20 md:py-32">
        <div class="max-w-2xl">
          <h1 class="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
            Tu salud,
            <span class="text-emerald-600">tu control</span>
          </h1>
          <p class="mt-6 text-lg text-gray-600 leading-relaxed">
            Registra tu peso, comidas, agua y ejercicios de forma simple.
            Usa Claude como tu asistente de salud con nuestro MCP integrado.
          </p>
          <div class="mt-8 flex flex-wrap gap-4">
            <NuxtLink
              v-if="!user"
              to="/login"
              class="btn-primary text-lg !py-4 !px-8"
            >
              Empezar gratis
              <span class="text-xl">→</span>
            </NuxtLink>
            <NuxtLink
              v-else
              to="/dashboard"
              class="btn-primary text-lg !py-4 !px-8"
            >
              Ir al dashboard
              <span class="text-xl">→</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="absolute -top-40 -right-40 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
      <div class="absolute -bottom-20 -left-20 w-72 h-72 bg-teal-200/30 rounded-full blur-3xl" />
    </section>

    <!-- Features -->
    <section class="max-w-6xl mx-auto px-4 py-20">
      <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
        Todo lo que necesitas para tu seguimiento
      </h2>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="card hover:shadow-md transition-shadow"
        >
          <span class="text-3xl">{{ feature.icon }}</span>
          <h3 class="mt-4 font-semibold text-gray-900">{{ feature.title }}</h3>
          <p class="mt-2 text-sm text-gray-500 leading-relaxed">{{ feature.description }}</p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-emerald-600 text-white py-16">
      <div class="max-w-4xl mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold">Empieza hoy</h2>
        <p class="mt-4 text-emerald-100 text-lg">
          Regístrate con Google y comienza a registrar tu progreso en segundos.
        </p>
        <NuxtLink
          v-if="!user"
          to="/login"
          class="mt-8 inline-flex items-center gap-2 bg-white text-emerald-700 font-semibold px-8 py-4 rounded-xl hover:bg-emerald-50 transition-colors"
        >
          Crear cuenta gratis
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
