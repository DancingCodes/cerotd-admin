# Cerotd Admin

独立 Nuxt 后台，界面固定中文；MySQL 保存产品、新闻的中英文内容及询盘，图片上传到腾讯云 COS。生产环境使用 Docker，容器监听 8080 端口。

1. 在 MySQL 8 执行 `database-schema.sql`。
   已有数据库升级时，只执行 `database-migrations/0002_news_images.sql`，再部署新版后台和 Web。升级会删除旧新闻的富文本列，请先备份数据库；旧新闻的摘要将保留为正文，你可以在后台重新录入新闻。
2. 复制 `.env.example` 为 `.env`，填写数据库、后台令牌、COS 和门户来源域名。`NUXT_PORTAL_ORIGIN` 必须为 `https://cerotd.dancingcodes.cn`。
3. 安装依赖后运行 `npm run dev`，访问 `/admin`。

产品与分类数据已导入 MySQL，产品图片存于腾讯云 COS 的 `cerotd/` 目录。页面文案跟随门户代码维护。

Web 在 `shared/product-categories.ts` 中固定产品分类；后台从 MySQL 读取分类供查看和产品选择，不提供分类新增、编辑或删除。两端分类 slug 应保持一致；调整分类时需同步修改 Web 配置和数据库。

后台修改产品或新闻后，点“刷新数据缓存”：刷新产品、新闻列表及分类筛选页、详情页与详情接口目录、相关列表接口和站点地图；随后预热列表、筛选页及已发布详情页。首页产品分类已固定在 Web 代码中，不依赖后台接口，因此不在数据刷新范围内。Web 发版后，点“刷新资源缓存”：清除整个门户域名的 CDN 缓存，刷新完成后读取新版首页，预热首页 HTML 及其中引用的同域 CSS、JS、图片、预取资源和网站图标。资源预热每批最多 3 个 URL，等待腾讯云返回这一批每条 URL 的最终状态后才提交下一批；后台会显示成功和失败数量。不会主动预热视频文件或其他页面独有的资源。数据缓存只提交预热任务，不等待预热完成。

CDN 同步复用 `NUXT_COS_SECRET_ID` 和 `NUXT_COS_SECRET_KEY`，对应腾讯云密钥需具有 CDN URL 刷新、目录刷新、刷新任务查询、URL 预热和预热任务查询权限。同步接口最多等待刷新任务 150 秒；资源预热队列最长等待 50 分钟。Nginx 到 admin 的 `proxy_read_timeout` 应设置为 1 小时，避免请求提前返回 504。
