<script setup lang="ts">
import { randomPhrase } from '#shared/constants/phrases'
import { DENSITY_INFO, DENSITY_ORDER } from '#shared/constants/caloric-density'

definePageMeta({ middleware: 'auth' })
useSeoMeta({
  title: 'Bienvenido a GoFit Health',
  robots: 'noindex, nofollow',
})

const user = useSupabaseUser()
const onboarded = useState<boolean | null>('onboarded')
const phrase = randomPhrase()

const firstName = computed(() => (user.value?.user_metadata?.full_name || user.value?.user_metadata?.name || '').split(' ')[0])

const steps = ['Tu peso', 'Tu IA', 'Los colores', 'Listo']
const step = ref(0)
const saving = ref(false)
const error = ref('')
const copied = ref(false)

// ---- Paso 1: peso ----
const weight = ref<number | null>(null)
const target = ref<number | null>(null)
const height = ref<number | null>(null)
const age = ref<number | null>(null)
const sex = ref<'' | 'male' | 'female'>('')

async function saveWeights() {
  if (!weight.value) return
  saving.value = true
  error.value = ''
  try {
    await $fetch('/api/weight', { method: 'POST', body: { weight_kg: weight.value, notes: 'Peso inicial' } })
    if (height.value || age.value || sex.value) {
      await $fetch('/api/me/profile', {
        method: 'PATCH',
        body: {
          height_cm: height.value || null,
          birth_year: age.value ? new Date().getFullYear() - age.value : null,
          sex: sex.value || null,
        },
      })
    }
    if (target.value) {
      const goal_type = target.value < weight.value ? 'lose_weight' : target.value > weight.value ? 'gain_weight' : 'maintain'
      await $fetch('/api/goals', { method: 'POST', body: { goal_type, target_weight_kg: target.value } })
    }
    step.value = 1
  } catch (e: any) {
    error.value = e.data?.message || e.message
  }
  saving.value = false
}

// ---- Paso 2: conectar ----
const mcpUrl = `${useRequestURL().origin}/mcp`
const platform = ref<'claude' | 'chatgpt'>('claude')
const platforms = {
  claude: {
    name: 'Claude', icon: '🤖', link: 'https://claude.ai/settings/connectors',
    steps: ['Configuración → Conectores → "Agregar conector personalizado"', 'Nombre "GoFit", pega la URL y toca "Agregar"', 'Toca "Conectar", entra con Google y "Permitir"'],
  },
  chatgpt: {
    name: 'ChatGPT', icon: '💬', link: 'https://chatgpt.com',
    steps: ['Configuración → Complementos → activa el Modo desarrollador', '"Crear" → "Añadir servidor MCP personalizado", pega la URL, autenticación OAuth', 'Entra con Google y toca "Permitir"'],
  },
}
const current = computed(() => platforms[platform.value])

async function copyUrl() {
  await navigator.clipboard.writeText(mcpUrl)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

// ---- Paso 3: colores ----
const colors = DENSITY_ORDER.map((k) => {
  const d = DENSITY_INFO[k]
  return { dot: d.dot, bg: d.bg, name: `${d.emoji} ${d.label}`, desc: `${d.advice} (${d.range})`, eg: d.examples }
})
const portions = [
  { icon: '✊', name: 'Puño', eg: 'arroz, pasta' },
  { icon: '🖐️', name: 'Palma', eg: 'pollo, pescado' },
  { icon: '☕', name: 'Taza', eg: 'leche, cereal' },
  { icon: '🤏', name: 'Mano', eg: 'frutos secos' },
]

// ---- Final ----
async function finish() {
  saving.value = true
  error.value = ''
  try {
    await $fetch('/api/me/onboarding', { method: 'POST' })
    onboarded.value = true
    await navigateTo('/dashboard')
  } catch (e: any) {
    error.value = e.data?.message || e.message
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-xl px-4 py-10 md:py-14">
    <!-- Progreso -->
    <ol class="mb-10 flex items-center gap-2">
      <li v-for="(s, i) in steps" :key="s" class="flex flex-1 items-center gap-2">
        <span
          class="h-1.5 flex-1 rounded-full transition-colors"
          :class="i <= step ? 'bg-emerald-500' : 'bg-gray-200'"
        />
      </li>
    </ol>
    <p class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Paso {{ step + 1 }} de {{ steps.length }} · {{ steps[step] }}</p>

    <div v-if="error" class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ error }}</div>

    <!-- 1. Peso -->
    <section v-if="step === 0">
      <h1 class="text-3xl font-semibold tracking-tight text-gray-900">Hola{{ firstName ? `, ${firstName}` : '' }} 👋</h1>
      <p class="mt-3 text-lg leading-relaxed text-emerald-700">"{{ phrase }}"</p>
      <p class="mt-6 text-sm text-gray-500">Empecemos por lo básico. Tu peso de hoy y a dónde quieres llegar.</p>

      <form class="mt-6 grid gap-4 sm:grid-cols-2" @submit.prevent="saveWeights">
        <label class="block rounded-2xl border border-gray-200 bg-white p-5">
          <span class="text-xs font-medium uppercase tracking-wider text-gray-400">Peso de hoy</span>
          <span class="mt-2 flex items-baseline gap-2 border-b-2 border-gray-200 focus-within:border-emerald-500">
            <input v-model.number="weight" type="number" step="0.1" min="30" max="300" inputmode="decimal" required autofocus
              class="w-full bg-transparent py-1 text-4xl font-semibold tracking-tight text-gray-900 outline-none tabular-nums placeholder:text-gray-300" placeholder="75.0" />
            <span class="text-lg text-gray-400">kg</span>
          </span>
        </label>
        <label class="block rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
          <span class="text-xs font-medium uppercase tracking-wider text-emerald-700/70">A dónde quieres llegar</span>
          <span class="mt-2 flex items-baseline gap-2 border-b-2 border-emerald-200 focus-within:border-emerald-500">
            <input v-model.number="target" type="number" step="0.1" min="30" max="300" inputmode="decimal"
              class="w-full bg-transparent py-1 text-4xl font-semibold tracking-tight text-emerald-700 outline-none tabular-nums placeholder:text-emerald-200" placeholder="70.0" />
            <span class="text-lg text-emerald-600/50">kg</span>
          </span>
          <span class="mt-2 block text-xs text-emerald-700/60">Opcional. Lo puedes cambiar después.</span>
        </label>
        <div class="sm:col-span-2 rounded-2xl border border-gray-200 bg-white p-5">
          <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Para calcular cuánto puedes comer</p>
          <p class="mt-1 text-xs text-gray-500">Opcional. Con esto tu máximo de calorías se calcula solo y se ajusta con cada pesada.</p>
          <div class="mt-3 grid grid-cols-3 gap-3">
            <label class="block">
              <span class="mb-1 block text-[11px] text-gray-500">Estatura (cm)</span>
              <input v-model.number="height" type="number" min="100" max="250" inputmode="numeric" class="input" placeholder="170" />
            </label>
            <label class="block">
              <span class="mb-1 block text-[11px] text-gray-500">Edad</span>
              <input v-model.number="age" type="number" min="10" max="110" inputmode="numeric" class="input" placeholder="30" />
            </label>
            <label class="block">
              <span class="mb-1 block text-[11px] text-gray-500">Sexo</span>
              <select v-model="sex" class="input">
                <option value="">—</option>
                <option value="male">Hombre</option>
                <option value="female">Mujer</option>
              </select>
            </label>
          </div>
        </div>
        <div class="sm:col-span-2 flex justify-end">
          <button type="submit" class="rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40" :disabled="!weight || saving">
            {{ saving ? 'Guardando…' : 'Continuar →' }}
          </button>
        </div>
      </form>
    </section>

    <!-- 2. Conectar IA -->
    <section v-else-if="step === 1">
      <h1 class="text-3xl font-semibold tracking-tight text-gray-900">Conecta tu entrenador</h1>
      <p class="mt-3 text-gray-500">Pega una URL en Claude o ChatGPT y tu IA podrá registrar todo por ti. Toma un minuto.</p>

      <div class="mt-6 flex gap-2">
        <button v-for="(p, key) in platforms" :key="key" type="button"
          class="flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors"
          :class="platform === key ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'"
          @click="platform = key">
          {{ p.icon }} {{ p.name }}
        </button>
      </div>

      <div class="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">1. Copia la URL de GoFit</p>
        <div class="mt-2 flex items-stretch gap-2">
          <code class="flex-1 select-all break-all rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-sm text-gray-800">{{ mcpUrl }}</code>
          <button type="button" class="shrink-0 rounded-lg px-4 text-sm font-medium transition-colors" :class="copied ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-900 text-white hover:bg-gray-800'" @click="copyUrl">
            {{ copied ? '✓ Copiada' : 'Copiar' }}
          </button>
        </div>

        <p class="mt-5 text-xs font-medium uppercase tracking-wider text-gray-400">2. Pégala en {{ current.name }}</p>
        <ol class="mt-2 space-y-2">
          <li v-for="(s, i) in current.steps" :key="i" class="flex gap-2.5 text-sm text-gray-600">
            <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600">{{ i + 1 }}</span>
            {{ s }}
          </li>
        </ol>
        <a :href="current.link" target="_blank" rel="noopener" class="mt-3 inline-block text-sm font-medium text-gray-900 underline decoration-gray-300 underline-offset-4 hover:decoration-gray-900">
          Abrir {{ current.name }} ↗
        </a>
      </div>

      <div class="mt-6 flex items-center justify-between">
        <button type="button" class="text-sm text-gray-400 hover:text-gray-600" @click="step = 2">Lo hago después</button>
        <button type="button" class="rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800" @click="step = 2">Ya conecté →</button>
      </div>
    </section>

    <!-- 3. Colores -->
    <section v-else-if="step === 2">
      <h1 class="text-3xl font-semibold tracking-tight text-gray-900">Los colores de tu comida</h1>
      <p class="mt-3 text-gray-500">GoFit no prohíbe nada. Solo te muestra cuánta energía trae cada alimento por bocado, con un semáforo.</p>

      <div class="mt-6 space-y-3">
        <div v-for="c in colors" :key="c.name" class="flex gap-4 rounded-2xl border p-4" :class="c.bg">
          <span class="mt-1.5 h-3 w-3 shrink-0 rounded-full" :class="c.dot" />
          <div>
            <p class="font-medium text-gray-900">{{ c.name }}</p>
            <p class="text-sm text-gray-600">{{ c.desc }}</p>
            <p class="mt-1 text-xs text-gray-400">{{ c.eg }}</p>
          </div>
        </div>
      </div>

      <p class="mt-8 text-xs font-medium uppercase tracking-wider text-gray-400">Y las porciones, con tu mano</p>
      <p class="mt-1 text-sm text-gray-500">No necesitas balanza. Dile a tu IA "un puño de arroz" y listo.</p>
      <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div v-for="p in portions" :key="p.name" class="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <span class="text-2xl">{{ p.icon }}</span>
          <p class="mt-1 text-sm font-medium text-gray-900">{{ p.name }}</p>
          <p class="text-xs text-gray-400">{{ p.eg }}</p>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <button type="button" class="rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800" @click="step = 3">Entendido →</button>
      </div>
    </section>

    <!-- 4. Listo -->
    <section v-else class="text-center">
      <span class="text-5xl">💪</span>
      <h1 class="mt-4 text-3xl font-semibold tracking-tight text-gray-900">Todo listo{{ firstName ? `, ${firstName}` : '' }}</h1>
      <p class="mx-auto mt-3 max-w-sm text-gray-500">Tu entrenador ya te conoce. Cada noche te dará tu resumen, y cada mañana te recordará pesarte.</p>
      <div class="mx-auto mt-6 max-w-sm rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-left">
        <p class="text-xs font-medium uppercase tracking-wider text-emerald-700/70">Prueba decirle</p>
        <ul class="mt-2 space-y-1 text-sm text-emerald-900">
          <li>"Hoy peso {{ weight ?? 75 }}"</li>
          <li>"Desayuné 2 huevos y pan con palta"</li>
          <li>"¿Cómo va mi día?"</li>
        </ul>
      </div>
      <button type="button" class="mt-8 rounded-xl bg-emerald-600 px-8 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40" :disabled="saving" @click="finish">
        {{ saving ? 'Un momento…' : 'Ir a mi panel' }}
      </button>
    </section>
  </div>
</template>
