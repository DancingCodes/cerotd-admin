# Cerotd Admin

独立 Nuxt 后台，界面固定中文；MySQL 保存产品、新闻的中英文内容及询盘，图片上传到腾讯云 COS。生产环境使用 Docker，容器监听 8080 端口。

1. 在 MySQL 8 执行 `database-schema.sql`。
   已有数据库升级时，只执行 `database-migrations/0002_news_images.sql`，再部署新版后台和 Web。升级会删除旧新闻的富文本列，请先备份数据库；旧新闻的摘要将保留为正文，你可以在后台重新录入新闻。
2. 复制 `.env.example` 为 `.env`，填写数据库、后台令牌、COS 和门户来源域名。`NUXT_PORTAL_ORIGIN` 必须为 `https://cerotd.dancingcodes.cn`。
3. 安装依赖后运行 `npm run dev`，访问 `/admin`。

产品与分类数据已导入 MySQL，产品图片存于腾讯云 COS 的 `cerotd/` 目录。页面文案跟随门户代码维护。

后台导航中的“立即同步数据”会刷新 `https://cerotd.dancingcodes.cn/` 下的全站 CDN 缓存。后台等待刷新任务完成后，提交首页、栏目页及已发布产品/新闻详情页的全球预热；预热只提交任务，不等待任务完成，也不逐个预热 `/_nuxt/` 和 `public` 资源。

CDN 同步复用 `NUXT_COS_SECRET_ID` 和 `NUXT_COS_SECRET_KEY`，对应腾讯云密钥需具有 CDN 目录刷新、刷新任务查询和 URL 预热权限。同步接口最多等待目录刷新 150 秒，Nginx 到 admin 的 `proxy_read_timeout` 应至少为 180 秒，避免请求提前返回 504。
