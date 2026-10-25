export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
  ],

  supabase: {
    redirect: false,
  },

  app: {
    head: {
      title: 'GoFit Health',
      meta: [
        { name: 'description', content: 'Registra tu peso, comidas, agua y ejercicios. Seguimiento inteligente de tu salud.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
      ],
    },
  },

  runtimeConfig: {
    supabaseServiceRoleKey: '',
    public: {
      siteUrl: 'http://localhost:3000',
    },
  },

  routeRules: {
    '/dashboard': { ssr: false },
    '/settings': { ssr: false },
  },
})
