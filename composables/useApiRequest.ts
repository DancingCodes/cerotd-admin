import type { ApiResponse } from '#shared/api'
import { ADMIN_API_TOKEN_STORAGE_KEY } from './useAdminAuth'

export async function apiFetch<T>(request: string, options: Record<string, unknown> = {}) {
  const token = import.meta.client && window.localStorage.getItem(ADMIN_API_TOKEN_STORAGE_KEY)
  const requestOptions = token
    ? { ...options, headers: { ...(options.headers as Record<string, string>), Authorization: `Bearer ${token}` } }
    : options
  const response = await $fetch<ApiResponse<T>>(request, requestOptions)

  if (response.code !== 200) {
    if (import.meta.client) {
      if (response.code === 401 && useRoute().path.startsWith('/admin')) {
        useAdminAuth().clearToken()
        navigateTo('/admin')
      }
      useToast().add({ title: response.msg, color: 'error' })
    }
    throw response
  }
  return response.data
}
