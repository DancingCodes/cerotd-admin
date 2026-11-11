# Cerotd Admin

独立 Nuxt 后台，界面固定中文；MySQL 保存产品、新闻的中英文内容及询盘，图片上传到腾讯云 COS。

1. 在 MySQL 8 执行 `database-schema.sql`。
2. 复制 `.env.example` 为 `.env`，填写数据库、后台令牌、COS 和门户来源域名。
3. 安装依赖后运行 `npm run dev`，访问 `/admin`。

产品与分类数据已导入 MySQL，产品图片存于腾讯云 COS 的 `cerotd/` 目录。页面文案跟随门户代码维护。

后台导航中的“立即同步数据”会刷新 `cerotd.dancingcodes.cn` 全站 CDN 缓存，等待刷新完成后预热首页、栏目页、已发布详情页和 GET API。部署后台时设置 `NUXT_PORTAL_ORIGIN=https://cerotd.dancingcodes.cn`；CDN 同步复用现有的 `NUXT_COS_SECRET_ID` 和 `NUXT_COS_SECRET_KEY`。对应腾讯云密钥需具有 CDN 目录刷新、刷新任务查询和 URL 预热权限。
