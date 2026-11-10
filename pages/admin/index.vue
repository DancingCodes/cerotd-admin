<template>
  <div class="flex min-h-[calc(100vh-140px)] items-center justify-center">
    <div class="relative w-full max-w-105 rounded-[12px] border border-[#e5eaf0] bg-white p-7 shadow-[0_10px_30px_rgba(15,23,42,.04)]">
      <div class="mb-2 text-2xl font-bold tracking-normal">后台登录</div>
      <div class="mb-5 text-sm leading-[1.6] text-gray-500">输入 ADMIN_API_TOKEN 以管理网站。</div>
      <UInput
        v-model="input"
        type="password"
        placeholder="ADMIN_API_TOKEN"
        class="w-full"
        :ui="{ base: 'h-11 rounded-[10px] border-[#d7dee7] bg-[#f8fafb] px-3 text-gray-900 focus:border-[#0e7f8f] focus:ring-2 focus:ring-[#0e7f8f]/15' }"
        @keyup.enter="login"
      />
      <div v-if="error" class="mt-2.5 text-3.25 text-[#b42318]">{{ error }}</div>
      <UButton class="mt-4" block size="lg" @click="login">进入</UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const { token, setToken, clearToken } = useAdminAuth()
const input = ref(token.value)
const error = ref('')

onMounted(() => {
  if (token.value) {
    navigateTo('/admin/product-categories')
  }
})

async function login() {
  error.value = ''
  const value = input.value.trim()
  if (!value) {
    error.value = '请输入 Token'
    return
  }

  setToken(value)

  try {
    await apiFetch('/api/admin/check')
    navigateTo('/admin/product-categories')
  } catch {
    clearToken()
  }
}
</script>

