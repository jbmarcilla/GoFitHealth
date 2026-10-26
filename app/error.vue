<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; message?: string } }>()

const is404 = computed(() => props.error.statusCode === 404)

useHead({
  title: is404.value ? 'Página no encontrada — GoFit Health' : 'Error — GoFit Health',
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="text-center">
      <span class="text-5xl">{{ is404 ? '🏋️' : '⚠️' }}</span>
      <h1 class="mt-6 text-3xl font-semibold tracking-tight text-gray-900">
        {{ is404 ? 'Página no encontrada' : 'Algo salió mal' }}
      </h1>
      <p class="mt-3 text-gray-500">
        {{ is404 ? 'La página que buscas no existe o fue movida.' : (error.message || 'Error inesperado.') }}
      </p>
      <NuxtLink
        to="/"
        class="mt-8 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
      >
        Volver al inicio <span aria-hidden="true">→</span>
      </NuxtLink>
    </div>
  </div>
</template>
