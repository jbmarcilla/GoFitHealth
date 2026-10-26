export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo({ path: '/login', query: { next: to.fullPath } })
  }

  if (to.path === '/onboarding' || to.path.startsWith('/oauth')) return

  const onboarded = useState<boolean | null>('onboarded', () => null)
  if (onboarded.value === null) {
    try {
      const profile = await $fetch<{ onboarding_completed_at: string | null }>('/api/me/profile')
      onboarded.value = !!profile?.onboarding_completed_at
    } catch {
      onboarded.value = true
    }
  }
  if (!onboarded.value) return navigateTo('/onboarding')
})
