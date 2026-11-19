<template>
  <div class="flex h-screen flex-col overflow-hidden bg-[#f5f7fa] text-gray-900">
    <header v-if="route.path !== '/admin'" class="border-b border-[#e5eaf0] bg-white">
      <div class="mx-auto flex min-h-16 w-full max-w-295 items-center justify-between gap-3 px-6">
        <NuxtLink to="/admin/product-categories"><img src="/images/logo.webp" alt="Cerotd" class="h-8.5 w-auto" /></NuxtLink>
        <nav v-if="token" class="flex items-center gap-2">
          <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
            class="rounded-[10px] px-3 py-2 text-sm font-semibold text-gray-600 no-underline [&.router-link-active]:bg-[#e8f7f9] [&.router-link-active]:text-[#0e7f8f]">
            {{ item.label }}
          </NuxtLink>
          <UButton size="sm" variant="soft" :loading="syncing === 'content'" :disabled="Boolean(syncing)" @click="syncPortal('content')">
            刷新数据缓存
          </UButton>
          <UButton size="sm" color="neutral" variant="soft" :loading="syncing === 'assets'" :disabled="Boolean(syncing)" @click="syncPortal('assets')">
            刷新资源缓存
          </UButton>
          <UButton color="error" variant="soft" size="sm" @click="logout">退出</UButton>
        </nav>
      </div>
    </header>
    <main class="min-h-0 flex-1 px-6 py-7">
      <div class="mx-auto h-full w-full max-w-295"><slot /></div>
    </main>
  </div>
</template>

<script setup lang="ts">
const { clearToken, token } = useAdminAuth()
const route = useRoute()
const syncing = ref<'content' | 'assets' | null>(null)
const navItems = [
  { to: '/admin/product-categories', label: '产品分类' },
  { to: '/admin/products', label: '产品' },
  { to: '/admin/news-categories', label: '新闻分类' },
  { to: '/admin/news', label: '新闻' },
  { to: '/admin/inquiries', label: '留言' }
]
useSeoMeta({ title: 'Cerotd 后台', robots: 'noindex, nofollow' })
function logout() { clearToken(); navigateTo('/admin') }

async function syncPortal(mode: 'content' | 'assets') {
  if (syncing.value) return
  const message = mode === 'content'
    ? '确定刷新产品、新闻相关页面和接口缓存，并重新预热页面吗？'
    : '确定清空全站 CDN 缓存，并预热首页资源吗？刷新后部分资源首次访问可能需要回源。'
  if (!window.confirm(message)) return
  syncing.value = mode
  try {
    const result = await apiFetch<{ refreshed: number; preheated: number; failedUrls: string[] }>('/api/admin/portal-cache', {
      method: 'POST',
      body: { mode }
    })
    useToast().add({
      title: result.failedUrls.length ? '部分 URL 预热失败' : mode === 'content' ? '数据缓存已刷新' : '资源缓存已刷新',
      description: mode === 'content'
        ? `已刷新 ${result.refreshed} 项缓存范围，${result.preheated} 个 URL 预热完成，${result.failedUrls.length} 个失败。`
        : `已刷新全站缓存，${result.preheated} 个 URL 预热完成，${result.failedUrls.length} 个失败。`,
      color: result.failedUrls.length ? 'warning' : 'success'
    })
  } catch {
    // apiFetch displays the request error in a toast.
  } finally {
    syncing.value = null
  }
}
</script>
