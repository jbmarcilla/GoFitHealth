<script setup lang="ts">
const user = useSupabaseUser()

watch(user, (u) => {
  if (u) navigateTo('/dashboard')
}, { immediate: true })

const chat = [
  { from: 'user', text: 'Hoy peso 78.2' },
  { from: 'coach', text: '⚖️ Registrado. Bajaste 0.4 kg esta semana, te faltan 6.2 kg para tu meta de 72 kg.' },
  { from: 'user', text: 'Almorcé un puño de arroz con pollo y ensalada' },
  { from: 'coach', text: '✅ Almuerzo: 540 kcal. Llevas 1,240 de 2,000 hoy. Te faltan 3 vasos de agua 💧' },
]

const steps = [
  { title: 'Entra con Google', text: 'Define tu peso actual y tu peso objetivo. Nada más.' },
  { title: 'Conecta tu IA', text: 'Pega una URL en Claude o ChatGPT. Un minuto.' },
  { title: 'Habla normal', text: 'Cuéntale qué comiste o entrenaste. Cada noche recibes tu resumen.' },
]

const tracks = [
  { icon: '⚖️', title: 'Peso', text: 'Diario, con tu avance hacia la meta.' },
  { icon: '🍽️', title: 'Comidas', text: 'En gramos o en porciones: puño, taza, mano.' },
  { icon: '💧', title: 'Agua', text: 'Vaso a vaso, contra tu meta del día.' },
  { icon: '🏃', title: 'Ejercicio', text: 'Minutos y calorías quemadas.' },
  { icon: '🚦', title: 'Densidad calórica', text: 'Verde, amarillo, rojo. Información, no culpa.' },
  { icon: '📍', title: 'Dónde estás', text: 'Comidas locales y tu hora, aunque viajes.' },
]
</script>

<template>
  <div class="bg-white">
    <!-- Hero -->
    <section class="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 md:grid-cols-2 md:pt-24">
      <div>
        <p class="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Funciona con Claude y ChatGPT
        </p>
        <h1 class="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-gray-900 md:text-5xl">
          Tu entrenador personal,<br>
          <span class="text-emerald-600">dentro del chat que ya usas.</span>
        </h1>
        <p class="mt-5 max-w-md text-lg leading-relaxed text-gray-500">
          Dile a tu IA cuánto pesas, qué comiste o qué entrenaste. GoFit lo registra y te acompaña cada día hasta tu peso objetivo.
        </p>
        <div class="mt-8 flex flex-wrap items-center gap-4">
          <NuxtLink
            to="/login"
            class="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Empezar gratis con Google <span aria-hidden="true">→</span>
          </NuxtLink>
          <a href="#como-funciona" class="text-sm font-medium text-gray-500 hover:text-gray-900">Cómo funciona</a>
        </div>
      </div>

      <!-- Chat preview -->
      <div class="relative">
        <div class="absolute -inset-3 -z-10 rounded-[2rem] md:-inset-6 bg-gradient-to-br from-emerald-50 to-gray-50" />
        <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
            <span class="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-xs">💪</span>
            <span class="text-xs font-medium text-gray-500">GoFit en tu chat</span>
          </div>
          <div class="space-y-3">
            <div
              v-for="(m, i) in chat"
              :key="i"
              class="flex"
              :class="m.from === 'user' ? 'justify-end' : 'justify-start'"
            >
              <p
                class="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                :class="m.from === 'user' ? 'rounded-br-md bg-gray-900 text-white' : 'rounded-bl-md bg-gray-100 text-gray-700'"
              >
                {{ m.text }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Cómo funciona -->
    <section id="como-funciona" class="border-t border-gray-100 bg-gray-50/60">
      <div class="mx-auto max-w-6xl px-4 py-20">
        <h2 class="text-sm font-medium uppercase tracking-wider text-gray-400">Cómo funciona</h2>
        <ol class="mt-8 grid gap-8 md:grid-cols-3">
          <li v-for="(s, i) in steps" :key="s.title">
            <span class="text-sm font-semibold text-emerald-600 tabular-nums">0{{ i + 1 }}</span>
            <h3 class="mt-2 text-lg font-semibold text-gray-900">{{ s.title }}</h3>
            <p class="mt-1 text-sm leading-relaxed text-gray-500">{{ s.text }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- Qué registra -->
    <section class="mx-auto max-w-6xl px-4 py-20">
      <h2 class="text-sm font-medium uppercase tracking-wider text-gray-400">Qué lleva GoFit por ti</h2>
      <div class="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="t in tracks" :key="t.title" class="flex gap-3">
          <span class="text-xl">{{ t.icon }}</span>
          <div>
            <h3 class="font-medium text-gray-900">{{ t.title }}</h3>
            <p class="text-sm text-gray-500">{{ t.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="border-t border-gray-100">
      <div class="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-16 md:flex-row md:items-center">
        <div>
          <h2 class="text-2xl font-semibold tracking-tight text-gray-900">Empieza hoy con tu peso de hoy.</h2>
          <p class="mt-1 text-gray-500">Gratis. Solo necesitas tu cuenta de Google.</p>
        </div>
        <NuxtLink
          to="/login"
          class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Crear cuenta gratis <span aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
