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
  ],

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
      title: 'GoFit Health',
      meta: [
        { name: 'description', content: 'Registra tu peso, comidas, agua y ejercicios. Seguimiento inteligente de tu salud.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
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
    '/dashboard': { ssr: false },
    '/settings': { ssr: false },
    '/oauth/authorize': { ssr: false },
    '/onboarding': { ssr: false },
    '/auth/magic': { ssr: false },
  },
})
