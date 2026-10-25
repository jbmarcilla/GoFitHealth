<script setup lang="ts">
const client = useSupabaseClient()
const user = useSupabaseUser()
const config = useRuntimeConfig()
const loading = ref(false)
const error = ref('')

if (user.value) {
  navigateTo('/dashboard')
}

async function signInWithGoogle() {
  loading.value = true
  error.value = ''

  const { error: authError } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${config.public.siteUrl}/api/auth/callback`,
    },
  })

  if (authError) {
    error.value = authError.message
    loading.value = false
  }
}

watch(user, (val) => {
  if (val) navigateTo('/dashboard')
})
</script>

<template>
  <div class="min-h-[calc(100vh-12rem)] flex items-center justify-center px-4">
    <div class="card max-w-sm w-full text-center">
      <span class="text-4xl">💪</span>
      <h1 class="mt-4 text-2xl font-bold text-gray-900">Bienvenido a GoFit</h1>
      <p class="mt-2 text-sm text-gray-500">Inicia sesión para registrar tu progreso</p>

      <div v-if="error" class="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl">
        {{ error }}
      </div>

      <button
        class="mt-6 w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        :disabled="loading"
        @click="signInWithGoogle"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span>{{ loading ? 'Conectando...' : 'Continuar con Google' }}</span>
      </button>

      <p class="mt-6 text-xs text-gray-400">
        Al continuar, aceptas que GoFit almacene tus datos de salud de forma segura.
      </p>
    </div>
  </div>
</template>
