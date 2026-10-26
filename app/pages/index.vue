<script setup lang="ts">
const user = useSupabaseUser()

watch(user, (u) => {
  if (u) navigateTo('/dashboard')
}, { immediate: true })

const chat = [
  { from: 'user', text: 'Hoy peso 78.2' },
  { from: 'coach', text: 'Bien ahí 🙌 Bajaste 0.4 kg esta semana. Vas a tu ritmo, sin prisa.' },
  { from: 'user', text: 'Almorcé un puño de arroz con pollo y ensalada' },
  { from: 'coach', text: 'Registrado: 540 kcal. Buen plato, con proteína y verdura. Te faltan 3 vasos de agua 💧' },
]

const before = [
  'Descargar otra app y llenar formularios',
  'Pesar cada gramo de comida',
  'Buscar en listas infinitas de alimentos',
  'Sentir culpa cuando te sales del plan',
  'Dejarlo a las dos semanas',
]

const after = [
  'Usas el chat que ya tienes: Claude o ChatGPT',
  '"Un puño de arroz" es suficiente',
  'Lo cuentas como hablas, y listo',
  'Tu entrenador te anima, no te juzga',
  'Cada noche, un resumen que te mantiene',
]

const steps = [
  { title: 'Entra con Google', text: 'Pon tu peso de hoy y el peso al que quieres llegar.' },
  { title: 'Conecta tu IA', text: 'Pega una URL en Claude o ChatGPT. Toma un minuto.' },
  { title: 'Conversa', text: 'Cuéntale tu día. Él registra, calcula y te acompaña.' },
]

const trainers = [
  { emoji: '🙌', name: 'Motivador', line: '¡Eso! Ya son 4 días seguidos registrando.' },
  { emoji: '🧐', name: 'Estricto', line: 'Ayer no registraste la cena. Hoy sin excusas.' },
  { emoji: '😎', name: 'Relajado', line: 'Tranqui, un mal día no borra la semana.' },
  { emoji: '🪖', name: 'Militar', line: '¡A la balanza! ¡Constancia, soldado!' },
]
</script>

<template>
  <div class="bg-white">
    <!-- Hero -->
    <section class="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 md:grid-cols-[1.1fr_1fr] md:gap-16 md:pt-20">
      <div>
        <p class="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Funciona con Claude y ChatGPT
        </p>
        <h1 class="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-gray-900 md:text-[3.25rem]">
          Tu IA ya puede ser<br>
          <span class="text-emerald-600">tu entrenador</span> 💪
        </h1>
        <p class="mt-5 max-w-md text-lg leading-relaxed text-gray-500">
          Cuéntale lo que comes, cuánto pesas y cómo te mueves. GoFit lo registra y te acompaña a sentirte mejor, sin dietas extremas y sin culpa.
        </p>
        <div class="mt-8">
          <NuxtLink
            to="/login"
            class="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Iniciar sesión <span aria-hidden="true">→</span>
          </NuxtLink>
        </div>
      </div>

      <div class="relative mx-auto w-full max-w-sm md:max-w-none">
        <img
          src="/hero.jpg"
          alt="Mujer estirando con los brazos arriba en un parque"
          width="1100"
          height="1375"
          class="aspect-[4/5] w-full rounded-3xl object-cover object-[center_40%]"
        />

        <div class="absolute left-3 top-3 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur md:left-4 md:top-4">
          <p class="text-[10px] font-medium uppercase tracking-wider text-gray-400">Agua</p>
          <p class="mt-0.5 text-base font-semibold text-gray-900 tabular-nums">💧 5<span class="font-normal text-gray-400">/8 vasos</span></p>
        </div>

        <div class="absolute right-3 top-3 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur md:right-4 md:top-4">
          <p class="text-[10px] font-medium uppercase tracking-wider text-gray-400">Hoy</p>
          <p class="mt-0.5 text-base font-semibold text-gray-900 tabular-nums">🍽️ 1,240<span class="font-normal text-gray-400"> / 2,000 kcal</span></p>
          <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div class="h-full w-[62%] rounded-full bg-emerald-500" />
          </div>
        </div>

        <div class="absolute bottom-3 left-3 right-3 rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur md:bottom-4 md:left-4 md:right-4">
          <p class="text-[10px] font-medium uppercase tracking-wider text-gray-400">Densidad calórica</p>
          <div class="mt-2 grid grid-cols-3 gap-1.5 text-xs font-medium">
            <div class="flex items-center gap-1.5 rounded-lg bg-green-50 px-2 py-1.5 text-green-800"><span class="h-2 w-2 shrink-0 rounded-full bg-green-500" />Ensalada</div>
            <div class="flex items-center gap-1.5 rounded-lg bg-yellow-50 px-2 py-1.5 text-yellow-800"><span class="h-2 w-2 shrink-0 rounded-full bg-yellow-400" />Arroz</div>
            <div class="flex items-center gap-1.5 rounded-lg bg-red-50 px-2 py-1.5 text-red-800"><span class="h-2 w-2 shrink-0 rounded-full bg-red-500" />Palta</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Manifiesto -->
    <section class="border-y border-gray-100 bg-emerald-50/40">
      <div class="mx-auto max-w-3xl px-4 py-20 text-center">
        <p class="text-2xl font-medium leading-snug tracking-tight text-gray-900 md:text-3xl">
          Tu cuerpo no es un problema que arreglar.<br class="hidden md:block">{{ ' ' }}<span class="text-gray-500">Es el lugar donde vives. Cuídalo con cariño.</span>
        </p>
        <p class="mt-6 text-sm text-gray-500">
          En GoFit ningún alimento es "malo" y ningún día está perdido. Solo un poco mejor que ayer.
        </p>
      </div>
    </section>

    <!-- Antes / Con GoFit -->
    <section class="mx-auto max-w-5xl px-4 py-24">
      <h2 class="text-center text-3xl font-semibold tracking-tight text-gray-900">Cuidarte no debería ser otro trabajo</h2>
      <div class="mt-12 grid gap-4 md:grid-cols-2">
        <div class="rounded-2xl border border-gray-200 p-7">
          <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Antes</p>
          <ul class="mt-5 space-y-3.5">
            <li v-for="b in before" :key="b" class="flex gap-3 text-gray-500">
              <span class="mt-0.5 text-gray-300">✕</span>
              <span class="line-through decoration-gray-300">{{ b }}</span>
            </li>
          </ul>
        </div>
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-7">
          <p class="text-xs font-medium uppercase tracking-wider text-emerald-700">Con GoFit</p>
          <ul class="mt-5 space-y-3.5">
            <li v-for="a in after" :key="a" class="flex gap-3 text-gray-800">
              <span class="mt-0.5 text-emerald-600">✓</span>
              <span>{{ a }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Elige tu entrenador -->
    <section class="bg-gray-50/70">
      <div class="mx-auto max-w-5xl px-4 py-24">
        <div class="max-w-xl">
          <h2 class="text-3xl font-semibold tracking-tight text-gray-900">Tú eliges cómo te habla</h2>
          <p class="mt-3 text-gray-500">Tu entrenador tiene la personalidad que necesitas. Puedes escribirla a tu manera.</p>
        </div>
        <div class="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="t in trainers" :key="t.name" class="rounded-2xl border border-gray-200 bg-white p-5">
            <div class="flex items-center gap-2">
              <span class="text-xl">{{ t.emoji }}</span>
              <span class="font-medium text-gray-900">{{ t.name }}</span>
            </div>
            <p class="mt-3 text-sm leading-relaxed text-gray-500">"{{ t.line }}"</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Cómo funciona -->
    <section class="mx-auto max-w-5xl px-4 py-24">
      <h2 class="text-3xl font-semibold tracking-tight text-gray-900">Empiezas en 3 minutos</h2>
      <ol class="mt-10 grid gap-8 md:grid-cols-3">
        <li v-for="(s, i) in steps" :key="s.title" class="border-t border-gray-200 pt-5">
          <span class="text-sm font-semibold text-emerald-600 tabular-nums">0{{ i + 1 }}</span>
          <h3 class="mt-2 text-lg font-semibold text-gray-900">{{ s.title }}</h3>
          <p class="mt-1 text-sm leading-relaxed text-gray-500">{{ s.text }}</p>
        </li>
      </ol>
    </section>

    <!-- CTA -->
    <section class="px-4 pb-24">
      <div class="mx-auto max-w-5xl rounded-3xl bg-gray-900 px-8 py-14 text-center md:px-16">
        <h2 class="text-3xl font-semibold tracking-tight text-white">Empieza hoy, como estés hoy.</h2>
        <p class="mx-auto mt-3 max-w-md text-gray-400">Gratis. Sin app nueva. Tu entrenador te espera en el chat.</p>
        <NuxtLink
          to="/login"
          class="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-400"
        >
          Crear cuenta gratis <span aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
