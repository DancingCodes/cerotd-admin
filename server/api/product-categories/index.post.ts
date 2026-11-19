export default defineApiHandler(async (event) => {
  assertAdmin(event)
  throw createError({ statusCode: 500, statusMessage: '产品分类为固定配置，不能新增。' })
})
