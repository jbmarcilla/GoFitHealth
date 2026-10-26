<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type SectionKey = 'connect' | 'goals' | 'trainer' | 'profile'

const route = useRoute()
const router = useRouter()
const user = useSupabaseUser()
const config = useRuntimeConfig()
const saving = ref(false)
const message = ref('')
const generatedKey = ref('')
const showKeyModal = ref(false)
const connectingTo = ref<'claude' | 'chatgpt' | null>(null)
const copied = ref('')

const sections: Array<{ key: SectionKey; icon: string; label: string; hint: string }> = [
  { key: 'connect', icon: '🔌', label: 'Conectar IA', hint: 'Claude y ChatGPT' },
  { key: 'goals', icon: '🎯', label: 'Objetivos', hint: 'Peso y metas' },
  { key: 'trainer', icon: '🧑‍🏫', label: 'Mi entrenador', hint: 'Personalidad de la IA' },
  { key: 'profile', icon: '👤', label: 'Perfil', hint: 'Cuenta y preferencias' },
]

const activeSection = ref<SectionKey>(
  sections.some(s => s.key === route.query.tab) ? route.query.tab as SectionKey : 'connect',
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

const goalForm = reactive({
  goal_type: 'athletic' as string,
  target_weight_kg: null as number | null,
  target_muscle_mass_kg: null as number | null,
  daily_calorie_target: null as number | null,
  daily_water_ml: 2000 as number,
})

watch(profile, (p: any) => {
  if (p) {
    form.measurement_system = p.measurement_system || 'grams'
    form.cooking_preference = p.cooking_preference || 'simple'
    form.trainer_prompt = p.trainer_prompt || ''
  }
}, { immediate: true })

watch(currentGoal, (g: any) => {
  if (g) {
    goalForm.goal_type = g.goal_type || 'athletic'
    goalForm.target_weight_kg = g.target_weight_kg || null
    goalForm.target_muscle_mass_kg = g.target_muscle_mass_kg || null
    goalForm.daily_calorie_target = g.daily_calorie_target || null
    goalForm.daily_water_ml = g.daily_water_ml || 2000
  }
}, { immediate: true })

const isConnected = computed(() => apiKeys.value?.some((k: any) => k.last_used) ?? false)
const hasKey = computed(() => (apiKeys.value?.length ?? 0) > 0)

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

// ---------- Objetivos ----------
const initialWeight = ref<number | null>(null)
const savingWeight = ref(false)
const savingGoal = ref(false)

async function saveInitialWeight() {
  if (!initialWeight.value) return
  savingWeight.value = true
  message.value = ''
  try {
    await $fetch('/api/weight', { method: 'POST', body: { weight_kg: initialWeight.value, notes: 'Peso inicial' } })
    message.value = 'Peso inicial registrado'
    initialWeight.value = null
    await refreshWeight()
  } catch (e: any) {
    showError(e)
  }
  savingWeight.value = false
}

async function saveGoal() {
  savingGoal.value = true
  message.value = ''
  try {
    await $fetch('/api/goals', { method: 'POST', body: goalForm })
    message.value = 'Objetivo actualizado'
    await refreshGoal()
  } catch (e: any) {
    showError(e)
  }
  savingGoal.value = false
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
async function connectTo(platform: 'claude' | 'chatgpt') {
  connectingTo.value = platform
  message.value = ''
  try {
    const res = await $fetch<{ key: string }>('/api/me/api-keys', {
      method: 'POST',
      body: { label: platform === 'claude' ? 'Claude Desktop' : 'ChatGPT' },
    })
    generatedKey.value = res.key
    showKeyModal.value = true
    await refreshKeys()
  } catch (e: any) {
    showError(e)
    connectingTo.value = null
  }
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

const mcpServerConfig = computed(() => ({
  gofit: {
    command: 'npx',
    args: ['-y', 'gofit-mcp'],
    env: {
      GOFIT_API_KEY: generatedKey.value,
      SUPABASE_URL: 'https://fquatxoudkhzxafmzbir.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'YOUR_SERVICE_ROLE_KEY',
    },
  },
}))

const claudeConfig = computed(() => JSON.stringify({ mcpServers: mcpServerConfig.value }, null, 2))
const claudeDeepLink = computed(() => `claude://mcp/install?config=${encodeURIComponent(JSON.stringify(mcpServerConfig.value))}`)

function closeModal() {
  showKeyModal.value = false
  connectingTo.value = null
  generatedKey.value = ''
}

const { signOut } = useAuth()
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Ajustes</h1>
      <p class="text-sm text-gray-500">Configura tu cuenta, tus metas y tu entrenador.</p>
    </div>

    <div class="flex flex-col md:flex-row gap-6">
      <!-- ==================== SIDEBAR ==================== -->
      <aside class="md:w-56 shrink-0">
        <!-- Mobile: tabs -->
        <nav class="md:hidden flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          <button
            v-for="s in sections"
            :key="s.key"
            class="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors"
            :class="activeSection === s.key ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600'"
            @click="selectSection(s.key)"
          >
            <span>{{ s.icon }}</span>{{ s.label }}
          </button>
        </nav>

        <!-- Desktop: sidebar -->
        <div class="hidden md:block sticky top-24">
          <div class="flex items-center gap-3 p-3 mb-3">
            <img
              v-if="googleAvatar"
              :src="googleAvatar"
              :alt="googleName"
              class="w-10 h-10 rounded-full ring-2 ring-emerald-100"
              referrerpolicy="no-referrer"
            />
            <div v-else class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">
              {{ googleName.charAt(0) || '?' }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ googleName || 'Usuario' }}</p>
              <p class="text-xs text-gray-400 truncate">{{ googleEmail }}</p>
            </div>
          </div>

          <nav class="space-y-1">
            <button
              v-for="s in sections"
              :key="s.key"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
              :class="activeSection === s.key ? 'bg-emerald-50 text-emerald-800' : 'text-gray-600 hover:bg-gray-50'"
              @click="selectSection(s.key)"
            >
              <span class="text-lg">{{ s.icon }}</span>
              <span class="flex-1 min-w-0">
                <span class="block text-sm font-medium">{{ s.label }}</span>
                <span class="block text-xs text-gray-400 truncate">{{ s.hint }}</span>
              </span>
              <span v-if="s.key === 'connect' && isConnected" class="w-2 h-2 rounded-full bg-emerald-500" title="Conectado" />
            </button>
          </nav>

          <button
            class="mt-6 w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-600 transition-colors"
            @click="signOut"
          >
            Cerrar sesión
          </button>
        </div>
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
        <section v-if="activeSection === 'connect'" class="space-y-4">
          <header>
            <h2 class="font-semibold text-lg text-gray-900">Conectar tu IA</h2>
            <p class="text-sm text-gray-500">Registra comidas, peso y ejercicios conversando con tu asistente.</p>
          </header>

          <div class="grid sm:grid-cols-2 gap-4">
            <div
              class="relative card border-2 transition-all hover:shadow-md"
              :class="hasKey ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100 hover:border-violet-200'"
            >
              <div v-if="isConnected" class="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full">
                <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Conectado
              </div>
              <div class="flex items-center gap-3 mb-3">
                <div class="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-50 rounded-xl flex items-center justify-center text-2xl shadow-sm">🤖</div>
                <div>
                  <h3 class="font-semibold text-gray-900">Claude</h3>
                  <p class="text-xs text-gray-400">Anthropic · MCP nativo</p>
                </div>
              </div>
              <p class="text-xs text-gray-500 mb-4 leading-relaxed">
                Claude Desktop soporta MCP de forma nativa. Conecta y empieza a registrar desde el chat.
              </p>
              <button
                class="w-full font-medium px-4 py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                :class="hasKey ? 'bg-violet-50 hover:bg-violet-100 text-violet-700' : 'bg-violet-600 hover:bg-violet-700 text-white'"
                @click="connectTo('claude')"
              >
                <template v-if="hasKey">Generar nueva conexión</template>
                <template v-else><span>⚡</span> Conectar con Claude</template>
              </button>
            </div>

            <div class="card border-2 border-gray-100 hover:border-green-200 transition-all hover:shadow-md">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-12 h-12 bg-gradient-to-br from-green-100 to-teal-50 rounded-xl flex items-center justify-center text-2xl shadow-sm">💬</div>
                <div>
                  <h3 class="font-semibold text-gray-900">ChatGPT</h3>
                  <p class="text-xs text-gray-400">OpenAI · vía API key</p>
                </div>
              </div>
              <p class="text-xs text-gray-500 mb-4 leading-relaxed">
                Usa GoFit desde ChatGPT con un GPT personalizado. Configuras la API key una vez.
              </p>
              <button
                class="w-full bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                @click="connectTo('chatgpt')"
              >
                <span>🔑</span> Generar API Key
              </button>
            </div>
          </div>

          <div v-if="apiKeys?.length" class="card">
            <h3 class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Conexiones activas</h3>
            <div class="divide-y divide-gray-100">
              <div v-for="key in apiKeys" :key="key.id" class="flex items-center justify-between py-2.5 gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="text-lg">{{ key.label?.includes('Claude') ? '🤖' : key.label?.includes('ChatGPT') ? '💬' : '🔑' }}</span>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-700 truncate">{{ key.label }}</p>
                    <p class="font-mono text-xs text-gray-400">{{ key.key_prefix }}…</p>
                  </div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <span v-if="key.last_used" class="text-xs text-emerald-600">
                    Usado {{ new Date(key.last_used).toLocaleDateString('es-PE') }}
                  </span>
                  <span v-else class="text-xs text-gray-400">Sin usar</span>
                  <button class="text-xs text-red-400 hover:text-red-600 transition-colors" @click="deleteApiKey(key.id)">
                    Desconectar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ========== OBJETIVOS ========== -->
        <section v-else-if="activeSection === 'goals'" class="space-y-4">
          <header>
            <h2 class="font-semibold text-lg text-gray-900">Mis objetivos</h2>
            <p class="text-sm text-gray-500">Define tus metas para que GoFit te acompañe mejor.</p>
          </header>

          <div class="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
            <div class="flex items-start justify-between gap-4">
              <div>
                <span class="text-xs font-medium text-blue-500 uppercase tracking-wider">Peso actual</span>
                <p v-if="currentWeightKg" class="text-3xl font-bold text-gray-900 mt-0.5">{{ currentWeightKg }} kg</p>
                <div v-else class="mt-1.5">
                  <p class="text-xs text-gray-500 mb-2">Registra tu peso de hoy como punto de partida.</p>
                  <div class="flex items-center gap-2">
                    <input v-model.number="initialWeight" type="number" step="0.1" min="30" max="300" class="input !w-28" placeholder="75.0" />
                    <span class="text-sm text-gray-500">kg</span>
                    <button
                      class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-xl transition-colors text-sm"
                      :disabled="!initialWeight || savingWeight"
                      @click="saveInitialWeight"
                    >
                      {{ savingWeight ? 'Guardando...' : 'Registrar' }}
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="currentGoal?.target_weight_kg" class="text-right">
                <span class="text-xs font-medium text-blue-500 uppercase tracking-wider">Objetivo</span>
                <p class="text-3xl font-bold text-gray-900 mt-0.5">{{ currentGoal.target_weight_kg }} kg</p>
                <p
                  v-if="currentWeightKg"
                  class="text-xs font-semibold"
                  :class="Number(currentWeightKg) > Number(currentGoal.target_weight_kg) ? 'text-amber-600' : 'text-emerald-600'"
                >
                  Faltan {{ Math.abs(Number(currentWeightKg) - Number(currentGoal.target_weight_kg)).toFixed(1) }} kg
                </p>
              </div>
            </div>
          </div>

          <div class="card space-y-4">
            <div>
              <label class="text-xs font-medium text-gray-500 mb-1.5 block">Mi objetivo</label>
              <select v-model="goalForm.goal_type" class="input">
                <option v-for="(label, key) in goalTypeLabels" :key="key" :value="key">{{ label }}</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-medium text-gray-500 mb-1.5 block">Peso objetivo (kg)</label>
                <input v-model.number="goalForm.target_weight_kg" type="number" step="0.1" min="30" max="300" class="input" placeholder="70.0" />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 mb-1.5 block">Masa muscular obj. (kg)</label>
                <input v-model.number="goalForm.target_muscle_mass_kg" type="number" step="0.1" min="10" max="150" class="input" placeholder="35.0" />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 mb-1.5 block">Calorías diarias</label>
                <input v-model.number="goalForm.daily_calorie_target" type="number" step="50" min="800" max="8000" class="input" placeholder="2000" />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 mb-1.5 block">Agua diaria (ml)</label>
                <input v-model.number="goalForm.daily_water_ml" type="number" step="100" min="500" max="10000" class="input" placeholder="2000" />
              </div>
            </div>
            <div class="flex justify-end">
              <button
                class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"
                :disabled="savingGoal"
                @click="saveGoal"
              >
                {{ savingGoal ? 'Guardando...' : 'Guardar objetivo' }}
              </button>
            </div>
          </div>
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

            <div class="flex items-center justify-between">
              <button class="md:hidden text-sm text-red-400 hover:text-red-600 transition-colors" @click="signOut">
                Cerrar sesión
              </button>
              <button
                class="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"
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
      <div v-if="showKeyModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <template v-if="connectingTo === 'claude'">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-xl">🤖</div>
              <div>
                <h3 class="font-bold text-lg text-gray-900">Conectar con Claude</h3>
                <p class="text-xs text-gray-500">Solo 2 pasos para empezar</p>
              </div>
            </div>

            <div class="mb-4 p-4 bg-violet-50 rounded-xl border border-violet-100">
              <div class="flex items-center gap-2 mb-2">
                <span class="w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span class="font-medium text-sm text-gray-900">Instalar en Claude Desktop</span>
              </div>
              <p class="text-xs text-gray-500 mb-3 ml-8">Haz clic y Claude Desktop configurará todo automáticamente.</p>
              <a
                :href="claudeDeepLink"
                class="ml-8 inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                ⚡ Instalar en Claude Desktop
              </a>
            </div>

            <div class="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div class="flex items-center gap-2 mb-2">
                <span class="w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span class="font-medium text-sm text-gray-900">Tu API Key</span>
              </div>
              <p class="text-xs text-gray-500 mb-2 ml-8">Guarda esta key — no se mostrará de nuevo.</p>
              <div class="ml-8 flex items-center gap-2">
                <code class="flex-1 p-2.5 bg-white border border-gray-200 rounded-lg font-mono text-xs break-all select-all">{{ generatedKey }}</code>
                <button class="shrink-0 p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" @click="copyToClipboard(generatedKey, 'key')">
                  <span v-if="copied === 'key'" class="text-emerald-600 text-xs">✓</span>
                  <span v-else class="text-gray-500 text-xs">📋</span>
                </button>
              </div>
            </div>

            <details class="mb-4">
              <summary class="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">¿Prefieres configurar manualmente?</summary>
              <div class="mt-2 p-3 bg-gray-50 rounded-xl">
                <p class="text-xs text-gray-500 mb-2">
                  Copia este JSON en tu <code class="bg-gray-200 px-1 rounded">claude_desktop_config.json</code>:
                </p>
                <div class="relative">
                  <pre class="p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto">{{ claudeConfig }}</pre>
                  <button
                    class="absolute top-2 right-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
                    @click="copyToClipboard(claudeConfig, 'config')"
                  >
                    {{ copied === 'config' ? '✓ Copiado' : 'Copiar' }}
                  </button>
                </div>
              </div>
            </details>

            <div class="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p class="font-medium text-sm text-emerald-800 mb-2">¡Listo! Prueba decirle a Claude:</p>
              <ul class="space-y-1 text-xs text-emerald-700">
                <li>💬 "Hoy peso 75 kg"</li>
                <li>💬 "Desayuné 2 huevos y un pan con palta"</li>
                <li>💬 "Tomé un vaso de agua"</li>
                <li>💬 "¿Cómo va mi semana?"</li>
              </ul>
            </div>
          </template>

          <template v-else-if="connectingTo === 'chatgpt'">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">💬</div>
              <div>
                <h3 class="font-bold text-lg text-gray-900">Conectar con ChatGPT</h3>
                <p class="text-xs text-gray-500">Usa tu API Key en un GPT personalizado</p>
              </div>
            </div>

            <div class="mb-4 p-4 bg-green-50 rounded-xl border border-green-100">
              <p class="font-medium text-sm text-gray-900 mb-2">Tu API Key</p>
              <p class="text-xs text-gray-500 mb-2">Guarda esta key — no se mostrará de nuevo.</p>
              <div class="flex items-center gap-2">
                <code class="flex-1 p-2.5 bg-white border border-gray-200 rounded-lg font-mono text-xs break-all select-all">{{ generatedKey }}</code>
                <button class="shrink-0 p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" @click="copyToClipboard(generatedKey, 'key')">
                  <span v-if="copied === 'key'" class="text-emerald-600 text-xs">✓</span>
                  <span v-else class="text-gray-500 text-xs">📋</span>
                </button>
              </div>
            </div>

            <div class="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p class="font-medium text-sm text-amber-800 mb-2">Cómo usarlo en ChatGPT:</p>
              <ol class="space-y-2 text-xs text-amber-700 list-decimal list-inside">
                <li>Crea un GPT personalizado en ChatGPT</li>
                <li>En "Actions", configura la API de GoFit con esta key como Bearer token</li>
                <li>Los endpoints están en: <code class="bg-amber-100 px-1 rounded">{{ config.public.siteUrl }}/api/</code></li>
                <li>Pega el prompt de "Mi entrenador" en sus Instrucciones</li>
              </ol>
            </div>
          </template>

          <button class="mt-4 w-full btn-secondary justify-center" @click="closeModal">Cerrar</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
