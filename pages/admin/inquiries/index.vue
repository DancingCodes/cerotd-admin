<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
      <USelect v-model="status" :items="statusFilters" class="w-full" />
      <USelect v-model="range" :items="rangeFilters" class="w-full" />
      <UButton class="w-full justify-center lg:w-auto" color="neutral" variant="soft" @click="applyFilters">搜索</UButton>
    </div>

    <UCard class="lg:min-h-0 lg:flex-1" :ui="{ body: 'flex flex-col lg:h-full lg:min-h-0' }">
      <div class="overflow-x-auto lg:min-h-0 lg:flex-1">
        <UTable :data="items" :columns="columns" :loading="pending"
        empty="暂无留言。" sticky="header"
          :ui="{ base: 'w-full' }" class="lg:min-h-0 lg:flex-1">
        <template #name-cell="{ row }">
          <div class="font-semibold">
            <span v-if="!row.original.isRead" class="mr-2 inline-block size-2 rounded-full bg-primary"></span>
            {{ row.original.name }}
          </div>
          <div class="text-xs text-gray-500">{{ row.original.company }}</div>
        </template>
        <template #contact-cell="{ row }">
          <div>{{ row.original.email }}</div>
          <div class="text-xs text-gray-500">{{ row.original.phone }}</div>
        </template>
        <template #message-cell="{ row }">
          <p class="whitespace-pre-wrap text-sm text-gray-700">{{ row.original.message }}</p>
        </template>
        <template #createdAt-cell="{ row }">{{ formatDateTime(row.original.createdAt) }}</template>
        <template #status-cell="{ row }">
          <UBadge :color="row.original.isRead ? 'neutral' : 'primary'" variant="subtle">
            {{ row.original.isRead ? '已读' : '未读' }}
          </UBadge>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UButton color="neutral" variant="ghost" size="xs" @click="setRead(row.original, !row.original.isRead)">
              {{ row.original.isRead ? '标为未读' : '标为已读' }}
            </UButton>
            <UButton color="error" variant="ghost" size="xs" @click="remove(row.original)">
              {{ '删除' }}
            </UButton>
          </div>
        </template>
        </UTable>
      </div>

      <div v-if="totalPages > 1" class="mt-4 flex justify-end">
        <UPagination v-model:page="page" :total="total" :items-per-page="pageSize" @update:page="load" />
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'admin' })

type InquiryItem = { id: number; name: string; company: string; email: string; phone: string; message: string; isRead: boolean; createdAt: string }
type StatusFilter = 'all' | 'unread' | 'read'
type RangeFilter = 'all' | 'today' | '7d' | '30d'

const items = ref<InquiryItem[]>([])
const pending = ref(true)
const page = ref(1)
const pageSize = 10
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const status = ref<StatusFilter>('all')
const range = ref<RangeFilter>('all')

const columns = computed<TableColumn<InquiryItem>[]>(() => [
  { accessorKey: 'name', header: '姓名' },
  { id: 'contact', header: '邮箱' },
  { id: 'message', header: '留言内容' },
  { accessorKey: 'createdAt', header: '提交时间' },
  { id: 'status', header: '状态' },
  { id: 'actions', header: '' }
])
const statusFilters = computed(() => [
  { value: 'all' as const, label: '全部' },
  { value: 'unread' as const, label: '未读' },
  { value: 'read' as const, label: '已读' }
])
const rangeFilters = computed(() => [
  { value: 'all' as const, label: '全部时间' },
  { value: 'today' as const, label: '今天' },
  { value: '7d' as const, label: '近 7 天' },
  { value: '30d' as const, label: '近 30 天' }
])

function formatDateTime(value: string) { return value ? value.slice(0, 16).replace("T", " ") : "" }

function applyFilters() { page.value = 1; load() }

async function load() {
  pending.value = true
  try {
    const data = await apiFetch<{ items: InquiryItem[]; total?: number }>('/api/inquiries', { query: { status: status.value, range: range.value, page: page.value, pageSize } })
    items.value = data.items
    total.value = Number(data.total || data.items.length)
    if (!items.value.length && page.value > 1) { page.value -= 1; await load() }
  } finally { pending.value = false }
}

async function setRead(item: InquiryItem, isRead: boolean, reload = true) {
  try {
    await apiFetch('/api/inquiries/' + item.id, { method: 'PATCH', body: { isRead } })
    item.isRead = isRead
    if (reload && (status.value === 'unread' || status.value === 'read')) await load()
  } catch { }
}

async function remove(item: InquiryItem) {
  if (!window.confirm(`确认删除来自“${item.name}”的留言？`)) return
  try {
    await apiFetch('/api/inquiries/' + item.id, { method: 'DELETE' })
    await load()
  } catch { }
}

onMounted(load)
</script>
