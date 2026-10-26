<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useHead({ title: 'Conectar con GoFit' })

const route = useRoute()
const user = useSupabaseUser()

const q = (key: string) => (typeof route.query[key] === 'string' ? (route.query[key] as string) : '')
const params = {
  response_type: q('response_type'),
  client_id: q('client_id'),
  redirect_uri: q('redirect_uri'),
  code_challenge: q('code_challenge'),
  code_challenge_method: q('code_challenge_method'),
  state: q('state'),
  scope: q('scope'),
}

const userName = computed(() => user.value?.user_metadata?.full_name || user.value?.user_metadata?.name || user.value?.email || '')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase() || '?')

const paramsError = params.response_type !== 'code'
  ? 'Solicitud inválida: falta response_type=code.'
  : !params.client_id || !params.redirect_uri
    ? 'Solicitud inválida: falta client_id o redirect_uri.'
    : ''

const { data: client, error: clientError } = await useFetch<{ client_name: string }>('/api/oauth/client', {
  query: { client_id: params.client_id, redirect_uri: params.redirect_uri },
  immediate: !paramsError,
})

const errorMessage = computed(() => paramsError || (clientError.value ? (clientError.value.data?.message || 'No se pudo validar la aplicación.') : ''))
const clientName = computed(() => client.value?.client_name || 'Aplicación externa')
const clientIcon = computed(() => {
  const name = clientName.value.toLowerCase()
  if (name.includes('claude')) return '🤖'
  if (name.includes('chatgpt') || name.includes('openai')) return '💬'
  return '🔌'
})

const permissions = [
  { icon: '⚖️', text: 'Ver y registrar tu peso' },
  { icon: '🍽️', text: 'Ver y registrar tus comidas, agua y ejercicio' },
  { icon: '🎯', text: 'Ver y actualizar tus objetivos y tu ubicación' },
  { icon: '🧑‍🏫', text: 'Usar la personalidad de tu entrenador' },
]

const submitting = ref<'allow' | 'deny' | null>(null)
const submitError = ref('')

async function allow() {
  submitting.value = 'allow'
  submitError.value = ''
  try {
    const res = await $fetch<{ redirect: string }>('/api/oauth/approve', { method: 'POST', body: params })
    window.location.href = res.redirect
  } catch (e: any) {
    submitError.value = e.data?.message || e.message
    submitting.value = null
  }
}

function deny() {
  submitting.value = 'deny'
  const target = new URL(params.redirect_uri)
  target.searchParams.set('error', 'access_denied')
  if (params.state) target.searchParams.set('state', params.state)
  window.location.href = target.toString()
}
</script>

<template>
  <div class="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-10">
    <div class="w-full max-w-md">
      <div v-if="errorMessage" class="card text-center">
        <span class="text-4xl">⚠️</span>
        <h1 class="mt-3 text-lg font-bold text-gray-900">No se pudo conectar</h1>
        <p class="mt-2 text-sm text-gray-500">{{ errorMessage }}</p>
        <p class="mt-4 text-xs text-gray-400">Vuelve a la app e intenta agregar GoFit de nuevo.</p>
      </div>

      <div v-else class="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
        <div class="bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 pb-6 pt-8 text-center">
          <div class="flex items-center justify-center gap-3">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-md">{{ clientIcon }}</div>
            <div class="flex items-center gap-1 text-gray-300">
              <span class="h-1 w-1 rounded-full bg-current" />
              <span class="h-1 w-1 rounded-full bg-current" />
              <span class="h-1 w-1 rounded-full bg-current" />
            </div>
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-3xl shadow-md">💪</div>
          </div>
          <h1 class="mt-5 text-xl font-bold text-gray-900">
            {{ clientName }} quiere conectarse a tu GoFit
          </h1>
          <p class="mt-1 text-sm text-gray-500">Así podrás registrar todo conversando.</p>
        </div>

        <div class="px-6 py-5">
          <div class="mb-5 flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">{{ userInitial }}</div>
            <div class="min-w-0 text-sm">
              <p class="truncate font-medium text-gray-800">{{ userName }}</p>
              <p class="text-xs text-gray-400">Cuenta de GoFit</p>
            </div>
          </div>

          <p class="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">Podrá</p>
          <ul class="space-y-2.5">
            <li v-for="p in permissions" :key="p.text" class="flex items-center gap-3 text-sm text-gray-700">
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">{{ p.icon }}</span>
              {{ p.text }}
            </li>
          </ul>

          <div v-if="submitError" class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ submitError }}</div>

          <div class="mt-6 grid grid-cols-2 gap-3">
            <button
              class="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
              :disabled="!!submitting"
              @click="deny"
            >
              Cancelar
            </button>
            <button
              class="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              :disabled="!!submitting"
              @click="allow"
            >
              {{ submitting === 'allow' ? 'Conectando...' : 'Permitir' }}
            </button>
          </div>

          <p class="mt-4 text-center text-xs text-gray-400">
            Puedes desconectarlo cuando quieras en Ajustes → Conectar IA.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
