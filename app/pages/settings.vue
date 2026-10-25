<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const user = useSupabaseUser()
const saving = ref(false)
const message = ref('')
const newKeyLabel = ref('default')
const generatedKey = ref('')
const showKeyModal = ref(false)

const { data: profile, refresh: refreshProfile } = await useFetch('/api/me/profile')
const { data: apiKeys, refresh: refreshKeys } = await useFetch('/api/me/api-keys')

const form = reactive({
  display_name: '',
  measurement_system: 'grams' as string,
  cooking_preference: 'simple' as string,
  timezone: 'America/Lima',
})

watch(profile, (p) => {
  if (p) {
    form.display_name = p.display_name || ''
    form.measurement_system = p.measurement_system || 'grams'
    form.cooking_preference = p.cooking_preference || 'simple'
    form.timezone = p.timezone || 'America/Lima'
  }
}, { immediate: true })

async function saveProfile() {
  saving.value = true
  message.value = ''
  try {
    await $fetch('/api/me/profile', { method: 'PATCH', body: form })
    message.value = 'Perfil actualizado'
    await refreshProfile()
  } catch (e: any) {
    message.value = `Error: ${e.data?.message || e.message}`
  }
  saving.value = false
}

async function generateApiKey() {
  try {
    const res = await $fetch<{ key: string; id: string }>('/api/me/api-keys', {
      method: 'POST',
      body: { label: newKeyLabel.value },
    })
    generatedKey.value = res.key
    showKeyModal.value = true
    await refreshKeys()
  } catch (e: any) {
    message.value = `Error: ${e.data?.message || e.message}`
  }
}

async function deleteApiKey(id: string) {
  if (!confirm('¿Eliminar esta API key?')) return
  try {
    await $fetch(`/api/me/api-keys/${id}`, { method: 'DELETE' })
    await refreshKeys()
  } catch (e: any) {
    message.value = `Error: ${e.data?.message || e.message}`
  }
}

function copyKey() {
  navigator.clipboard.writeText(generatedKey.value)
  message.value = 'API key copiada al portapapeles'
}

const { signOut } = useAuth()
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-gray-900 mb-8">Ajustes</h1>

    <div v-if="message" class="mb-6 p-3 rounded-xl text-sm" :class="message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'">
      {{ message }}
    </div>

    <!-- Profile -->
    <section class="card mb-6">
      <h2 class="font-semibold text-lg text-gray-900 mb-4">Perfil</h2>

      <div class="space-y-4">
        <div>
          <label class="label">Nombre</label>
          <input v-model="form.display_name" class="input" placeholder="Tu nombre" />
        </div>

        <div>
          <label class="label">Sistema de medidas</label>
          <select v-model="form.measurement_system" class="input">
            <option value="grams">Gramos (preciso)</option>
            <option value="reference">Porciones de referencia (puño, taza, mano)</option>
          </select>
        </div>

        <div>
          <label class="label">Preferencia de cocina</label>
          <select v-model="form.cooking_preference" class="input">
            <option value="simple">Simple / rápido</option>
            <option value="full">Cocino a detalle</option>
            <option value="no_cooking">No cocino</option>
            <option value="eating_out">Como afuera</option>
          </select>
        </div>

        <div>
          <label class="label">Zona horaria</label>
          <input v-model="form.timezone" class="input" placeholder="America/Lima" />
        </div>

        <button class="btn-primary" :disabled="saving" @click="saveProfile">
          {{ saving ? 'Guardando...' : 'Guardar perfil' }}
        </button>
      </div>
    </section>

    <!-- API Keys -->
    <section class="card mb-6">
      <h2 class="font-semibold text-lg text-gray-900 mb-2">API Keys (MCP)</h2>
      <p class="text-sm text-gray-500 mb-4">
        Genera una API key para usar con el MCP de GoFit en Claude Desktop.
      </p>

      <div v-if="apiKeys?.length" class="space-y-3 mb-4">
        <div
          v-for="key in apiKeys"
          :key="key.id"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
        >
          <div>
            <span class="font-mono text-sm text-gray-700">{{ key.key_prefix }}...</span>
            <span class="ml-2 text-xs text-gray-400">{{ key.label }}</span>
          </div>
          <button
            class="text-xs text-red-500 hover:text-red-700"
            @click="deleteApiKey(key.id)"
          >
            Eliminar
          </button>
        </div>
      </div>

      <div class="flex gap-2">
        <input v-model="newKeyLabel" class="input flex-1" placeholder="Etiqueta (ej: mi laptop)" />
        <button class="btn-primary !py-2" @click="generateApiKey">
          Generar key
        </button>
      </div>
    </section>

    <!-- Key Modal -->
    <Teleport to="body">
      <div v-if="showKeyModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl p-6 max-w-md w-full">
          <h3 class="font-bold text-lg text-gray-900">Tu nueva API Key</h3>
          <p class="text-sm text-gray-500 mt-2">
            Copia esta key ahora. No podrás verla de nuevo.
          </p>

          <div class="mt-4 p-3 bg-gray-100 rounded-xl font-mono text-sm break-all">
            {{ generatedKey }}
          </div>

          <div class="mt-4 p-3 bg-amber-50 rounded-xl text-sm text-amber-800">
            <strong>Configúrala en Claude Desktop:</strong>
            <pre class="mt-2 text-xs overflow-x-auto">{{ JSON.stringify({ mcpServers: { gofit: { command: 'node', args: ['path/to/mcp/build/index.js'], env: { GOFIT_API_KEY: generatedKey, SUPABASE_URL: 'tu-url', SUPABASE_SERVICE_ROLE_KEY: 'tu-key' } } } }, null, 2) }}</pre>
          </div>

          <div class="mt-4 flex gap-2">
            <button class="btn-primary flex-1" @click="copyKey">
              Copiar key
            </button>
            <button class="btn-secondary flex-1" @click="showKeyModal = false">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Danger Zone -->
    <section class="card border-red-100">
      <button class="text-sm text-red-500 hover:text-red-700" @click="signOut">
        Cerrar sesión
      </button>
    </section>
  </div>
</template>
