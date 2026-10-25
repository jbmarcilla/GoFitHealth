<script setup lang="ts">
const user = useSupabaseUser()
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <nav class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2 font-bold text-xl">
          <span class="text-2xl">💪</span>
          <span class="text-emerald-600">GoFit</span>
          <span class="text-gray-400 font-normal text-sm">.health</span>
        </NuxtLink>

        <div class="flex items-center gap-4">
          <template v-if="user">
            <NuxtLink to="/dashboard" class="text-sm text-gray-600 hover:text-emerald-600 transition-colors">
              Dashboard
            </NuxtLink>
            <NuxtLink to="/settings" class="text-sm text-gray-600 hover:text-emerald-600 transition-colors">
              Ajustes
            </NuxtLink>
            <button
              class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-medium"
              :title="user.email"
            >
              {{ user.email?.charAt(0).toUpperCase() }}
            </button>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="btn-primary text-sm !py-2 !px-4">
              Iniciar sesión
            </NuxtLink>
          </template>
        </div>
      </nav>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="bg-white border-t border-gray-100 py-8">
      <div class="max-w-6xl mx-auto px-4 text-center text-sm text-gray-400">
        &copy; {{ new Date().getFullYear() }} GoFit Health. Tu salud, tu control.
      </div>
    </footer>
  </div>
</template>
