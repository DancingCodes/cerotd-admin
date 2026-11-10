export default defineApiHandler(async (event) => {
  assertAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 500, statusMessage: 'id is required' })
  }

  const current = await mysqlDb.one('SELECT id FROM inquiries WHERE id = ?', [id])
  if (!current) {
    throw createError({ statusCode: 500, statusMessage: 'Inquiry not found' })
  }

  await mysqlDb.execute('DELETE FROM inquiries WHERE id = ?', [id])
  return { ok: true }
})
