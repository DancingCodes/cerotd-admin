type InquiryPatchBody = {
  isRead?: boolean
}

export default defineApiHandler(async (event) => {
  assertAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 500, statusMessage: '询盘编号不能为空。' })
  }

  const body = await readBody<InquiryPatchBody>(event)
  if (typeof body?.isRead !== 'boolean') {
    throw createError({ statusCode: 500, statusMessage: '阅读状态不能为空。' })
  }

  const current = await mysqlDb.one('SELECT id FROM inquiries WHERE id = ?', [id])
  if (!current) {
    throw createError({ statusCode: 500, statusMessage: '未找到询盘。' })
  }

  await mysqlDb.execute('UPDATE inquiries SET is_read = ? WHERE id = ?', [body.isRead ? 1 : 0, id])

  return { ok: true, id, isRead: body.isRead }
})
