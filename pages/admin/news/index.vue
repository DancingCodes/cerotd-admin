<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto_auto_auto] lg:items-center">
      <UInput v-model="searchInput" type="search" class="w-full" placeholder="搜索标题"
        @keyup.enter="applyFilters" />
      <USelect v-model="filterCategory" :items="categoryOptions" class="w-full" />
      <USelect v-model="filterStatus" :items="statusOptions" class="w-full" />
      <UButton class="w-full justify-center lg:w-auto" color="neutral" variant="soft" @click="applyFilters">
        搜索
      </UButton>
      <UButton v-if="selectedSlugs.length" class="w-full justify-center lg:w-auto" color="error" :loading="batchDeleting" @click="removeSelected">
        批量删除 · {{ selectedSlugs.length }}
      </UButton>
      <UButton class="w-full justify-center lg:w-auto" :disabled="!categories.length" @click="startCreate">
        新建文章
      </UButton>
    </div>


    <UCard class="lg:min-h-0 lg:flex-1" :ui="{ body: 'flex flex-col lg:h-full lg:min-h-0' }">
      <div class="overflow-x-auto lg:min-h-0 lg:flex-1">
        <UTable :data="items" :columns="columns" :loading="pending" empty="暂无文章。" sticky="header"
          :ui="{ base: 'w-full min-w-200 table-fixed' }" class="lg:min-h-0 lg:flex-1">
        <template #select-header>
          <UCheckbox :model-value="allSelected" @update:model-value="toggleSelectAll(Boolean($event))" />
        </template>
        <template #select-cell="{ row }">
          <UCheckbox :model-value="selectedSlugs.includes(row.original.slug)"
            @update:model-value="toggleSelect(row.original.slug, Boolean($event))" />
        </template>
        <template #title-cell="{ row }">
          <div class="font-semibold">{{ lt(row.original.title) }}</div>
        </template>
        <template #category-cell="{ row }">{{ categoryLabel(row.original.category) }}</template>
        <template #publishedAt-cell="{ row }">{{ formatDateTime(row.original.publishedAt) }}</template>
        <template #status-cell="{ row }">
          <UBadge :color="row.original.isPublished ? 'success' : 'neutral'" variant="subtle">
            {{ row.original.isPublished ? '已发布' : '未发布' }}</UBadge>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UButton :to="`/news/${row.original.slug}`" target="_blank" color="primary" variant="ghost" size="xs">
              {{ '查看' }}</UButton>
            <UButton color="neutral" variant="ghost" size="xs" @click="startEdit(row.original)">
              {{ '编辑' }}</UButton>
            <UButton color="error" variant="ghost" size="xs" @click="remove(row.original)">
              {{ '删除' }}</UButton>
          </div>
        </template>
        </UTable>
      </div>

      <div v-if="totalPages > 1" class="mt-4 flex justify-end">
        <UPagination v-model:page="page" :total="total" :items-per-page="pageSize" @update:page="load" />
      </div>
    </UCard>


    <UModal v-model:open="formOpen" :title="editingSlug ? '编辑文章' : '创建文章'"
      scrollable :ui="{ content: 'w-[calc(100vw-2rem)] max-w-7xl' }">
      <template #body>
        <UForm :state="form" :validate="validateForm" class="grid grid-cols-1 gap-4 lg:grid-cols-4" @submit="save">
          <UFormField :label="'英文标题'" name="titleEn" required>
            <UInput v-model="form.titleEn" class="w-full" />
          </UFormField>
          <UFormField :label="'中文标题'" name="titleZh" required>
            <UInput v-model="form.titleZh" class="w-full" />
          </UFormField>
          <UFormField :label="'分类'" name="category" required>
            <USelect v-model="form.category" :items="newsCategoryOptions" class="w-full" />
          </UFormField>
          <UFormField :label="'已发布'" name="isPublished">
            <USelect v-model="form.isPublished" :items="publishOptions" class="w-full" />
          </UFormField>
          <div class="col-span-full">
            <div class="mb-1.5 text-3.25 font-semibold text-gray-600">{{ '封面' }}</div>
            <UFileUpload :model-value="coverUploadItem" :accept="imageAccept"
              :label="uploadingCover ? '上传中...' : (form.coverUrl ? '更换图片' : '上传图片')"
              :disabled="uploadingCover || saving" @update:model-value="onCoverUpload" />
          </div>
          <UFormField class="min-w-0 lg:col-span-2" :label="'英文摘要'" name="summaryEn">
            <UTextarea v-model="form.summaryEn" class="w-full" :rows="2" />
          </UFormField>
          <UFormField class="min-w-0 lg:col-span-2" :label="'中文摘要'" name="summaryZh">
            <UTextarea v-model="form.summaryZh" class="w-full" :rows="2" />
          </UFormField>
          <div class="min-w-0 lg:col-span-2">
            <div class="mb-1.5 text-3.25 font-semibold text-gray-600">{{ '英文正文' }}</div>
            <ClientOnly>
              <UEditor v-model="form.contentEn" content-type="html" :image="{ inline: false, allowBase64: false }">
                <template #default="{ editor }">
                  <div class="flex flex-wrap items-center gap-1 border-b border-[#e5eaf0] p-2">
                    <UEditorToolbar :editor="editor" :items="editorToolbarItems" />
                    <UButton icon="i-lucide-image-plus" color="neutral" variant="ghost" size="sm"
                      :loading="uploadingEditorImage" :disabled="uploadingEditorImage || saving" @click="uploadEditorImage(editor)" />
                  </div>
                </template>
              </UEditor>
              <p class="mt-2 text-xs text-gray-500">{{ '点击 Image 可上传正文图片，图片存储在腾讯云 COS。' }}</p>
            </ClientOnly>
          </div>
          <div class="min-w-0 lg:col-span-2">
            <div class="mb-1.5 text-3.25 font-semibold text-gray-600">{{ '中文正文' }}</div>
            <ClientOnly>
              <UEditor v-model="form.contentZh" content-type="html" :image="{ inline: false, allowBase64: false }">
                <template #default="{ editor }">
                  <div class="flex flex-wrap items-center gap-1 border-b border-[#e5eaf0] p-2">
                    <UEditorToolbar :editor="editor" :items="editorToolbarItems" />
                    <UButton icon="i-lucide-image-plus" color="neutral" variant="ghost" size="sm"
                      :loading="uploadingEditorImage" :disabled="uploadingEditorImage || saving" @click="uploadEditorImage(editor)" />
                  </div>
                </template>
              </UEditor>
              <p class="mt-2 text-xs text-gray-500">{{ '点击 Image 可上传正文图片，图片存储在腾讯云 COS。' }}</p>
            </ClientOnly>
          </div>
          <div class="col-span-full flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" :disabled="saving" @click="closeForm">{{ '取消' }}</UButton>
            <UButton type="submit" :loading="saving" :disabled="uploadingCover || uploadingEditorImage">{{ '保存' }}</UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
definePageMeta({
  layout: 'admin'
})

type Localized = { en: string; zh: string }

type NewsItem = {
  id: number
  slug: string
  category: string
  title: Localized
  summary: Localized
  content: Localized
  coverUrl: string | null
  isPublished: boolean
  publishedAt: string
}

const lt = useLocalized()
const toast = useToast()

type CategoryItem = {
  slug: string
  name: Localized
}

const categories = ref<CategoryItem[]>([])
const newsCategoryOptions = computed(() => categories.value.map(category => ({ label: lt(category.name), value: category.slug })))
const publishOptions = computed(() => [
  { label: '是', value: true },
  { label: '否', value: false }
])
const categoryOptions = computed(() => [
  { label: '全部分类', value: 'all' },
  ...categories.value.map(category => ({ label: lt(category.name), value: category.slug }))
])
const statusOptions = computed(() => [
  { label: '全部状态', value: 'all' },
  { label: '已发布', value: 'published' },
  { label: '未发布', value: 'draft' }
])
const columns = computed<TableColumn<NewsItem>[]>(() => [
  { id: 'select', header: '', meta: { style: { th: { width: '3rem' }, td: { width: '3rem' } } } },
  { accessorKey: 'title', header: '名称' },
  { id: 'category', header: '分类' },
  { accessorKey: 'publishedAt', header: '发布时间' },
  { id: 'status', header: '状态' },
  { id: 'actions', header: '' }
])
const selectedSlugs = ref<string[]>([])
const batchDeleting = ref(false)
const allSelected = computed(() => items.value.length > 0 && items.value.every((item) => selectedSlugs.value.includes(item.slug)))
const items = ref<NewsItem[]>([])
const pending = ref(true)
const searchInput = ref('')
const search = ref('')
const filterCategory = ref('all')
const filterStatus = ref<'all' | 'published' | 'draft'>('all')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const formOpen = ref(false)
const editingSlug = ref('')

const form = reactive({
  titleEn: '',
  titleZh: '',
  slug: '',
  category: 'company',
  summaryEn: '',
  summaryZh: '',
  contentEn: '',
  contentZh: '',
  coverUrl: '',
  publishedAt: '',
  isPublished: false
})

const imageAccept = 'image/jpeg,image/png,image/webp,image/gif,image/avif'
const uploadingCover = ref(false)
const uploadingEditorImage = ref(false)
const saving = ref(false)
const editorToolbarItems = [[
  { icon: 'i-lucide-bold', kind: 'mark', mark: 'bold' },
  { icon: 'i-lucide-italic', kind: 'mark', mark: 'italic' },
  { icon: 'i-lucide-heading-2', kind: 'heading', level: 2 },
  { icon: 'i-lucide-heading-3', kind: 'heading', level: 3 },
  { icon: 'i-lucide-list', kind: 'bulletList' },
  { icon: 'i-lucide-list-ordered', kind: 'orderedList' },
  { icon: 'i-lucide-remove-formatting', kind: 'clearFormatting' }
]]

type UploadedImage = {
  name: string
  avatar: { src: string }
}

function uploadedImage(url: string): UploadedImage {
  return {
    name: url.split('/').pop() || 'image',
    avatar: { src: url }
  }
}

const coverUploadItem = computed(() => form.coverUrl ? uploadedImage(form.coverUrl) : null)

async function uploadImage(file: File) {
  const body = new FormData()
  body.append('file', await compressUploadImage(file))
  const result = await apiFetch<{ url: string }>('/api/upload', {
    method: 'POST',
    body
  })
  return result.url
}

async function onCoverUpload(value: File | UploadedImage | null | undefined) {
  if (uploadingCover.value || saving.value) return
  if (!value) {
    form.coverUrl = ''
    return
  }
  if (!(value instanceof File)) {
    form.coverUrl = value.avatar.src
    return
  }

  uploadingCover.value = true
  try {
    form.coverUrl = await uploadImage(value)
  } catch {
  } finally {
    uploadingCover.value = false
  }
}

function uploadEditorImage(editor: any) {
  if (uploadingEditorImage.value || saving.value) return
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = imageAccept
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    uploadingEditorImage.value = true
    try {
      const url = await uploadImage(file)
      editor.chain().focus().setImage({ src: url }).run()
    } catch {
    } finally {
      uploadingEditorImage.value = false
    }
  }
  input.click()
}

function categoryLabel(slug: string) {
  const found = categories.value.find((item) => item.slug === slug)
  return found ? lt(found.name) : slug
}

function toLocalInput(value: string) {
  if (!value) return ''
  return value.slice(0, 16).replace(' ', 'T')
}

function fromLocalInput(value: string) {
  if (!value) return ''
  return value.length === 16 ? `${value.replace('T', ' ')}:00` : value.replace('T', ' ')
}


function resetForm() {
  Object.assign(form, {
    titleEn: '',
    titleZh: '',
    slug: '',
    category: '',
    summaryEn: '',
    summaryZh: '',
    contentEn: '',
    contentZh: '',
    coverUrl: '',
    publishedAt: toLocalInput(new Date().toISOString()),
    isPublished: false
  })
}

function toggleSelect(slug: string, checked: boolean) {
  if (checked) {
    if (!selectedSlugs.value.includes(slug)) selectedSlugs.value = [...selectedSlugs.value, slug]
  } else {
    selectedSlugs.value = selectedSlugs.value.filter((item) => item !== slug)
  }
}

function toggleSelectAll(checked: boolean) {
  selectedSlugs.value = checked ? items.value.map((item) => item.slug) : []
}

async function load() {
  pending.value = true
  try {
    const [newsData, categoryData] = await Promise.all([
      apiFetch<{ items: NewsItem[]; total?: number }>('/api/news', {
        query: {
          all: 1,
          page: page.value,
          pageSize: pageSize.value,
          q: search.value || undefined,
          category: filterCategory.value === 'all' ? undefined : filterCategory.value,
          status: filterStatus.value
        }
      }),
      apiFetch<{ items: CategoryItem[] }>('/api/news-categories?all=1')
    ])
    items.value = newsData.items
    total.value = Number(newsData.total || newsData.items.length)
    categories.value = categoryData.items
    if (!form.category && categories.value[0]) {
      form.category = categories.value[0].slug
    }
    if (items.value.length === 0 && page.value > 1) {
      page.value -= 1
      await load()
      return
    }
  } finally {
    pending.value = false
  }
}

function formatDateTime(value: string) { return value ? value.slice(0, 16).replace("T", " ") : "" }

function applyFilters() {
  search.value = searchInput.value.trim()
  page.value = 1
  load()
}

async function startCreate() {
  if (!categories.value.length) {
    toast.add({ title: '请先创建新闻分类，再添加新闻。', color: 'warning' })
    return
  }
  editingSlug.value = ''
  resetForm()
  if (categories.value[0]) form.category = categories.value[0].slug
  formOpen.value = true
}

function startEdit(item: NewsItem) {
  editingSlug.value = item.slug
  Object.assign(form, {
    titleEn: item.title.en,
    titleZh: item.title.zh,
    slug: item.slug,
    category: item.category,
    summaryEn: item.summary.en,
    summaryZh: item.summary.zh,
    contentEn: item.content.en,
    contentZh: item.content.zh,
    coverUrl: item.coverUrl || '',
    publishedAt: toLocalInput(item.publishedAt),
    isPublished: item.isPublished
  })
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
}

function validateForm() {
  const errors = []
  if (!form.titleEn.trim()) errors.push({ name: 'titleEn', message: '请填写英文标题。' })
  if (!form.titleZh.trim()) errors.push({ name: 'titleZh', message: '请填写中文标题。' })
  if (!form.category.trim()) errors.push({ name: 'category', message: '请选择分类。' })
  return errors
}

async function save() {
  if (saving.value || uploadingCover.value || uploadingEditorImage.value) return
  saving.value = true
  const payload = {
    category: form.category,
    titleEn: form.titleEn,
    titleZh: form.titleZh,
    summaryEn: form.summaryEn,
    summaryZh: form.summaryZh,
    contentEn: form.contentEn,
    contentZh: form.contentZh,
    coverUrl: form.coverUrl || null,
    publishedAt: fromLocalInput(form.publishedAt),
    isPublished: form.isPublished
  }

  try {
    if (editingSlug.value) {
      await apiFetch(`/api/news/${editingSlug.value}`, {
        method: 'PUT',
        body: payload
      })
    } else {
      await apiFetch('/api/news', {
        method: 'POST',
        body: payload
      })
    }
    closeForm()
    await load()
  } catch {
  } finally {
    saving.value = false
  }
}

async function remove(item: NewsItem) {
  if (!window.confirm(`确认删除文章“${lt(item.title)}”？`)) return
  try {
    await apiFetch(`/api/news/${item.slug}`, {
      method: 'DELETE'
    })
    await load()
  } catch { }
}

async function removeSelected() {
  if (!selectedSlugs.value.length || batchDeleting.value) return
  if (!window.confirm(`确认删除选中的 ${selectedSlugs.value.length} 项？`)) return
  batchDeleting.value = true
  try {
    const slugs = [...selectedSlugs.value]
    for (const slug of slugs) {
      await apiFetch(`/api/news/${slug}`, {
        method: 'DELETE'
      })
    }
    selectedSlugs.value = []
    await load()
  } catch {
    await load()
  } finally {
    batchDeleting.value = false
  }
}


onMounted(load)
</script>
