<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Entrando a GoFit' })

const supabase = useSupabaseClient()
const error = ref('')

onMounted(async () => {
  const params = new URLSearchParams(window.location.hash.slice(1))
  const tokenHash = params.get('th')
  const next = params.get('next') || '/dashboard'
  if (!tokenHash) {
    error.value = 'Este enlace ya no es válido.'
    return
  }
  const { error: err } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
  if (err) {
    error.value = 'El enlace venció o ya se usó. Pide uno nuevo a tu IA.'
    return
  }
  history.replaceState(null, '', '/auth/magic')
  await navigateTo(next.startsWith('/') ? next : '/dashboard', { replace: true })
})
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-6 text-center">
    <template v-if="!error">
      <span class="punch text-5xl">💪</span>
      <p class="text-sm font-medium text-emerald-700">Abriendo tu GoFit…</p>
    </template>
    <template v-else>
      <span class="text-4xl">🔒</span>
      <p class="text-sm text-gray-600">{{ error }}</p>
      <NuxtLink to="/login" class="mt-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white">Entrar con Google</NuxtLink>
    </template>
  </div>
</template>

<style scoped>
.punch { animation: punch 0.9s ease-in-out infinite; display: inline-block; }
@keyframes punch {
  0%, 100% { transform: translateY(0) rotate(-8deg) scale(1); }
  50% { transform: translateY(-10px) rotate(8deg) scale(1.15); }
}
</style>
