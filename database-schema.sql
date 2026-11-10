CREATE DATABASE IF NOT EXISTS cerotd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cerotd;
CREATE TABLE IF NOT EXISTS products_categories (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,slug VARCHAR(191) NOT NULL UNIQUE,name_en VARCHAR(255) NOT NULL,name_zh VARCHAR(255) NOT NULL,sort_order INT NOT NULL DEFAULT 0,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,INDEX idx_sort(sort_order,id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS products (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,slug VARCHAR(191) NOT NULL UNIQUE,category_id BIGINT UNSIGNED NOT NULL,name_en VARCHAR(255) NOT NULL,name_zh VARCHAR(255) NOT NULL,summary_en TEXT NOT NULL,summary_zh TEXT NOT NULL,description_en MEDIUMTEXT NOT NULL,description_zh MEDIUMTEXT NOT NULL,cover_url VARCHAR(1024),images_json LONGTEXT NOT NULL,specs_en_json LONGTEXT NOT NULL,specs_zh_json LONGTEXT NOT NULL,is_published TINYINT(1) NOT NULL DEFAULT 1,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,INDEX idx_published(is_published),INDEX idx_category(category_id),CONSTRAINT fk_product_category FOREIGN KEY(category_id) REFERENCES products_categories(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS inquiries (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(120) NOT NULL,company VARCHAR(160) NOT NULL DEFAULT '',email VARCHAR(160) NOT NULL DEFAULT '',phone VARCHAR(60) NOT NULL DEFAULT '',country VARCHAR(160) NOT NULL DEFAULT '',im VARCHAR(160) NOT NULL DEFAULT '',bulk_intent VARCHAR(255) NOT NULL DEFAULT '',product_slug VARCHAR(191) NOT NULL DEFAULT '',message TEXT NOT NULL,locale VARCHAR(8) NOT NULL DEFAULT 'en',is_read TINYINT(1) NOT NULL DEFAULT 0,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,INDEX idx_created(created_at),INDEX idx_read(is_read,created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS news_categories (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,slug VARCHAR(191) NOT NULL UNIQUE,name_en VARCHAR(255) NOT NULL,name_zh VARCHAR(255) NOT NULL,sort_order INT NOT NULL DEFAULT 0,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,INDEX idx_sort(sort_order,id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS news (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,slug VARCHAR(191) NOT NULL UNIQUE,category VARCHAR(191) NOT NULL,title_en VARCHAR(255) NOT NULL,title_zh VARCHAR(255) NOT NULL,summary_en TEXT NOT NULL,summary_zh TEXT NOT NULL,content_en MEDIUMTEXT NOT NULL,content_zh MEDIUMTEXT NOT NULL,cover_url VARCHAR(1024),is_published TINYINT(1) NOT NULL DEFAULT 0,published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,INDEX idx_published_at(is_published,published_at),INDEX idx_category(category)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO products_categories (slug, name_en, name_zh, sort_order)
VALUES
  ('gasoline-engine-oil', 'Gasoline Engine Oil', '汽油机油', 1),
  ('diesel-engine-oil', 'Diesel Engine Oil', '柴油机油', 2),
  ('gear-oil', 'Gear Oil', '齿轮油', 3),
  ('motorcycle-oil', 'Motorcycle Oil', '摩托车油', 4),
  ('anti-wear-hydraulic-oil', 'Anti-wear Hydraulic Oil', '抗磨液压油', 5),
  ('new-energy-oil', 'New Energy Oil', '新能源专用油', 6),
  ('antifreeze-coolant', 'Antifreeze / Coolant', '防冻液/冷却液', 7),
  ('transmission-oil', 'Transmission Oil', '变速箱油', 8),
  ('grease', 'Grease', '润滑脂', 9),
  ('hydraulic-transmission-fluid', 'Hydraulic Transmission Fluid', '液力传动油', 10),
  ('brake-fluid', 'Brake Fluid', '制动液', 11),
  ('tractor-universal-oil', 'Tractor Universal Oil', '拖拉机多用途油', 12);
