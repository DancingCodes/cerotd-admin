import { ADMIN_API_TOKEN_STORAGE_KEY } from '~/composables/useAdminAuth'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server || to.path === '/admin' || !to.path.startsWith('/admin/')) return

  if (!window.localStorage.getItem(ADMIN_API_TOKEN_STORAGE_KEY)) {
    return navigateTo('/admin')
  }
})
