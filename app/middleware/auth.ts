export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo({ path: '/login', query: { next: to.fullPath } })
  }
})
