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
const navItems = [
  { to: '/admin/product-categories', label: '产品分类' },
  { to: '/admin/products', label: '产品' },
  { to: '/admin/news-categories', label: '新闻分类' },
  { to: '/admin/news', label: '新闻' },
  { to: '/admin/inquiries', label: '留言' }
]
useSeoMeta({ title: 'Cerotd 后台', robots: 'noindex, nofollow' })
function logout() { clearToken(); navigateTo('/admin') }
</script>
