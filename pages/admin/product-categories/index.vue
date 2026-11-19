<template>
  <div class="flex h-full min-h-0 flex-col">
    <UCard class="lg:min-h-0 lg:flex-1" :ui="{ body: 'flex flex-col lg:h-full lg:min-h-0' }">
      <div class="overflow-x-auto lg:min-h-0 lg:flex-1">
        <UTable :data="items" :columns="columns" :loading="pending" empty="暂无产品分类。" sticky="header"
          :ui="{ base: 'w-full min-w-150' }" class="lg:min-h-0 lg:flex-1">
          <template #name-cell="{ row }">
            <div class="font-semibold">{{ row.original.name.zh }}</div>
            <div class="text-xs text-gray-500">{{ row.original.name.en }}</div>
          </template>
        </UTable>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'admin' })

type CategoryItem = { slug: string; name: { en: string; zh: string }; sortOrder: number }
const items = ref<CategoryItem[]>([])
const pending = ref(true)
const columns: TableColumn<CategoryItem>[] = [
  { accessorKey: 'name', header: '名称' },
  { accessorKey: 'sortOrder', header: '排序' }
]

onMounted(async () => {
  try {
    items.value = (await apiFetch<{ items: CategoryItem[] }>('/api/product-categories')).items
  } finally {
    pending.value = false
  }
})
</script>
