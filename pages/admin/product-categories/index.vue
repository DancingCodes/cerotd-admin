<template>
  <div class="flex h-full min-h-0 flex-col">
    <UCard class="lg:min-h-0 lg:flex-1" :ui="{ body: 'flex flex-col lg:h-full lg:min-h-0' }">
      <div class="overflow-x-auto lg:min-h-0 lg:flex-1">
        <UTable :data="items" :columns="columns" sticky="header"
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
import { productCategories } from '~/shared/product-categories'

definePageMeta({ layout: 'admin' })

const items = productCategories.map((category, index) => ({ ...category, sortOrder: index + 1 }))
type CategoryItem = (typeof items)[number]
const columns: TableColumn<CategoryItem>[] = [
  { accessorKey: 'name', header: '名称' },
  { accessorKey: 'sortOrder', header: '排序' }
]
</script>
