<script setup lang="ts">
import { COUNTRY_TIMEZONES, countryFlag, countryLabel, timezoneLabel } from '#shared/constants/countries'

definePageMeta({ middleware: 'auth' })
useSeoMeta({
  title: 'Configuración — GoFit Health',
  robots: 'noindex, nofollow',
})

type SectionKey = 'connect' | 'goals' | 'trainer' | 'location' | 'profile'

const route = useRoute()
const router = useRouter()
const user = useSupabaseUser()
const saving = ref(false)
const message = ref('')
const generatedKey = ref('')
const showKeyModal = ref(false)
const connectingTo = ref<'claude' | 'chatgpt' | null>(null)
const copied = ref('')

const sections: Array<{ key: SectionKey; icon: string; label: string; hint: string }> = [
  { key: 'goals', icon: '🎯', label: 'Mi peso', hint: 'Actual y objetivo' },
  { key: 'connect', icon: '🔌', label: 'Conectar IA', hint: 'Claude y ChatGPT' },
  { key: 'trainer', icon: '🧑‍🏫', label: 'Mi entrenador', hint: 'Personalidad de la IA' },
  { key: 'location', icon: '📍', label: 'Ubicación', hint: 'Dónde estás ahora' },
  { key: 'profile', icon: '👤', label: 'Perfil', hint: 'Cuenta y preferencias' },
]

const activeSection = ref<SectionKey>(
  sections.some(s => s.key === route.query.tab) ? route.query.tab as SectionKey : 'goals',
)

function selectSection(key: SectionKey) {
  activeSection.value = key
  message.value = ''
  router.replace({ query: { ...route.query, tab: key } })
}

const { data: profile, refresh: refreshProfile } = await useFetch('/api/me/profile')
const { data: apiKeys, refresh: refreshKeys } = await useFetch<any[]>('/api/me/api-keys')
const { data: currentGoal, refresh: refreshGoal } = await useFetch<any>('/api/goals')
const { data: latestWeight, refresh: refreshWeight } = await useFetch<any[]>('/api/weight', { params: { from: '2000-01-01' } })

const googleName = computed(() => user.value?.user_metadata?.full_name || user.value?.user_metadata?.name || '')
const googleAvatar = computed(() => user.value?.user_metadata?.avatar_url || '')
const googleEmail = computed(() => user.value?.email || '')

const currentWeightKg = computed(() => latestWeight.value?.[0]?.weight_kg ?? null)

const form = reactive({
  measurement_system: 'grams' as string,
  cooking_preference: 'simple' as string,
  trainer_prompt: '' as string,
})

const bodyForm = reactive({
  height_cm: null as number | null,
  age: null as number | null,
  sex: '' as string,
  activity_level: 'light' as string,
})
const savingBody = ref(false)
const activityOptions = [
  { key: 'sedentary', label: 'Sedentario', hint: 'casi nada' },
  { key: 'light', label: 'Ligero', hint: '1–3 días' },
  { key: 'moderate', label: 'Moderado', hint: '3–5 días' },
  { key: 'active', label: 'Activo', hint: '6–7 días' },
  { key: 'very_active', label: 'Muy activo', hint: 'trabajo físico' },
]

async function saveBody() {
  savingBody.value = true
  message.value = ''
  try {
    await $fetch('/api/me/profile', {
      method: 'PATCH',
      body: {
        height_cm: bodyForm.height_cm || null,
        birth_year: bodyForm.age ? new Date().getFullYear() - bodyForm.age : null,
        sex: bodyForm.sex || null,
        activity_level: bodyForm.activity_level,
      },
    })
    message.value = 'Datos guardados · tu máximo de calorías ya se recalculó'
    await refreshProfile()
  } catch (e: any) {
    showError(e)
  }
  savingBody.value = false
}

const goalForm = reactive({
  goal_type: 'athletic' as string,
  target_weight_kg: null as number | null,
  target_muscle_mass_kg: null as number | null,
  daily_calorie_target: null as number | null,
  daily_protein_g: null as number | null,
  daily_water_ml: 2000 as number,
})

watch(profile, (p: any) => {
  if (p) {
    form.measurement_system = p.measurement_system || 'grams'
    form.cooking_preference = p.cooking_preference || 'simple'
    form.trainer_prompt = p.trainer_prompt || ''
    bodyForm.height_cm = p.height_cm ? Number(p.height_cm) : null
    bodyForm.age = p.birth_year ? new Date().getFullYear() - p.birth_year : null
    bodyForm.sex = p.sex || ''
    bodyForm.activity_level = p.activity_level || 'light'
  }
}, { immediate: true })

watch(currentGoal, (g: any) => {
  if (g) {
    goalForm.goal_type = g.goal_type || 'athletic'
    goalForm.target_weight_kg = g.target_weight_kg || null
    goalForm.target_muscle_mass_kg = g.target_muscle_mass_kg || null
    goalForm.daily_calorie_target = g.daily_calorie_target || null
    goalForm.daily_protein_g = g.daily_protein_g || null
    goalForm.daily_water_ml = g.daily_water_ml || 2000
  }
}, { immediate: true })

const isConnected = computed(() => apiKeys.value?.some((k: any) => k.last_used) ?? false)

function showError(e: any) {
  message.value = `Error: ${e.data?.message || e.message}`
}

async function saveProfile(successMessage = 'Preferencias guardadas') {
  saving.value = true
  message.value = ''
  try {
    await $fetch('/api/me/profile', { method: 'PATCH', body: { display_name: googleName.value, ...form } })
    message.value = successMessage
    await refreshProfile()
  } catch (e: any) {
    showError(e)
  }
  saving.value = false
}

// ---------- Ubicación ----------
const { data: locationData, refresh: refreshLocation } = await useFetch<any>('/api/me/location')

const countryOptions = Object.keys(COUNTRY_TIMEZONES)
  .map(code => ({ code, name: countryLabel(code), flag: countryFlag(code) }))
  .sort((a, b) => a.name.localeCompare(b.name, 'es'))

const locationForm = reactive({ country_code: 'PE', city: '', timezone: 'America/Lima' })
const editingLocation = ref(false)
const savingLocation = ref(false)

const currentLocation = computed(() => locationData.value?.current ?? null)
const pastLocations = computed(() => (locationData.value?.history ?? []).filter((l: any) => !l.is_current))
const showLocationForm = computed(() => !currentLocation.value || editingLocation.value)
const timezoneOptions = computed(() => COUNTRY_TIMEZONES[locationForm.country_code] ?? [locationForm.timezone])

watch(() => locationForm.country_code, (code) => {
  const tzs = COUNTRY_TIMEZONES[code] ?? []
  if (!tzs.includes(locationForm.timezone)) locationForm.timezone = tzs[0] ?? locationForm.timezone
})

function prefillLocationForm() {
  const current = currentLocation.value
  if (current) {
    locationForm.country_code = current.country.code
    locationForm.city = current.city ?? ''
    locationForm.timezone = current.timezone
    return
  }
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const guess = Object.entries(COUNTRY_TIMEZONES).find(([, tzs]) => tzs.includes(browserTz))
  if (guess) {
    locationForm.country_code = guess[0]
    locationForm.timezone = browserTz
  }
}

onMounted(prefillLocationForm)

function startEditLocation() {
  prefillLocationForm()
  editingLocation.value = true
}

async function saveLocation() {
  savingLocation.value = true
  message.value = ''
  try {
    const res = await $fetch<{ changed: boolean }>('/api/me/location', { method: 'POST', body: locationForm })
    message.value = res.changed ? 'Ubicación actualizada' : 'Ya estabas registrado ahí'
    editingLocation.value = false
    await Promise.all([refreshLocation(), refreshProfile()])
  } catch (e: any) {
    showError(e)
  }
  savingLocation.value = false
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ---------- Mi peso ----------
const weightInput = ref<number | null>(null)
const targetInput = ref<number | null>(null)
const editingWeight = ref(false)
const editingTarget = ref(false)
const savingWeight = ref(false)
const savingGoal = ref(false)

const targetWeightKg = computed(() => (currentGoal.value?.target_weight_kg ? Number(currentGoal.value.target_weight_kg) : null))
const startWeightKg = computed(() => {
  const logs = latestWeight.value
  return logs?.length ? Number(logs[logs.length - 1].weight_kg) : null
})
const lastWeighDate = computed(() => latestWeight.value?.[0]?.date ?? null)

const weightProgress = computed(() => {
  const start = startWeightKg.value
  const current = currentWeightKg.value !== null ? Number(currentWeightKg.value) : null
  const target = targetWeightKg.value
  if (start === null || current === null || target === null) return null
  const remaining = Math.abs(current - target)
  const total = Math.abs(start - target)
  const movedTowardTarget = (start - current) * Math.sign(start - target)
  const pct = total > 0 ? Math.min(100, Math.max(0, (movedTowardTarget / total) * 100)) : (remaining < 0.05 ? 100 : 0)
  return { start, current, target, remaining, done: Math.max(0, movedTowardTarget), pct }
})

function relativeDay(date: string) {
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(`${date}T00:00:00`).getTime()) / 86_400_000)
  if (days <= 0) return 'hoy'
  if (days === 1) return 'ayer'
  return `hace ${days} días`
}

function startEditWeight() {
  weightInput.value = currentWeightKg.value !== null ? Number(currentWeightKg.value) : null
  editingWeight.value = true
}

function startEditTarget() {
  targetInput.value = targetWeightKg.value
  editingTarget.value = true
}

async function saveWeight() {
  if (!weightInput.value) return
  savingWeight.value = true
  message.value = ''
  try {
    await $fetch('/api/weight', { method: 'POST', body: { weight_kg: weightInput.value } })
    message.value = 'Peso de hoy registrado'
    editingWeight.value = false
    await refreshWeight()
  } catch (e: any) {
    showError(e)
  }
  savingWeight.value = false
}

async function saveGoal(successMessage = 'Metas guardadas') {
  savingGoal.value = true
  message.value = ''
  try {
    await $fetch('/api/goals', { method: 'POST', body: goalForm })
    message.value = successMessage
    await refreshGoal()
  } catch (e: any) {
    showError(e)
  }
  savingGoal.value = false
}

async function saveTarget() {
  if (!targetInput.value) return
  goalForm.target_weight_kg = targetInput.value
  if (currentWeightKg.value !== null && !currentGoal.value) {
    goalForm.goal_type = targetInput.value < Number(currentWeightKg.value) ? 'lose_weight' : targetInput.value > Number(currentWeightKg.value) ? 'gain_weight' : 'maintain'
  }
  await saveGoal('Peso objetivo guardado')
  editingTarget.value = false
}

const goalTypeLabels: Record<string, string> = {
  athletic: 'Rendimiento atlético',
  muscular: 'Ganar masa muscular',
  lean: 'Definición / lean',
  maintain: 'Mantener peso',
  lose_weight: 'Bajar de peso',
  gain_weight: 'Subir de peso',
}

// ---------- Entrenador ----------
const trainerPresets = [
  { key: 'motivador', emoji: '🙌', label: 'Motivador', prompt: 'Eres un coach positivo y cercano. Celebras cada logro, por pequeño que sea, y das consejos simples y prácticos. Nunca juzgas.' },
  { key: 'estricto', emoji: '🧐', label: 'Estricto', prompt: 'Eres un entrenador exigente y directo. No aceptas excusas, señalas claramente lo que falló y exiges constancia diaria. Respetuoso pero firme.' },
  { key: 'relajado', emoji: '😎', label: 'Relajado', prompt: 'Eres un amigo fitness relajado. Hablas en tono casual, das tips sin presión y priorizas que el usuario disfrute el proceso.' },
  { key: 'militar', emoji: '🪖', label: 'Militar', prompt: 'Eres un sargento de entrenamiento drástico. Hablas fuerte, corto y con mucha energía. Empujas al usuario al límite y no toleras días sin registrar.' },
]

const trainerSaved = computed(() => (form.trainer_prompt || '') === ((profile.value as any)?.trainer_prompt || ''))

const fullTrainerPrompt = computed(() => `${form.trainer_prompt.trim() || trainerPresets[0].prompt}

Eres mi entrenador personal en GoFit Health. Cada día:
- Al empezar, revisa mi estado de hoy con GoFit (peso, comidas, agua, ejercicio) y pregúntame lo que falte.
- Si no me pesé hoy, pregúntame mi peso. Recuérdame pesarme cada mañana en ayunas.
- Cuando te cuente qué comí, pregúntame si fue desayuno, almuerzo, cena o snack antes de registrarlo.
- Si te mando la foto de un recibo o de mi compra, sugiéreme comidas simples con esos alimentos según mi objetivo.
- En la noche, dame el resumen de mi día y 1-2 recomendaciones para mañana.
- Ningún alimento es "malo": la densidad calórica es solo informativa.`)

const pasteGuides = [
  {
    icon: '🤖',
    title: 'Claude (claude.ai o app)',
    steps: ['Crea un Proyecto llamado "GoFit"', 'Abre "Instrucciones del proyecto"', 'Pega el texto y guarda'],
    alt: 'O en Configuración → Perfil → preferencias personales, para que aplique en todos tus chats.',
  },
  {
    icon: '💬',
    title: 'ChatGPT',
    steps: ['Ve a Configuración → Personalización', 'Abre "Instrucciones personalizadas"', 'Pega el texto y guarda'],
    alt: 'Si usas un GPT personalizado de GoFit, pégalo en su campo "Instrucciones".',
  },
]

// ---------- Conectar IA ----------
function connectTo(platform: 'claude' | 'chatgpt') {
  connectingTo.value = platform
  generatedKey.value = ''
  message.value = ''
  showKeyModal.value = true
}

const generatingKey = ref(false)

async function generateKeyUrl() {
  if (!activePlatform.value) return
  generatingKey.value = true
  try {
    const res = await $fetch<{ key: string }>('/api/me/api-keys', {
      method: 'POST',
      body: { label: `${activePlatform.value.name} (URL con key)` },
    })
    generatedKey.value = res.key
    await refreshKeys()
  } catch (e: any) {
    showError(e)
  }
  generatingKey.value = false
}

async function deleteApiKey(id: string) {
  if (!confirm('¿Desconectar esta integración?')) return
  try {
    await $fetch(`/api/me/api-keys/${id}`, { method: 'DELETE' })
    await refreshKeys()
  } catch (e: any) {
    showError(e)
  }
}

async function copyToClipboard(text: string, label: string) {
  await navigator.clipboard.writeText(text)
  copied.value = label
  setTimeout(() => { copied.value = '' }, 2000)
}

const platforms = {
  claude: {
    key: 'claude' as const,
    name: 'Claude',
    icon: '🤖',
    by: 'Anthropic',
    where: 'web, escritorio y celular',
    description: 'Agrega GoFit como conector personalizado. Una vez conectado, funciona en todos tus dispositivos.',
    link: 'https://claude.ai/settings/connectors',
    steps: [
      'Abre Claude → Configuración → Conectores',
      'Toca "Agregar conector personalizado"',
      'Nombre: "GoFit". Pega la URL y toca "Agregar"',
      'Toca "Conectar", entra con Google y toca "Permitir"',
      'En un chat, activa GoFit desde el menú de herramientas',
    ],
    cardClass: 'border-gray-100 hover:border-violet-200',
    iconClass: 'bg-gradient-to-br from-orange-100 to-amber-50',
    buttonClass: 'bg-violet-600 hover:bg-violet-700 text-white',
    softButtonClass: 'bg-violet-50 hover:bg-violet-100 text-violet-700',
  },
  chatgpt: {
    key: 'chatgpt' as const,
    name: 'ChatGPT',
    icon: '💬',
    by: 'OpenAI',
    where: 'chatgpt.com',
    description: 'Agrega GoFit como servidor MCP personalizado en el modo desarrollador de ChatGPT. Sin GPTs ni configuración técnica.',
    link: 'https://chatgpt.com',
    steps: [
      'Abre ChatGPT → Configuración → Complementos y activa el Modo desarrollador',
      'Toca "Crear" → "Añadir servidor MCP personalizado"',
      'Nombre: "GoFit". En "URL del servidor" pega la URL',
      'Autenticación: OAuth. Acepta el aviso y toca "Crear"',
      'Entra con Google y toca "Permitir"',
      'En un chat, activa GoFit desde el menú "+"',
    ],
    cardClass: 'border-gray-100 hover:border-green-200',
    iconClass: 'bg-gradient-to-br from-green-100 to-teal-50',
    buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
    softButtonClass: 'bg-green-50 hover:bg-green-100 text-green-700',
  },
}

const platformList = Object.values(platforms)
const activePlatform = computed(() => (connectingTo.value ? platforms[connectingTo.value] : null))

const howItWorks = ['Copia la URL de GoFit', 'Pégala en Claude o ChatGPT y entra con Google', 'Habla: "hoy peso 75 kg"']
const examplePhrases = ['Hoy peso 75 kg', 'Desayuné 2 huevos y pan con palta', 'Tomé un vaso de agua', '¿Cómo va mi semana?']

const origin = useRequestURL().origin
const mcpUrl = `${origin}/mcp`
const keyUrl = computed(() => `${origin}/mcp/${generatedKey.value}`)

function platformHasKey(name: string) {
  return apiKeys.value?.some((k: any) => k.label?.includes(name)) ?? false
}

function platformConnected(name: string) {
  return apiKeys.value?.some((k: any) => k.label?.includes(name) && k.last_used) ?? false
}

function closeModal() {
  showKeyModal.value = false
  connectingTo.value = null
  generatedKey.value = ''
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-10">
    <h1 class="mb-8 text-sm font-medium uppercase tracking-wider text-gray-400">Ajustes</h1>

    <div class="flex flex-col gap-8 md:flex-row md:gap-12">
      <!-- ==================== SIDEBAR ==================== -->
      <aside class="shrink-0 md:w-48">
        <!-- Mobile: tabs -->
        <nav class="md:hidden flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          <button
            v-for="s in sections"
            :key="s.key"
            class="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors"
            :class="activeSection === s.key ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'"
            @click="selectSection(s.key)"
          >
            <span>{{ s.icon }}</span>{{ s.label }}
          </button>
        </nav>

        <!-- Desktop: sidebar -->
        <nav class="sticky top-24 hidden space-y-0.5 md:block">
          <button
            v-for="s in sections"
            :key="s.key"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors"
            :class="activeSection === s.key ? 'bg-white font-medium text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-900'"
            @click="selectSection(s.key)"
          >
            <span class="w-5 text-center text-base">{{ s.icon }}</span>
            <span class="flex-1">{{ s.label }}</span>
            <span v-if="s.key === 'connect' && isConnected" class="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Conectado" />
          </button>
        </nav>
      </aside>

      <!-- ==================== CONTENT ==================== -->
      <main class="flex-1 min-w-0">
        <div
          v-if="message"
          class="mb-4 p-3 rounded-xl text-sm"
          :class="message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'"
        >
          {{ message }}
        </div>

        <!-- ========== CONECTAR IA ========== -->
        <section v-if="activeSection === 'connect'" class="space-y-5">
          <header>
            <h2 class="font-semibold text-lg text-gray-900">Conectar tu IA</h2>
            <p class="text-sm text-gray-500">Registra comidas, peso y ejercicios conversando con tu asistente.</p>
          </header>

          <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-5 text-white">
            <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <p class="text-xs font-medium uppercase tracking-wider text-emerald-100">Cómo funciona</p>
            <p class="mt-1 text-lg font-semibold">Una URL, entras con Google y tu IA se convierte en tu entrenador</p>
            <ol class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <li v-for="(step, i) in howItWorks" :key="i" class="flex items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2.5 text-sm">
                <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-emerald-700">{{ i + 1 }}</span>
                {{ step }}
              </li>
            </ol>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div
              v-for="p in platformList"
              :key="p.key"
              class="group relative flex flex-col rounded-2xl border-2 bg-white p-5 transition-all hover:shadow-lg"
              :class="platformConnected(p.name) ? 'border-emerald-200' : p.cardClass"
            >
              <div
                v-if="platformConnected(p.name)"
                class="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
              >
                <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Conectado
              </div>

              <div class="mb-4 flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-sm" :class="p.iconClass">{{ p.icon }}</div>
                <div>
                  <h3 class="font-semibold text-gray-900">{{ p.name }}</h3>
                  <p class="text-xs text-gray-400">{{ p.by }}</p>
                </div>
              </div>

              <div class="mb-4 flex flex-wrap gap-1.5">
                <span class="rounded-full bg-gray-900 px-2 py-0.5 text-[11px] font-medium text-white">Conector MCP</span>
                <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">{{ p.where }}</span>
              </div>

              <p class="mb-5 flex-1 text-sm leading-relaxed text-gray-500">{{ p.description }}</p>

              <button
                class="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
                :class="platformHasKey(p.name) ? p.softButtonClass : p.buttonClass"
                @click="connectTo(p.key)"
              >
                <template v-if="platformHasKey(p.name)">Ver cómo conectar</template>
                <template v-else>⚡ Conectar con {{ p.name }}</template>
              </button>
            </div>
          </div>

          <div v-if="apiKeys?.length" class="card">
            <h3 class="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">Conexiones activas</h3>
            <div class="divide-y divide-gray-100">
              <div v-for="key in apiKeys" :key="key.id" class="flex items-center justify-between gap-3 py-2.5">
                <div class="flex min-w-0 items-center gap-3">
                  <span class="text-lg">{{ key.label?.includes('Claude') ? '🤖' : key.label?.includes('ChatGPT') ? '💬' : '🔑' }}</span>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-gray-700">{{ key.label }}</p>
                    <p class="font-mono text-xs text-gray-400">{{ key.key_prefix }}…</p>
                  </div>
                </div>
                <div class="flex shrink-0 items-center gap-3">
                  <span v-if="key.last_used" class="text-xs text-emerald-600">Usado {{ new Date(key.last_used).toLocaleDateString('es-PE') }}</span>
                  <span v-else class="text-xs text-gray-400">Sin usar</span>
                  <button class="text-xs text-red-400 transition-colors hover:text-red-600" @click="deleteApiKey(key.id)">Desconectar</button>
                </div>
              </div>
            </div>
          </div>

          <p class="flex items-start gap-2 text-xs text-gray-400">
            <span>🔒</span>
            La conexión usa tu cuenta de Google: GoFit nunca comparte tu contraseña. Puedes desconectar cualquier app desde aquí.
          </p>
        </section>

        <!-- ========== OBJETIVOS ========== -->
        <section v-else-if="activeSection === 'goals'" class="space-y-6">
          <header>
            <h2 class="text-xl font-semibold tracking-tight text-gray-900">Mi peso</h2>
            <p class="mt-1 text-sm text-gray-500">Dónde estás y a dónde quieres llegar.</p>
          </header>

          <div class="grid gap-4 sm:grid-cols-2">
            <!-- Peso actual -->
            <div class="rounded-2xl border border-gray-200 bg-white p-6">
              <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Peso actual</p>
              <template v-if="!editingWeight && currentWeightKg !== null">
                <p class="mt-3 text-5xl font-semibold tracking-tight text-gray-900 tabular-nums">
                  {{ Number(currentWeightKg).toFixed(1) }}<span class="ml-1 text-xl font-normal text-gray-400">kg</span>
                </p>
                <div class="mt-4 flex items-center justify-between">
                  <span class="text-xs text-gray-400">Registrado {{ lastWeighDate ? relativeDay(lastWeighDate) : '' }}</span>
                  <button class="text-sm font-medium text-gray-900 hover:text-emerald-600" @click="startEditWeight">Actualizar</button>
                </div>
              </template>
              <form v-else class="mt-3" @submit.prevent="saveWeight">
                <p v-if="currentWeightKg === null" class="mb-3 text-sm text-gray-500">¿Cuánto pesas hoy? Será tu punto de partida.</p>
                <div class="flex items-baseline gap-2 border-b-2 border-gray-200 focus-within:border-emerald-500 transition-colors">
                  <input
                    v-model.number="weightInput"
                    type="number" step="0.1" min="30" max="300" inputmode="decimal" autofocus
                    class="w-full bg-transparent py-1 text-4xl font-semibold tracking-tight text-gray-900 outline-none tabular-nums placeholder:text-gray-300"
                    placeholder="75.0"
                  />
                  <span class="text-xl text-gray-400">kg</span>
                </div>
                <div class="mt-4 flex items-center justify-end gap-3">
                  <button v-if="currentWeightKg !== null" type="button" class="text-sm text-gray-400 hover:text-gray-600" @click="editingWeight = false">Cancelar</button>
                  <button
                    type="submit"
                    class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                    :disabled="!weightInput || savingWeight"
                  >
                    {{ savingWeight ? 'Guardando…' : 'Guardar' }}
                  </button>
                </div>
              </form>
            </div>

            <!-- Peso objetivo -->
            <div class="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
              <p class="text-xs font-medium uppercase tracking-wider text-emerald-700/70">Peso objetivo</p>
              <template v-if="!editingTarget && targetWeightKg !== null">
                <p class="mt-3 text-5xl font-semibold tracking-tight text-emerald-700 tabular-nums">
                  {{ targetWeightKg.toFixed(1) }}<span class="ml-1 text-xl font-normal text-emerald-600/50">kg</span>
                </p>
                <div class="mt-4 flex items-center justify-between">
                  <span class="text-xs text-emerald-700/60">{{ goalTypeLabels[currentGoal?.goal_type] ?? '' }}</span>
                  <button class="text-sm font-medium text-emerald-700 hover:text-emerald-900" @click="startEditTarget">Cambiar</button>
                </div>
              </template>
              <form v-else class="mt-3" @submit.prevent="saveTarget">
                <p v-if="targetWeightKg === null" class="mb-3 text-sm text-emerald-800/70">¿A qué peso quieres llegar?</p>
                <div class="flex items-baseline gap-2 border-b-2 border-emerald-200 focus-within:border-emerald-500 transition-colors">
                  <input
                    v-model.number="targetInput"
                    type="number" step="0.1" min="30" max="300" inputmode="decimal"
                    class="w-full bg-transparent py-1 text-4xl font-semibold tracking-tight text-emerald-700 outline-none tabular-nums placeholder:text-emerald-200"
                    placeholder="70.0"
                  />
                  <span class="text-xl text-emerald-600/50">kg</span>
                </div>
                <div class="mt-4 flex items-center justify-end gap-3">
                  <button v-if="targetWeightKg !== null" type="button" class="text-sm text-emerald-700/60 hover:text-emerald-800" @click="editingTarget = false">Cancelar</button>
                  <button
                    type="submit"
                    class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
                    :disabled="!targetInput || savingGoal"
                  >
                    {{ savingGoal ? 'Guardando…' : 'Guardar' }}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Progreso -->
          <div v-if="weightProgress" class="rounded-2xl border border-gray-200 bg-white p-6">
            <div class="flex items-baseline justify-between">
              <p class="text-sm text-gray-500">
                <template v-if="weightProgress.remaining < 0.05">🎉 ¡Llegaste a tu objetivo!</template>
                <template v-else>Te faltan <span class="font-semibold text-gray-900">{{ weightProgress.remaining.toFixed(1) }} kg</span></template>
              </p>
              <p class="text-sm font-semibold text-emerald-600 tabular-nums">{{ Math.round(weightProgress.pct) }}%</p>
            </div>
            <div class="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
              <div class="h-full rounded-full bg-emerald-500 transition-all duration-700" :style="{ width: `${weightProgress.pct}%` }" />
            </div>
            <div class="mt-2 flex justify-between text-xs text-gray-400 tabular-nums">
              <span>Inicio {{ weightProgress.start.toFixed(1) }} kg</span>
              <span>Meta {{ weightProgress.target.toFixed(1) }} kg</span>
            </div>
          </div>

          <!-- Datos corporales → máximo de calorías -->
          <div class="rounded-2xl border border-gray-200 bg-white p-6">
            <p class="text-sm font-medium text-gray-900">Tu máximo de calorías se calcula solo</p>
            <p class="mt-1 text-xs text-gray-500">
              Con tu peso, estatura, edad, sexo y actividad (fórmula Mifflin-St Jeor). Se recalcula con cada pesada y el déficit se suaviza al acercarte a tu meta.
            </p>
            <form class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4" @submit.prevent="saveBody">
              <label class="block">
                <span class="mb-1.5 block text-xs font-medium text-gray-500">Estatura (cm)</span>
                <input v-model.number="bodyForm.height_cm" type="number" min="100" max="250" inputmode="numeric" class="input" placeholder="170" />
              </label>
              <label class="block">
                <span class="mb-1.5 block text-xs font-medium text-gray-500">Edad</span>
                <input v-model.number="bodyForm.age" type="number" min="10" max="110" inputmode="numeric" class="input" placeholder="30" />
              </label>
              <label class="block">
                <span class="mb-1.5 block text-xs font-medium text-gray-500">Sexo</span>
                <select v-model="bodyForm.sex" class="input">
                  <option value="">—</option>
                  <option value="male">Hombre</option>
                  <option value="female">Mujer</option>
                </select>
              </label>
              <label class="block">
                <span class="mb-1.5 block text-xs font-medium text-gray-500">Actividad semanal</span>
                <select v-model="bodyForm.activity_level" class="input">
                  <option v-for="a in activityOptions" :key="a.key" :value="a.key">{{ a.label }} · {{ a.hint }}</option>
                </select>
              </label>
              <div class="col-span-2 flex justify-end sm:col-span-4">
                <button type="submit" class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40" :disabled="savingBody">
                  {{ savingBody ? 'Guardando…' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Más metas -->
          <details class="group rounded-2xl border border-gray-200 bg-white">
            <summary class="flex cursor-pointer list-none items-center justify-between p-6 text-sm font-medium text-gray-900">
              Más metas
              <span class="text-xs font-normal text-gray-400 group-open:hidden">Tipo de objetivo, masa muscular, calorías, proteína y agua</span>
              <span class="hidden text-gray-400 group-open:inline">−</span>
            </summary>
            <div class="space-y-5 border-t border-gray-100 p-6">
              <div>
                <p class="mb-2 text-xs font-medium text-gray-500">Mi objetivo</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="(label, key) in goalTypeLabels"
                    :key="key"
                    type="button"
                    class="rounded-full border px-3 py-1.5 text-sm transition-colors"
                    :class="goalForm.goal_type === key ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'"
                    @click="goalForm.goal_type = key"
                  >
                    {{ label }}
                  </button>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <label class="block">
                  <span class="mb-1.5 block text-xs font-medium text-gray-500">Masa muscular (kg)</span>
                  <input v-model.number="goalForm.target_muscle_mass_kg" type="number" step="0.1" min="10" max="150" class="input" placeholder="35.0" />
                </label>
                <label class="block">
                  <span class="mb-1.5 block text-xs font-medium text-gray-500">Calorías al día <span class="font-normal text-gray-400">(vacío = automático)</span></span>
                  <input v-model.number="goalForm.daily_calorie_target" type="number" step="50" min="800" max="8000" class="input" placeholder="auto" />
                </label>
                <label class="block">
                  <span class="mb-1.5 block text-xs font-medium text-gray-500">Proteína al día (g)</span>
                  <input v-model.number="goalForm.daily_protein_g" type="number" step="5" min="20" max="400" class="input" placeholder="120" />
                </label>
                <label class="block">
                  <span class="mb-1.5 block text-xs font-medium text-gray-500">Agua al día (ml)</span>
                  <input v-model.number="goalForm.daily_water_ml" type="number" step="100" min="500" max="10000" class="input" placeholder="2000" />
                </label>
              </div>
              <div class="flex justify-end">
                <button
                  class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                  :disabled="savingGoal"
                  @click="saveGoal()"
                >
                  {{ savingGoal ? 'Guardando…' : 'Guardar metas' }}
                </button>
              </div>
            </div>
          </details>
        </section>

        <!-- ========== ENTRENADOR ========== -->
        <section v-else-if="activeSection === 'trainer'" class="space-y-4">
          <header>
            <h2 class="font-semibold text-lg text-gray-900">Mi entrenador</h2>
            <p class="text-sm text-gray-500">Elige cómo quieres que te hable tu IA y personalízalo a tu gusto.</p>
          </header>

          <div class="card">
            <p class="text-xs font-medium text-gray-500 mb-2">1. Elige un estilo</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
              <button
                v-for="p in trainerPresets"
                :key="p.key"
                class="flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm"
                :class="form.trainer_prompt === p.prompt ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-gray-100 hover:border-gray-200 text-gray-600'"
                @click="form.trainer_prompt = p.prompt"
              >
                <span class="text-2xl">{{ p.emoji }}</span>
                <span class="font-medium">{{ p.label }}</span>
              </button>
            </div>

            <p class="text-xs font-medium text-gray-500 mb-2">2. Personalízalo</p>
            <div class="rounded-xl border border-gray-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all bg-white">
              <textarea
                v-model="form.trainer_prompt"
                rows="5"
                maxlength="1500"
                class="w-full resize-y rounded-t-xl px-4 py-3 text-sm leading-relaxed text-gray-800 placeholder:text-gray-400 focus:outline-none"
                placeholder="Ej: Eres un entrenador que me habla como amigo, me recuerda pesarme cada mañana y me felicita cuando tomo agua..."
              />
              <div class="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/60 rounded-b-xl">
                <span class="text-xs text-gray-400">{{ form.trainer_prompt.length }}/1500</span>
                <div class="flex items-center gap-2">
                  <span v-if="!trainerSaved" class="text-xs text-amber-600">Cambios sin guardar</span>
                  <button
                    class="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium px-4 py-1.5 rounded-lg transition-colors text-sm"
                    :disabled="saving || trainerSaved"
                    @click="saveProfile('Entrenador guardado')"
                  >
                    {{ saving ? 'Guardando...' : 'Guardar' }}
                  </button>
                </div>
              </div>
            </div>
            <p class="mt-2 text-xs text-gray-400">
              ✨ Si conectaste Claude con GoFit, se aplica automáticamente. No necesitas copiar nada.
            </p>
          </div>

          <div class="card">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div>
                <p class="text-xs font-medium text-gray-500">3. Copia el prompt completo (opcional)</p>
                <p class="text-xs text-gray-400 mt-0.5">Para usarlo en Claude o ChatGPT sin conexión, o en otra cuenta.</p>
              </div>
              <button
                class="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="copied === 'trainer' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-900 hover:bg-gray-800 text-white'"
                @click="copyToClipboard(fullTrainerPrompt, 'trainer')"
              >
                {{ copied === 'trainer' ? '✓ Copiado' : '📋 Copiar prompt' }}
              </button>
            </div>
            <pre class="max-h-56 overflow-y-auto whitespace-pre-wrap p-4 bg-gray-900 text-gray-100 rounded-xl text-xs leading-relaxed font-mono">{{ fullTrainerPrompt }}</pre>

            <p class="text-xs font-medium text-gray-500 mt-5 mb-2">¿Dónde lo pego?</p>
            <div class="grid sm:grid-cols-2 gap-3">
              <div v-for="g in pasteGuides" :key="g.title" class="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p class="text-sm font-semibold text-gray-800 mb-2">{{ g.icon }} {{ g.title }}</p>
                <ol class="space-y-1.5">
                  <li v-for="(step, i) in g.steps" :key="i" class="flex gap-2 text-xs text-gray-600">
                    <span class="shrink-0 w-4 h-4 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] font-bold">{{ i + 1 }}</span>
                    {{ step }}
                  </li>
                </ol>
                <p class="mt-2 text-[11px] text-gray-400 leading-snug">{{ g.alt }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- ========== UBICACIÓN ========== -->
        <section v-else-if="activeSection === 'location'" class="space-y-4">
          <header>
            <h2 class="font-semibold text-lg text-gray-900">¿Dónde estás?</h2>
            <p class="text-sm text-gray-500">Tu entrenador ajusta la hora del día y te sugiere comidas que se consiguen donde estás.</p>
          </header>

          <div
            v-if="currentLocation && !editingLocation"
            class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-5 text-white"
          >
            <div class="absolute -right-6 -bottom-8 text-[120px] leading-none opacity-20 select-none">{{ countryFlag(currentLocation.country.code) }}</div>
            <p class="text-xs font-medium uppercase tracking-wider text-sky-100">Estás en</p>
            <p class="mt-1 text-2xl font-bold">
              {{ countryFlag(currentLocation.country.code) }}
              {{ currentLocation.city ? `${currentLocation.city}, ` : '' }}{{ currentLocation.country.name }}
            </p>
            <p class="mt-1 text-sm text-sky-100">
              🕐 Hora de {{ timezoneLabel(currentLocation.timezone) }} · desde el {{ formatDay(currentLocation.started_at) }}
            </p>
            <button
              class="relative mt-4 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-white/25"
              @click="startEditLocation"
            >
              ✈️ Cambié de lugar
            </button>
          </div>

          <div v-if="showLocationForm" class="card space-y-4">
            <p class="text-sm font-medium text-gray-900">
              {{ currentLocation ? '¿A dónde te moviste?' : 'Cuéntanos dónde estás ahora' }}
            </p>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-500">País</label>
                <select v-model="locationForm.country_code" class="input">
                  <option v-for="c in countryOptions" :key="c.code" :value="c.code">{{ c.flag }} {{ c.name }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-500">Ciudad</label>
                <input v-model="locationForm.city" class="input" placeholder="Lima" maxlength="80" />
              </div>
            </div>
            <div v-if="timezoneOptions.length > 1">
              <label class="mb-1.5 block text-xs font-medium text-gray-500">Zona horaria</label>
              <select v-model="locationForm.timezone" class="input">
                <option v-for="tz in timezoneOptions" :key="tz" :value="tz">{{ timezoneLabel(tz) }}</option>
              </select>
            </div>
            <div class="flex items-center justify-end gap-3">
              <button
                v-if="editingLocation"
                class="text-sm text-gray-500 transition-colors hover:text-gray-700"
                @click="editingLocation = false"
              >
                Cancelar
              </button>
              <button
                class="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
                :disabled="savingLocation"
                @click="saveLocation"
              >
                {{ savingLocation ? 'Guardando...' : 'Guardar ubicación' }}
              </button>
            </div>
            <p class="text-xs text-gray-400">💬 También puedes decirle a tu IA: "estoy en Santiago" y lo actualiza sola.</p>
          </div>

          <div v-if="pastLocations.length" class="card">
            <h3 class="mb-4 text-xs font-medium uppercase tracking-wider text-gray-400">Lugares anteriores</h3>
            <ol class="relative ml-2 space-y-4 border-l border-gray-200">
              <li v-for="loc in pastLocations" :key="loc.id" class="ml-5">
                <span class="absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm ring-2 ring-gray-100">
                  {{ countryFlag(loc.country.code) }}
                </span>
                <p class="text-sm font-medium text-gray-800">{{ loc.city ? `${loc.city}, ` : '' }}{{ loc.country.name }}</p>
                <p class="text-xs text-gray-400">{{ formatDay(loc.started_at) }} → {{ loc.ended_at ? formatDay(loc.ended_at) : 'hoy' }}</p>
              </li>
            </ol>
          </div>
        </section>

        <!-- ========== PERFIL ========== -->
        <section v-else-if="activeSection === 'profile'" class="space-y-4">
          <header>
            <h2 class="font-semibold text-lg text-gray-900">Perfil</h2>
            <p class="text-sm text-gray-500">Tus datos vienen de tu cuenta de Google.</p>
          </header>

          <div class="card">
            <div class="flex items-center gap-4 mb-6">
              <img
                v-if="googleAvatar"
                :src="googleAvatar"
                :alt="googleName"
                class="w-14 h-14 rounded-full ring-2 ring-emerald-100 shadow-sm"
                referrerpolicy="no-referrer"
              />
              <div v-else class="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-xl font-bold text-emerald-700">
                {{ googleName.charAt(0) || '?' }}
              </div>
              <div>
                <p class="font-semibold text-lg text-gray-900">{{ googleName || 'Usuario' }}</p>
                <p class="text-sm text-gray-400">{{ googleEmail }}</p>
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label class="text-xs font-medium text-gray-500 mb-1.5 block">Sistema de medidas</label>
                <select v-model="form.measurement_system" class="input">
                  <option value="grams">Gramos (preciso)</option>
                  <option value="reference">Porciones (puño, taza, mano)</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 mb-1.5 block">Preferencia de cocina</label>
                <select v-model="form.cooking_preference" class="input">
                  <option value="simple">Simple / rápido</option>
                  <option value="full">Cocino a detalle</option>
                  <option value="no_cooking">No cocino</option>
                  <option value="eating_out">Como afuera</option>
                </select>
              </div>
            </div>

            <div class="flex justify-end">
              <button
                class="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"
                :disabled="saving"
                @click="saveProfile()"
              >
                {{ saving ? 'Guardando...' : 'Guardar preferencias' }}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>

    <!-- ==================== CONNECTION MODAL ==================== -->
    <Teleport to="body">
      <div
        v-if="showKeyModal && activePlatform"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          <div class="mb-5 flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl text-xl" :class="activePlatform.iconClass">{{ activePlatform.icon }}</div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">Conectar con {{ activePlatform.name }}</h3>
              <p class="text-xs text-gray-500">Funciona en {{ activePlatform.where }}</p>
            </div>
          </div>

          <ol class="space-y-4">
            <li class="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p class="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900">
                <span class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">1</span>
                Copia la URL de GoFit
              </p>
              <div class="flex items-stretch gap-2">
                <code class="flex-1 select-all break-all rounded-lg border border-gray-200 bg-white p-3 font-mono text-sm text-gray-800">{{ mcpUrl }}</code>
                <button
                  class="shrink-0 rounded-lg px-4 text-sm font-medium transition-colors"
                  :class="copied === 'url' ? 'bg-emerald-100 text-emerald-700' : activePlatform.buttonClass"
                  @click="copyToClipboard(mcpUrl, 'url')"
                >
                  {{ copied === 'url' ? '✓ Copiada' : 'Copiar' }}
                </button>
              </div>
              <p class="mt-2 text-xs text-gray-500">Es la misma para todos. Tu cuenta se conecta al entrar con Google.</p>
            </li>

            <li class="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p class="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900">
                <span class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">2</span>
                Pégala en {{ activePlatform.name }}
              </p>
              <ol class="ml-8 space-y-2">
                <li v-for="(step, i) in activePlatform.steps" :key="i" class="flex gap-2 text-sm text-gray-600">
                  <span class="shrink-0 text-gray-400">{{ String.fromCharCode(97 + i) }}.</span>
                  {{ step }}
                </li>
              </ol>
              <a
                :href="activePlatform.link"
                target="_blank"
                rel="noopener"
                class="ml-8 mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 underline decoration-gray-300 underline-offset-4 hover:decoration-gray-900"
              >
                Abrir {{ activePlatform.name }} ↗
              </a>
              <p class="ml-8 mt-2 text-[11px] leading-snug text-gray-400">Los nombres de los menús pueden variar un poco según la versión de la app.</p>
            </li>

            <li class="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p class="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-900">
                <span class="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">3</span>
                Pruébalo
              </p>
              <div class="ml-8 flex flex-wrap gap-1.5">
                <span v-for="ex in examplePhrases" :key="ex" class="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs text-emerald-800">"{{ ex }}"</span>
              </div>
            </li>
          </ol>

          <details class="mt-4 rounded-xl border border-gray-100 p-4">
            <summary class="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-700">
              ¿Tu app no te pide iniciar sesión? Usa una URL con key
            </summary>
            <p class="mt-3 text-xs text-gray-500">
              Genera una URL personal y, en la app, elige <b>"Sin autenticación"</b>. Funciona como una contraseña: no la compartas.
            </p>
            <button
              v-if="!generatedKey"
              class="mt-3 rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              :disabled="generatingKey"
              @click="generateKeyUrl"
            >
              {{ generatingKey ? 'Generando...' : 'Generar URL con key' }}
            </button>
            <div v-else class="mt-3">
              <div class="flex items-stretch gap-2">
                <code class="flex-1 select-all break-all rounded-lg border border-gray-200 bg-gray-50 p-2.5 font-mono text-xs text-gray-700">{{ keyUrl }}</code>
                <button
                  class="shrink-0 rounded-lg bg-gray-900 px-3 text-xs font-medium text-white transition-colors hover:bg-gray-800"
                  @click="copyToClipboard(keyUrl, 'keyurl')"
                >
                  {{ copied === 'keyurl' ? '✓' : 'Copiar' }}
                </button>
              </div>
              <p class="mt-2 text-xs text-amber-600">⚠️ Solo se muestra esta vez.</p>
            </div>
          </details>

          <button class="btn-secondary mt-5 w-full justify-center" @click="closeModal">Listo</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
