<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto_auto_auto] lg:items-center">
      <UInput v-model="searchInput" type="search" class="w-full" placeholder="搜索名称"
        @keyup.enter="applyFilters" />
      <USelect v-model="filterCategory" :items="categoryOptions" class="w-full" />
      <USelect v-model="filterStatus" :items="statusOptions" class="w-full" />
      <UButton class="w-full justify-center lg:w-auto" color="neutral" variant="soft" @click="applyFilters">搜索</UButton>
      <UButton v-if="selectedSlugs.length" class="w-full justify-center lg:w-auto" color="error" :loading="batchDeleting" @click="removeSelected">
        批量删除 · {{ selectedSlugs.length }}</UButton>
      <UButton class="w-full justify-center lg:w-auto" :disabled="!categories.length" @click="startCreate">新建产品</UButton>
    </div>


    <UCard class="lg:min-h-0 lg:flex-1" :ui="{ body: 'flex flex-col lg:h-full lg:min-h-0' }">
      <div class="overflow-x-auto lg:min-h-0 lg:flex-1">
        <UTable :data="items" :columns="columns" :loading="pending" empty="暂无产品。" sticky="header"
          :ui="{ base: 'w-full min-w-176 table-fixed' }" class="lg:min-h-0 lg:flex-1">
        <template #select-header>
          <UCheckbox :model-value="allSelected" @update:model-value="toggleSelectAll(Boolean($event))" />
        </template>
        <template #select-cell="{ row }">
          <UCheckbox :model-value="selectedSlugs.includes(row.original.slug)"
            @update:model-value="toggleSelect(row.original.slug, Boolean($event))" />
        </template>
        <template #name-cell="{ row }">
          <div class="min-w-0 max-w-full truncate font-semibold" :title="lt(row.original.name)">{{ lt(row.original.name) }}</div>
        </template>
        <template #category-cell="{ row }"><span class="whitespace-nowrap">{{ lt(row.original.category?.name ?? null) }}</span></template>
        <template #status-cell="{ row }">
          <UBadge :color="row.original.isPublished ? 'success' : 'neutral'" variant="subtle">
            {{ row.original.isPublished ? '已发布' : '未发布' }}</UBadge>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UButton :to="`/products/${row.original.slug}`" target="_blank" color="primary" variant="ghost" size="xs">{{
              '查看' }}</UButton>
            <UButton color="neutral" variant="ghost" size="xs" @click="startEdit(row.original)">{{
              '编辑' }}</UButton>
            <UButton color="error" variant="ghost" size="xs" @click="remove(row.original)">{{ '删除'
            }}</UButton>
          </div>
        </template>
        </UTable>
      </div>

      <div v-if="totalPages > 1" class="mt-4 flex justify-end">
        <UPagination v-model:page="page" :total="total" :items-per-page="pageSize" @update:page="load" />
      </div>
    </UCard>

    <UModal v-model:open="formOpen"
      :title="editingSlug ? '编辑产品' : '新建产品'" scrollable
      :ui="{ content: 'w-[calc(100vw-2rem)] max-w-7xl' }">
      <template #body>
        <UForm :state="form" :validate="validateForm" class="grid grid-cols-1 gap-4 lg:grid-cols-4" @submit="save">
          <UFormField :label="'英文名称'" name="nameEn" required>
            <UInput v-model="form.nameEn" class="w-full" />
          </UFormField>
          <UFormField :label="'中文名称'" name="nameZh" required>
            <UInput v-model="form.nameZh" class="w-full" />
          </UFormField>
          <UFormField :label="'所属分类'" name="categorySlug" required>
            <USelect v-model="form.categorySlug" :items="productCategoryOptions" class="w-full" />
          </UFormField>
          <UFormField :label="'已发布'" name="isPublished">
            <USelect v-model="form.isPublished" :items="publishOptions" class="w-full" />
          </UFormField>
          <UFormField class="min-w-0 lg:col-span-2" :label="'英文摘要'" name="summaryEn">
            <UTextarea v-model="form.summaryEn" class="w-full" :rows="2" />
          </UFormField>
          <UFormField class="min-w-0 lg:col-span-2" :label="'中文摘要'" name="summaryZh">
            <UTextarea v-model="form.summaryZh" class="w-full" :rows="2" />
          </UFormField>
          <UFormField class="min-w-0 lg:col-span-2" :label="'英文详情'" name="descriptionEn">
            <UTextarea v-model="form.descriptionEn" class="w-full" :rows="4" />
          </UFormField>
          <UFormField class="min-w-0 lg:col-span-2" :label="'中文详情'" name="descriptionZh">
            <UTextarea v-model="form.descriptionZh" class="w-full" :rows="4" />
          </UFormField>
          <div class="min-w-0 lg:col-span-2">
            <div class="mb-1.5 text-3.25 font-semibold text-gray-600">{{ '封面' }}</div>
            <UFileUpload :model-value="coverUploadItem" :accept="imageAccept"
              :label="uploadingCover ? '上传中...' : (form.coverUrl ? '更换图片' : '上传图片')"
              :disabled="uploadingCover || saving" @update:model-value="onCoverUpload" />
          </div>
          <div class="min-w-0 lg:col-span-2">
            <div class="mb-1.5 text-3.25 font-semibold text-gray-600">{{ '图片' }}</div>
            <UFileUpload :model-value="imageUploadItems" :accept="imageAccept"
              :label="uploadingImages ? '上传中...' : '上传图片'" multiple
              :disabled="uploadingImages || saving" @update:model-value="onImageUpload" />
          </div>
          <UFormField class="min-w-0 lg:col-span-2" :label="'英文规格（每行一条）'" name="specsEnText">
            <UTextarea v-model="form.specsEnText" class="w-full" :rows="3" />
          </UFormField>
          <UFormField class="min-w-0 lg:col-span-2" :label="'中文规格（每行一条）'" name="specsZhText">
            <UTextarea v-model="form.specsZhText" class="w-full" :rows="3" />
          </UFormField>
          <div class="col-span-full flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" :disabled="saving" @click="closeForm">{{ '取消' }}</UButton>
            <UButton type="submit" :loading="saving" :disabled="uploadingCover || uploadingImages">{{ '保存' }}</UButton>
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

type CategoryItem = {
  slug: string
  name: Localized
}

type ProductItem = {
  id: number
  slug: string
  category: { slug: string; name: Localized } | null
  name: Localized
  summary: Localized
  description: Localized
  coverUrl: string | null
  images: string[]
  specs: { en: string[]; zh: string[] }
  isPublished: boolean
}

const lt = useLocalized()
const pending = ref(true)
const searchInput = ref('')
const search = ref('')
const filterCategory = ref('all')
const filterStatus = ref<'all' | 'published' | 'draft'>('all')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const selectedSlugs = ref<string[]>([])
const batchDeleting = ref(false)
const allSelected = computed(() => items.value.length > 0 && items.value.every((item) => selectedSlugs.value.includes(item.slug)))
const items = ref<ProductItem[]>([])
const categories = ref<CategoryItem[]>([])
const productCategoryOptions = computed(() => [
  ...categories.value.map(category => ({ label: lt(category.name), value: category.slug }))
])
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
const columns = computed<TableColumn<ProductItem>[]>(() => [
  { id: 'select', header: '', meta: { style: { th: { width: '3rem' }, td: { width: '3rem' } } } },
  { accessorKey: 'name', header: '名称' },
  { id: 'category', header: '所属分类' },
  { id: 'status', header: '状态' },
  { id: 'actions', header: '', meta: { style: { th: { width: '12rem' }, td: { width: '12rem' } } } }
])
const formOpen = ref(false)
const editingSlug = ref('')

type ProductForm = {
  slug: string
  categorySlug: string
  nameEn: string
  nameZh: string
  summaryEn: string
  summaryZh: string
  descriptionEn: string
  descriptionZh: string
  coverUrl: string
  images: string[]
  specsEnText: string
  specsZhText: string
  isPublished: boolean
}

const emptyForm = (): ProductForm => ({
  slug: '',
  categorySlug: '',
  nameEn: '',
  nameZh: '',
  summaryEn: '',
  summaryZh: '',
  descriptionEn: '',
  descriptionZh: '',
  coverUrl: '',
  images: [],
  specsEnText: '',
  specsZhText: '',
  isPublished: true,
})

const form = reactive(emptyForm())
const imageAccept = 'image/jpeg,image/png,image/webp,image/gif,image/avif'
const uploadingCover = ref(false)
const uploadingImages = ref(false)
const saving = ref(false)

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
const imageUploadItems = computed(() => form.images.map(uploadedImage))

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

async function onImageUpload(value: Array<File | UploadedImage> | null | undefined) {
  if (uploadingImages.value || saving.value) return
  const entries = value || []
  const retained = entries
    .filter((item): item is UploadedImage => !(item instanceof File))
    .map((item) => item.avatar.src)
  const newFiles = entries.filter((item): item is File => item instanceof File)

  if (!newFiles.length) {
    form.images = retained
    return
  }

  uploadingImages.value = true
  try {
    const uploaded: string[] = []
    for (const file of newFiles) {
      uploaded.push(await uploadImage(file))
    }
    form.images = [...retained, ...uploaded]
  } catch {
    form.images = retained
  } finally {
    uploadingImages.value = false
  }
}

function linesToArray(text: string) {
  return text
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
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
    const [productData, categoryData] = await Promise.all([
      apiFetch<{ items: ProductItem[]; total?: number }>('/api/products', {
        query: {
          all: 1,
          page: page.value,
          pageSize: pageSize.value,
          q: search.value || undefined,
          category: filterCategory.value === 'all' ? undefined : filterCategory.value,
          status: filterStatus.value
        }
      }),
      apiFetch<{ items: CategoryItem[] }>('/api/product-categories')
    ])
    items.value = productData.items
    categories.value = categoryData.items
    total.value = Number(productData.total || productData.items.length)
    if (items.value.length === 0 && page.value > 1) {
      page.value -= 1
      await load()
      return
    }
  } finally {
    pending.value = false
  }
}

function applyFilters() {
  search.value = searchInput.value.trim()
  page.value = 1
  load()
}

function startCreate() {
  editingSlug.value = ''
  Object.assign(form, emptyForm())
  form.categorySlug = categories.value[0]?.slug || ''
  formOpen.value = true
}

function startEdit(item: ProductItem) {
  editingSlug.value = item.slug
  Object.assign(form, {
    slug: item.slug,
    categorySlug: item.category?.slug || '',
    nameEn: item.name.en,
    nameZh: item.name.zh,
    summaryEn: item.summary.en,
    summaryZh: item.summary.zh,
    descriptionEn: item.description.en,
    descriptionZh: item.description.zh,
    coverUrl: item.coverUrl || '',
    images: [...item.images],
    specsEnText: item.specs.en.join('\n'),
    specsZhText: item.specs.zh.join('\n'),
    isPublished: item.isPublished,
  })
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
}

function validateForm() {
  const errors = []
  if (!form.nameEn.trim()) errors.push({ name: 'nameEn', message: '请填写英文名称。' })
  if (!form.nameZh.trim()) errors.push({ name: 'nameZh', message: '请填写中文名称。' })
  if (!form.categorySlug.trim()) errors.push({ name: 'categorySlug', message: '请选择分类。' })
  return errors
}

async function save() {
  if (saving.value || uploadingCover.value || uploadingImages.value) return
  saving.value = true
  const payload = {
    categorySlug: form.categorySlug,
    nameEn: form.nameEn,
    nameZh: form.nameZh,
    summaryEn: form.summaryEn,
    summaryZh: form.summaryZh,
    descriptionEn: form.descriptionEn,
    descriptionZh: form.descriptionZh,
    coverUrl: form.coverUrl || null,
    images: form.images,
    specsEn: linesToArray(form.specsEnText),
    specsZh: linesToArray(form.specsZhText),
    isPublished: form.isPublished,
  }

  try {
    if (editingSlug.value) {
      await apiFetch(`/api/products/${editingSlug.value}`, {
        method: 'PUT',
        body: payload
      })
    } else {
      await apiFetch('/api/products', {
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

async function remove(item: ProductItem) {
  if (!window.confirm(`确认删除产品“${lt(item.name)}”？`)) return
  try {
    await apiFetch(`/api/products/${item.slug}`, {
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
      await apiFetch(`/api/products/${slug}`, {
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
