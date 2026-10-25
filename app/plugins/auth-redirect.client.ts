export default defineNuxtPlugin(() => {
  const user = useSupabaseUser()

  addRouteMiddleware('auth', () => {
    if (!user.value) {
      return navigateTo('/login')
    }
  }, { global: false })
})
