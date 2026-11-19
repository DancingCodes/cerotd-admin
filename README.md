# Cerotd Admin

独立 Nuxt 后台，界面固定中文；MySQL 保存产品、新闻的中英文内容及询盘，图片上传到腾讯云 COS。生产环境使用 Docker，容器监听 8080 端口。

1. 在 MySQL 8 执行 `database-schema.sql`。
   已有数据库升级时，只执行 `database-migrations/0002_news_images.sql`，再部署新版后台和 Web。升级会删除旧新闻的富文本列，请先备份数据库；旧新闻的摘要将保留为正文，你可以在后台重新录入新闻。
2. 复制 `.env.example` 为 `.env`，填写数据库、后台令牌、COS 和门户来源域名。`NUXT_PORTAL_ORIGIN` 必须为 `https://cerotd.dancingcodes.cn`。
3. 安装依赖后运行 `npm run dev`，访问 `/admin`。

产品与分类数据已导入 MySQL，产品图片存于腾讯云 COS 的 `cerotd/` 目录。页面文案跟随门户代码维护。

Web 在 `shared/product-categories.ts` 中固定产品分类；后台从 MySQL 读取分类供查看和产品选择，不提供分类新增、编辑或删除。两端分类 slug 应保持一致；调整分类时需同步修改 Web 配置和数据库。

后台导航中的“刷新数据缓存”刷新首页、栏目页、分类筛选页、站点地图和列表接口的 URL 缓存，同时刷新产品、新闻详情页及其接口目录（含已删除的详情 URL）；不清除图片、CSS 和 JS。刷新任务完成后，提交首页、栏目页及已发布产品/新闻详情页的全球预热。“刷新资源缓存”单独刷新 `/_nuxt/`、`/_i18n/`、`/images/`、`/video/` 和网站图标的缓存，并预热首页首屏图与 Logo。两种操作都只提交预热任务，不等待预热完成。

CDN 同步复用 `NUXT_COS_SECRET_ID` 和 `NUXT_COS_SECRET_KEY`，对应腾讯云密钥需具有 CDN URL 刷新、目录刷新、刷新任务查询和 URL 预热权限。同步接口最多等待刷新任务 150 秒，Nginx 到 admin 的 `proxy_read_timeout` 应至少为 180 秒，避免请求提前返回 504。
