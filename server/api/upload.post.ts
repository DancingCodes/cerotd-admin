export default defineApiHandler(async (event) => {
  assertAdmin(event)

  const form = await readMultipartFormData(event)
  if (!form?.length) {
    throw createError({ statusCode: 500, statusMessage: '请选择文件。' })
  }

  const filePart = form.find((part) => part.name === 'file' && part.data)
  if (!filePart?.data?.length) {
    throw createError({ statusCode: 500, statusMessage: '请选择文件。' })
  }

  const contentType = filePart.type || 'application/octet-stream'
  assertImageType(contentType)

  // 8MB limit
  if (filePart.data.byteLength > 8 * 1024 * 1024) {
    throw createError({ statusCode: 500, statusMessage: '文件过大，最大支持 8MB。' })
  }

  const key = buildObjectKey('cerotd', contentType)
  const url = await uploadImage(key, filePart.data, contentType)

  return {
    key,
    url,
    contentType,
    size: filePart.data.byteLength
  }
})
