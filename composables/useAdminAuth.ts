export const ADMIN_API_TOKEN_STORAGE_KEY = 'ADMIN_API_TOKEN'

export function useAdminAuth() {
  const token = useState('admin-api-token', () => '')

  if (import.meta.client && !token.value) {
    token.value = window.localStorage.getItem(ADMIN_API_TOKEN_STORAGE_KEY) || ''
  }

  function setToken(value: string) {
    token.value = value.trim()
    if (import.meta.client) {
      window.localStorage.setItem(ADMIN_API_TOKEN_STORAGE_KEY, token.value)
    }
  }

  function clearToken() {
    token.value = ''
    if (import.meta.client) {
      window.localStorage.removeItem(ADMIN_API_TOKEN_STORAGE_KEY)
    }
  }

  return {
    token,
    setToken,
    clearToken
  }
}
