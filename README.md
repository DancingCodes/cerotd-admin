# Cerotd Admin

独立 Nuxt 后台，界面固定中文；MySQL 保存产品、新闻的中英文内容及询盘，图片上传到腾讯云 COS。

1. 在 MySQL 8 执行 `database-schema.sql`。
2. 复制 `.env.example` 为 `.env`，填写数据库、后台令牌、COS 和门户来源域名。
3. 安装依赖后运行 `npm run dev`，访问 `/admin`。

产品与分类数据已导入 MySQL，产品图片存于腾讯云 COS 的 `cerotd/` 目录。门户可在本地运行 `npm run generate` 静态生成；后台“更新网站”发布按钮尚未接通。页面文案跟随门户代码维护。
