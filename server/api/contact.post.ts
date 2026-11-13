type ContactBody = {
  name?: string
  company?: string
  email?: string
  phone?: string
  message?: string
  locale?: string
}

function clean(value?: string) {
  return String(value || '').trim()
}

export default defineApiHandler(async (event) => {
  const origin = getHeader(event, 'origin')
  const allowed = useRuntimeConfig(event).portalOrigin
  if (origin && (!allowed || origin !== allowed)) {
    throw createError({ statusCode: 403, statusMessage: '来源不允许。' })
  }
  const body = await readBody<ContactBody>(event)
  const name = clean(body.name)
  const company = clean(body.company)
  const email = clean(body.email)
  const phone = clean(body.phone)
  const message = clean(body.message)
  const locale = clean(body.locale) === 'zh' ? 'zh' : 'en'

  if (!name) {
    throw createError({ statusCode: 500, statusMessage: '姓名不能为空。' })
  }
  if (!company) {
    throw createError({ statusCode: 500, statusMessage: '公司不能为空。' })
  }
  if (!email) {
    throw createError({ statusCode: 500, statusMessage: '邮箱不能为空。' })
  }
  if (!phone) {
    throw createError({ statusCode: 500, statusMessage: '电话不能为空。' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 500, statusMessage: '邮箱格式无效。' })
  }
  if (
    name.length > 120 ||
    company.length > 160 ||
    email.length > 160 ||
    phone.length > 60 ||
    message.length > 4000
  ) {
    throw createError({ statusCode: 500, statusMessage: '字段内容过长。' })
  }

  await mysqlDb.execute(`INSERT INTO inquiries (
        name, company, email, phone, country, im, bulk_intent, product_slug, message, locale
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [name, company, email, phone, '', '', '', '', message, locale])

  return { ok: true }
})
