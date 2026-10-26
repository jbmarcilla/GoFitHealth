<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const user = useSupabaseUser()
const config = useRuntimeConfig()
const saving = ref(false)
const message = ref('')
const newKeyLabel = ref('')
const generatedKey = ref('')
const showKeyModal = ref(false)
const connectingTo = ref<'claude' | 'chatgpt' | null>(null)
const copied = ref('')

const { data: profile, refresh: refreshProfile } = await useFetch('/api/me/profile')
const { data: apiKeys, refresh: refreshKeys } = await useFetch<any[]>('/api/me/api-keys')
const { data: currentGoal, refresh: refreshGoal } = await useFetch<any>('/api/goals')
const { data: latestWeight } = await useFetch<any[]>('/api/weight', { params: { limit: 1 } })

const googleName = computed(() => user.value?.user_metadata?.full_name || user.value?.user_metadata?.name || '')
const googleAvatar = computed(() => user.value?.user_metadata?.avatar_url || '')
const googleEmail = computed(() => user.value?.email || '')

const currentWeightKg = computed(() => {
  if (!latestWeight.value?.length) return null
  return latestWeight.value[0].weight_kg
})

const form = reactive({
  measurement_system: 'grams' as string,
  cooking_preference: 'simple' as string,
})

const goalForm = reactive({
  goal_type: 'athletic' as string,
  target_weight_kg: null as number | null,
  target_muscle_mass_kg: null as number | null,
  daily_calorie_target: null as number | null,
  daily_water_ml: 2000 as number,
})

const savingGoal = ref(false)

watch(profile, (p: any) => {
  if (p) {
    form.measurement_system = p.measurement_system || 'grams'
    form.cooking_preference = p.cooking_preference || 'simple'
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

const isConnected = computed(() => {
  if (!apiKeys.value?.length) return false
  return apiKeys.value.some((k: any) => k.last_used)
})

const hasKey = computed(() => (apiKeys.value?.length ?? 0) > 0)

async function saveProfile() {
  saving.value = true
  message.value = ''
  try {
    await $fetch('/api/me/profile', { method: 'PATCH', body: {
      display_name: googleName.value,
      ...form,
    }})
    message.value = 'Preferencias guardadas'
    await refreshProfile()
  } catch (e: any) {
    message.value = `Error: ${e.data?.message || e.message}`
  }
  saving.value = false
}

async function saveGoal() {
  savingGoal.value = true
  message.value = ''
  try {
    await $fetch('/api/goals', { method: 'POST', body: goalForm })
    message.value = 'Objetivo actualizado'
    await refreshGoal()
  } catch (e: any) {
    message.value = `Error: ${e.data?.message || e.message}`
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

async function connectTo(platform: 'claude' | 'chatgpt') {
  connectingTo.value = platform
  const label = platform === 'claude' ? 'Claude Desktop' : 'ChatGPT'
  newKeyLabel.value = label

  try {
    const res = await $fetch<{ key: string; id: string }>('/api/me/api-keys', {
      method: 'POST',
      body: { label },
    })
    generatedKey.value = res.key
    showKeyModal.value = true
    await refreshKeys()
  } catch (e: any) {
    message.value = `Error: ${e.data?.message || e.message}`
    connectingTo.value = null
  }
}

async function deleteApiKey(id: string) {
  if (!confirm('¿Desconectar esta integración?')) return
  try {
    await $fetch(`/api/me/api-keys/${id}`, { method: 'DELETE' })
    await refreshKeys()
  } catch (e: any) {
    message.value = `Error: ${e.data?.message || e.message}`
  }
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text)
  copied.value = label
  setTimeout(() => { copied.value = '' }, 2000)
}

const claudeConfig = computed(() => {
  return JSON.stringify({
    mcpServers: {
      gofit: {
        command: 'npx',
        args: ['-y', 'gofit-mcp'],
        env: {
          GOFIT_API_KEY: generatedKey.value,
          SUPABASE_URL: 'https://fquatxoudkhzxafmzbir.supabase.co',
          SUPABASE_SERVICE_ROLE_KEY: 'YOUR_SERVICE_ROLE_KEY',
        },
      },
    },
  }, null, 2)
})

const claudeDeepLink = computed(() => {
  const serverConfig = {
    gofit: {
      command: 'npx',
      args: ['-y', 'gofit-mcp'],
      env: {
        GOFIT_API_KEY: generatedKey.value,
        SUPABASE_URL: 'https://fquatxoudkhzxafmzbir.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'YOUR_SERVICE_ROLE_KEY',
      },
    },
  }
  return `claude://mcp/install?config=${encodeURIComponent(JSON.stringify(serverConfig))}`
})

function closeModal() {
  showKeyModal.value = false
  connectingTo.value = null
  generatedKey.value = ''
}

const { signOut } = useAuth()
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">Ajustes</h1>
    <p class="text-sm text-gray-500 mb-8">Configura tu perfil y conecta tu IA favorita.</p>

    <div v-if="message" class="mb-6 p-3 rounded-xl text-sm" :class="message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'">
      {{ message }}
    </div>

    <!-- ==================== CONECTAR IA ==================== -->
    <section class="mb-8">
      <div class="flex items-center gap-2 mb-4">
        <span class="text-xl">🔌</span>
        <h2 class="font-semibold text-lg text-gray-900">Conectar tu IA</h2>
      </div>
      <p class="text-sm text-gray-500 mb-5">
        Conecta GoFit con tu asistente de IA para registrar comidas, peso y ejercicios por chat.
      </p>

      <div class="grid sm:grid-cols-2 gap-4">
        <!-- Claude Card -->
        <div class="relative card border-2 transition-all hover:shadow-md" :class="hasKey ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100 hover:border-violet-200'">
          <div v-if="isConnected" class="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full">
            <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Conectado
          </div>

          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-50 rounded-xl flex items-center justify-center text-2xl shadow-sm">
              🤖
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Claude</h3>
              <p class="text-xs text-gray-400">Anthropic · MCP nativo</p>
            </div>
          </div>

          <p class="text-xs text-gray-500 mb-4 leading-relaxed">
            Claude Desktop soporta MCP de forma nativa. Conecta con un clic y empieza a registrar desde el chat.
          </p>

          <button
            v-if="!hasKey"
            class="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            @click="connectTo('claude')"
          >
            <span>⚡</span> Conectar con Claude
          </button>

          <div v-else class="space-y-2">
            <button
              class="w-full bg-violet-50 hover:bg-violet-100 text-violet-700 font-medium px-4 py-2 rounded-xl transition-colors text-sm"
              @click="connectTo('claude')"
            >
              Generar nueva conexión
            </button>
          </div>
        </div>

        <!-- ChatGPT Card -->
        <div class="card border-2 border-gray-100 hover:border-green-200 transition-all hover:shadow-md">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 bg-gradient-to-br from-green-100 to-teal-50 rounded-xl flex items-center justify-center text-2xl shadow-sm">
              💬
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">ChatGPT</h3>
              <p class="text-xs text-gray-400">OpenAI · vía API key</p>
            </div>
          </div>

          <p class="text-xs text-gray-500 mb-4 leading-relaxed">
            Usa GoFit desde ChatGPT con Custom GPTs o plugins. Necesitas configurar la API key manualmente.
          </p>

          <button
            class="w-full bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            @click="connectTo('chatgpt')"
          >
            <span>🔑</span> Generar API Key
          </button>
        </div>
      </div>

      <!-- Active connections -->
      <div v-if="apiKeys?.length" class="mt-4">
        <h3 class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Conexiones activas</h3>
        <div class="space-y-2">
          <div
            v-for="key in apiKeys"
            :key="key.id"
            class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl"
          >
            <div class="flex items-center gap-3">
              <span class="text-lg">{{ key.label?.includes('Claude') ? '🤖' : key.label?.includes('ChatGPT') ? '💬' : '🔑' }}</span>
              <div>
                <span class="text-sm font-medium text-gray-700">{{ key.label }}</span>
                <span class="ml-2 font-mono text-xs text-gray-400">{{ key.key_prefix }}...</span>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span v-if="key.last_used" class="text-xs text-emerald-600">
                Último uso: {{ new Date(key.last_used).toLocaleDateString('es-PE') }}
              </span>
              <span v-else class="text-xs text-gray-400">Sin usar</span>
              <button
                class="text-xs text-red-400 hover:text-red-600 transition-colors"
                @click="deleteApiKey(key.id)"
              >
                Desconectar
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== CONNECTION MODAL ==================== -->
    <Teleport to="body">
      <div v-if="showKeyModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">

          <!-- Claude Modal -->
          <template v-if="connectingTo === 'claude'">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-xl">🤖</div>
              <div>
                <h3 class="font-bold text-lg text-gray-900">Conectar con Claude</h3>
                <p class="text-xs text-gray-500">Solo 2 pasos para empezar</p>
              </div>
            </div>

            <!-- Step 1: One-click install -->
            <div class="mb-4 p-4 bg-violet-50 rounded-xl border border-violet-100">
              <div class="flex items-center gap-2 mb-2">
                <span class="w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span class="font-medium text-sm text-gray-900">Instalar en Claude Desktop</span>
              </div>
              <p class="text-xs text-gray-500 mb-3 ml-8">
                Haz clic y Claude Desktop configurará todo automáticamente.
              </p>
              <a
                :href="claudeDeepLink"
                class="ml-8 inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                ⚡ Instalar en Claude Desktop
              </a>
            </div>

            <!-- Step 2: API Key -->
            <div class="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div class="flex items-center gap-2 mb-2">
                <span class="w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span class="font-medium text-sm text-gray-900">Tu API Key</span>
              </div>
              <p class="text-xs text-gray-500 mb-2 ml-8">
                Guarda esta key — no se mostrará de nuevo.
              </p>
              <div class="ml-8 flex items-center gap-2">
                <code class="flex-1 p-2.5 bg-white border border-gray-200 rounded-lg font-mono text-xs break-all select-all">
                  {{ generatedKey }}
                </code>
                <button
                  class="shrink-0 p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  @click="copyToClipboard(generatedKey, 'key')"
                >
                  <span v-if="copied === 'key'" class="text-emerald-600 text-xs">✓</span>
                  <span v-else class="text-gray-500 text-xs">📋</span>
                </button>
              </div>
            </div>

            <!-- Manual config (collapsible) -->
            <details class="mb-4">
              <summary class="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
                ¿Prefieres configurar manualmente?
              </summary>
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

            <!-- Usage examples -->
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

          <!-- ChatGPT Modal -->
          <template v-else-if="connectingTo === 'chatgpt'">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">💬</div>
              <div>
                <h3 class="font-bold text-lg text-gray-900">Conectar con ChatGPT</h3>
                <p class="text-xs text-gray-500">Usa tu API Key en un Custom GPT</p>
              </div>
            </div>

            <div class="mb-4 p-4 bg-green-50 rounded-xl border border-green-100">
              <p class="font-medium text-sm text-gray-900 mb-2">Tu API Key</p>
              <p class="text-xs text-gray-500 mb-2">
                Guarda esta key — no se mostrará de nuevo.
              </p>
              <div class="flex items-center gap-2">
                <code class="flex-1 p-2.5 bg-white border border-gray-200 rounded-lg font-mono text-xs break-all select-all">
                  {{ generatedKey }}
                </code>
                <button
                  class="shrink-0 p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  @click="copyToClipboard(generatedKey, 'key')"
                >
                  <span v-if="copied === 'key'" class="text-emerald-600 text-xs">✓</span>
                  <span v-else class="text-gray-500 text-xs">📋</span>
                </button>
              </div>
            </div>

            <div class="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p class="font-medium text-sm text-amber-800 mb-2">Cómo usarlo en ChatGPT:</p>
              <ol class="space-y-2 text-xs text-amber-700 list-decimal list-inside">
                <li>Crea un Custom GPT en ChatGPT</li>
                <li>En "Actions", configura la API de GoFit con esta key como Bearer token</li>
                <li>Los endpoints están en: <code class="bg-amber-100 px-1 rounded">{{ config.public.siteUrl }}/api/</code></li>
                <li>Empieza a registrar desde el chat</li>
              </ol>
            </div>
          </template>

          <button
            class="mt-4 w-full btn-secondary justify-center"
            @click="closeModal"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Teleport>

    <!-- ==================== OBJETIVOS ==================== -->
    <section class="card mb-8">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-xl">🎯</span>
        <h2 class="font-semibold text-lg text-gray-900">Mis objetivos</h2>
      </div>
      <p class="text-xs text-gray-400 mb-5">Define tus metas para que GoFit te acompañe mejor.</p>

      <!-- Current weight display -->
      <div class="mb-5 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-xs font-medium text-blue-500 uppercase tracking-wider">Peso actual</span>
            <p class="text-2xl font-bold text-gray-900 mt-0.5">
              {{ currentWeightKg ? `${currentWeightKg} kg` : 'Sin registrar' }}
            </p>
          </div>
          <div v-if="currentWeightKg && goalForm.target_weight_kg" class="text-right">
            <span class="text-xs font-medium text-gray-400">Faltan</span>
            <p class="text-lg font-semibold" :class="Number(currentWeightKg) > goalForm.target_weight_kg ? 'text-amber-600' : 'text-emerald-600'">
              {{ Math.abs(Number(currentWeightKg) - goalForm.target_weight_kg).toFixed(1) }} kg
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-4">
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
            <label class="text-xs font-medium text-gray-500 mb-1.5 block">Masa muscular objetivo (kg)</label>
            <input v-model.number="goalForm.target_muscle_mass_kg" type="number" step="0.1" min="10" max="150" class="input" placeholder="35.0" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-medium text-gray-500 mb-1.5 block">Calorías diarias</label>
            <input v-model.number="goalForm.daily_calorie_target" type="number" step="50" min="800" max="8000" class="input" placeholder="2000" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-500 mb-1.5 block">Agua diaria (ml)</label>
            <input v-model.number="goalForm.daily_water_ml" type="number" step="100" min="500" max="10000" class="input" placeholder="2000" />
          </div>
        </div>

        <button
          class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"
          :disabled="savingGoal"
          @click="saveGoal"
        >
          {{ savingGoal ? 'Guardando...' : 'Guardar objetivo' }}
        </button>
      </div>
    </section>

    <!-- ==================== PERFIL ==================== -->
    <section class="card mb-6">
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
          <h2 class="font-semibold text-lg text-gray-900">{{ googleName || 'Usuario' }}</h2>
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
        <button
          class="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"
          :disabled="saving"
          @click="saveProfile"
        >
          {{ saving ? 'Guardando...' : 'Guardar preferencias' }}
        </button>

        <button
          class="text-sm text-red-400 hover:text-red-600 transition-colors"
          @click="signOut"
        >
          Cerrar sesión
        </button>
      </div>
    </section>
  </div>
</template>
