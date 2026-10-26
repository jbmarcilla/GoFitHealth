import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  alias: {
    '#mcp': fileURLToPath(new URL('./mcp/src', import.meta.url)),
  },

  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
    '@nuxtjs/seo',
  ],

  site: {
    url: 'https://gofit.health',
    name: 'GoFit Health',
    description: 'Contador de calorías con IA. Registra comidas, peso, agua y ejercicio hablando con tu entrenador en Claude o ChatGPT. Gratis.',
    defaultLocale: 'es',
  },

  ogImage: {
    enabled: false,
  },

  supabase: {
    redirect: false,
  },

  nitro: {
    preset: 'cloudflare-pages',
  },

  serverHandlers: [
    { route: '/.well-known/oauth-protected-resource', handler: '~~/server/oauth/protected-resource.ts' },
    { route: '/.well-known/oauth-protected-resource/**', handler: '~~/server/oauth/protected-resource.ts' },
    { route: '/.well-known/oauth-authorization-server', handler: '~~/server/oauth/authorization-server.ts' },
    { route: '/.well-known/oauth-authorization-server/**', handler: '~~/server/oauth/authorization-server.ts' },
    { route: '/.well-known/openid-configuration', handler: '~~/server/oauth/authorization-server.ts' },
  ],

  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'GoFit Health — Contador de calorías con IA',
      meta: [
        { name: 'description', content: 'Registra comidas, peso, agua y ejercicio hablando con tu IA. Contador de calorías gratis con déficit calórico automático, densidad calórica y macronutrientes.' },
        { name: 'keywords', content: 'contador de calorías, déficit calórico, registro de peso, seguimiento de comidas, app fitness IA, densidad calórica, macronutrientes, bajar de peso, app nutrición gratis' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico?v=2', sizes: '16x16 32x32 48x48' },
        { rel: 'icon', type: 'image/png', href: '/favicon-32.png?v=2', sizes: '32x32' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg?v=2' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png?v=2', sizes: '180x180' },
        { rel: 'manifest', href: '/site.webmanifest' },
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
    '/dashboard': { ssr: false, robots: false },
    '/settings': { ssr: false, robots: false },
    '/oauth/authorize': { ssr: false, robots: false },
    '/onboarding': { ssr: false, robots: false },
    '/auth/magic': { ssr: false, robots: false },
    '/api/**': { robots: false },
  },
})
