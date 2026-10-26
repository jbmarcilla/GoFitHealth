<script setup lang="ts">
const user = useSupabaseUser()
const route = useRoute()
const { signOut } = useAuth()

const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const userName = computed(() => user.value?.user_metadata?.full_name || user.value?.user_metadata?.name || '')
const userInitial = computed(() => (userName.value || user.value?.email || '?').charAt(0).toUpperCase())

function onClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) menuOpen.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') menuOpen.value = false
}

watch(() => route.fullPath, () => { menuOpen.value = false })

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})
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

            <div ref="menuRef" class="relative">
              <button
                class="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-semibold ring-2 ring-offset-2 transition-all"
                :class="menuOpen ? 'ring-emerald-300' : 'ring-transparent hover:ring-emerald-200'"
                :aria-expanded="menuOpen"
                aria-haspopup="menu"
                @click="menuOpen = !menuOpen"
              >
                {{ userInitial }}
              </button>

              <Transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0 -translate-y-1 scale-95"
                leave-active-class="transition duration-100 ease-in"
                leave-to-class="opacity-0 -translate-y-1 scale-95"
              >
                <div
                  v-if="menuOpen"
                  role="menu"
                  class="absolute right-0 mt-2 w-60 origin-top-right bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                >
                  <div class="px-4 py-3 border-b border-gray-100">
                    <p class="text-sm font-semibold text-gray-900 truncate">{{ userName || 'Usuario' }}</p>
                    <p class="text-xs text-gray-400 truncate">{{ user.email }}</p>
                  </div>
                  <div class="p-1.5">
                    <NuxtLink
                      to="/settings"
                      role="menuitem"
                      class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span>⚙️</span> Ajustes
                    </NuxtLink>
                  </div>
                  <div class="p-1.5 border-t border-gray-100">
                    <button
                      role="menuitem"
                      class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
                      @click="signOut"
                    >
                      <span>↩️</span> Cerrar sesión
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
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
