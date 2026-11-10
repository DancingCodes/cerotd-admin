<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_auto_auto]">
      <UInput v-model="searchInput" type="search" class="w-full"
        placeholder="搜索名称" @keyup.enter="applyFilters" />
      <UButton class="w-full justify-center sm:w-auto" color="neutral" variant="soft" @click="applyFilters">搜索
      </UButton>
      <UButton class="w-full justify-center sm:w-auto" @click="startCreate">新建分类</UButton>
    </div>


    <UCard class="lg:min-h-0 lg:flex-1" :ui="{ body: 'flex flex-col lg:h-full lg:min-h-0' }">
      <div class="overflow-x-auto lg:min-h-0 lg:flex-1">
        <UTable :data="filteredItems" :columns="columns" :loading="pending" empty="暂无产品分类。"
          sticky="header" :ui="{ base: 'w-full min-w-150' }" class="lg:min-h-0 lg:flex-1">
        <template #name-cell="{ row }">
          <div class="font-semibold">{{ lt(row.original.name) }}</div>
          <div class="text-xs text-gray-500">{{ secondaryName(row.original.name) }}</div>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UButton color="neutral" variant="ghost" size="xs" @click="startEdit(row.original)">
              {{ '编辑' }}</UButton>
            <UButton color="error" variant="ghost" size="xs" @click="remove(row.original)">
              {{ '删除' }}</UButton>
          </div>
        </template>
        </UTable>
      </div>
    </UCard>


    <UModal v-model:open="formOpen"
      :title="editingSlug ? '编辑分类' : '新建分类'"
      :ui="{ content: 'max-w-2xl' }">
      <template #body>
        <UForm :state="form" :validate="validateForm" class="grid grid-cols-2 gap-4" @submit="save">
          <UFormField :label="'英文名称'" name="nameEn" required>
            <UInput v-model="form.nameEn" class="w-full" />
          </UFormField>
          <UFormField :label="'中文名称'" name="nameZh" required>
            <UInput v-model="form.nameZh" class="w-full" />
          </UFormField>
          <UFormField class="col-span-2" :label="'排序'" name="sortOrder">
            <UInput v-model.number="form.sortOrder" type="number" class="w-full" />
          </UFormField>
          <div class="col-span-full flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="closeForm">{{ '取消' }}</UButton>
            <UButton type="submit">{{ '保存' }}</UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
definePageMeta({ layout: 'admin' })

type Localized = { en: string; zh: string }
type CategoryItem = { id: number; slug: string; name: Localized; sortOrder: number }

const lt = useLocalized()
const items = ref<CategoryItem[]>([])
const pending = ref(true)
const searchInput = ref('')
const search = ref('')
const formOpen = ref(false)
const editingSlug = ref('')
const form = reactive({ nameEn: '', nameZh: '', sortOrder: 0 })
const columns = computed<TableColumn<CategoryItem>[]>(() => [
  { accessorKey: 'name', header: '名称' },
  { accessorKey: 'sortOrder', header: '排序' },
  { id: 'actions', header: '' }
])
const filteredItems = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) return items.value
  return items.value.filter((item) => lt(item.name).toLowerCase().includes(keyword))
})

function secondaryName(name: Localized) { return name.en }
function applyFilters() { search.value = searchInput.value }
function resetForm() { Object.assign(form, { nameEn: '', nameZh: '', sortOrder: 0 }) }
async function load() { pending.value = true; try { items.value = (await apiFetch<{ items: CategoryItem[] }>('/api/product-categories')).items } finally { pending.value = false } }
function startCreate() { editingSlug.value = ''; resetForm(); formOpen.value = true }
function startEdit(item: CategoryItem) { editingSlug.value = item.slug; Object.assign(form, { nameEn: item.name.en, nameZh: item.name.zh, sortOrder: item.sortOrder }); formOpen.value = true }
function closeForm() { formOpen.value = false }
function validateForm() {
  const errors = []
  if (!form.nameEn.trim()) errors.push({ name: 'nameEn', message: '请填写英文名称。' })
  if (!form.nameZh.trim()) errors.push({ name: 'nameZh', message: '请填写中文名称。' })
  return errors
}

async function save() {
  const body = { nameEn: form.nameEn, nameZh: form.nameZh, sortOrder: Number(form.sortOrder) || 0 }
  try {
    if (editingSlug.value) await apiFetch(`/api/product-categories/${editingSlug.value}`, { method: 'PUT', body })
    else await apiFetch('/api/product-categories', { method: 'POST', body })
    closeForm(); await load()
  } catch { }
}

async function remove(item: CategoryItem) {
  if (!window.confirm(`确定删除产品分类「${lt(item.name)}」吗？分类下不能有产品。`)) return
  try { await apiFetch(`/api/product-categories/${item.slug}`, { method: 'DELETE' }); await load() } catch { }
}

onMounted(load)
</script>
