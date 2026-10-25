<script setup lang="ts">
const { signOut } = useAuth()
</script>

<template>
  <button
    class="text-sm text-gray-500 hover:text-red-500 transition-colors"
    @click="signOut"
  >
    Cerrar sesión
  </button>
</template>
