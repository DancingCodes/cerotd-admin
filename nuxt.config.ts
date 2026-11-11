export default defineNuxtConfig({
  compatibilityDate: '2026-09-23',
  modules: ['@nuxt/ui'],
  ssr: false,
  ui: { colorMode: false },
  fonts: { providers: { google: false, googleicons: false } },
  runtimeConfig: { adminApiToken: '', mysqlUrl: '', cosSecretId: '', cosSecretKey: '', cosBucketUrl: '', cosPublicBaseUrl: '', portalOrigin: '' },
  routeRules: { '/admin/**': { ssr: false } },
  nitro: { externals: { inline: ['tencentcloud-sdk-nodejs-cdn'] } },
  css: ['~/assets/css/main.css'],
  typescript: { strict: true }
})
