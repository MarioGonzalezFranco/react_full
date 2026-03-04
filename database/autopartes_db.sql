-- ════════════════════════════════════════════════════════════
--  AutoPartes Inventario Pro — Schema MySQL  v1.0
-- ════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS autopartes_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE autopartes_db;

-- Usuarios
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50)     NOT NULL UNIQUE,
  password_hash VARCHAR(255)    NOT NULL,
  full_name     VARCHAR(100)    NOT NULL,
  email         VARCHAR(120)    UNIQUE,
  role          ENUM('admin','editor','viewer') NOT NULL DEFAULT 'viewer',
  active        TINYINT(1)      NOT NULL DEFAULT 1,
  last_login    DATETIME,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Categorías
CREATE TABLE IF NOT EXISTS categories (
  id     VARCHAR(30)  NOT NULL,
  label  VARCHAR(60)  NOT NULL,
  icon   VARCHAR(10)  NOT NULL DEFAULT '🔧',
  color  VARCHAR(10)  NOT NULL DEFAULT '#6B7280',
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Marcas
CREATE TABLE IF NOT EXISTS vehicle_makes (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(60)  NOT NULL UNIQUE,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Piezas
CREATE TABLE IF NOT EXISTS parts (
  id               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  sku              VARCHAR(30)     NOT NULL,
  name             VARCHAR(150)    NOT NULL,
  category         VARCHAR(30)     NOT NULL,
  make             VARCHAR(60)     NOT NULL,
  model            VARCHAR(60)     NOT NULL,
  year             SMALLINT        NOT NULL,
  condition_status ENUM('Excelente','Bueno','Regular','Para reparar') NOT NULL DEFAULT 'Bueno',
  stock            SMALLINT        NOT NULL DEFAULT 0,
  price            DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  location         VARCHAR(20)     NOT NULL,
  notes            TEXT,
  created_by       INT UNSIGNED,
  updated_by       INT UNSIGNED,
  deleted_by       INT UNSIGNED,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        ON UPDATE CURRENT_TIMESTAMP,
  deleted_at       DATETIME        DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_sku       (sku),
  KEY idx_category  (category),
  KEY idx_stock     (stock),
  KEY idx_deleted   (deleted_at),
  FOREIGN KEY (category)   REFERENCES categories(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Movimientos de Inventario
CREATE TABLE IF NOT EXISTS stock_movements (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  part_id     INT UNSIGNED  NOT NULL,
  type        ENUM('entrada','salida','ajuste','venta') NOT NULL,
  quantity    INT           NOT NULL,
  stock_after INT           NOT NULL,
  reference   VARCHAR(80),
  notes       TEXT,
  user_id     INT UNSIGNED,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_part (part_id),
  FOREIGN KEY (part_id) REFERENCES parts(id)  ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE SET NULL
) ENGINE=InnoDB;

-- ════════════════════════════════════════════════════════════
--  SEED DATA
-- ════════════════════════════════════════════════════════════

INSERT IGNORE INTO categories (id, label, icon, color) VALUES
  ('motor',        'Motor',             '⚙️',  '#EF4444'),
  ('transmision',  'Transmisión',       '🔧',  '#F97316'),
  ('suspension',   'Suspensión',        '🔩',  '#EAB308'),
  ('frenos',       'Frenos',            '🛑',  '#22C55E'),
  ('electrico',    'Sistema Eléctrico', '⚡',  '#3B82F6'),
  ('carroceria',   'Carrocería',        '🚗',  '#A855F7'),
  ('interior',     'Interior',          '💺',  '#EC4899'),
  ('direccion',    'Dirección',         '🔄',  '#14B8A6'),
  ('enfriamiento', 'Enfriamiento',      '❄️',  '#0EA5E9'),
  ('escape',       'Escape',            '💨',  '#78716C');

INSERT IGNORE INTO vehicle_makes (name) VALUES
  ('Toyota'),('Honda'),('Nissan'),('Chevrolet'),('Ford'),
  ('Volkswagen'),('Hyundai'),('Kia'),('Mazda'),('Mitsubishi'),
  ('Suzuki'),('Dodge'),('BMW'),('Mercedes-Benz'),('Audi'),
  ('Subaru'),('Seat'),('Renault'),('Peugeot'),('Fiat');

-- Admin password: admin123  |  Editor password: admin123
INSERT IGNORE INTO users (username, password_hash, full_name, email, role) VALUES
  ('admin',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Administrador',  'admin@autopartes.mx',  'admin'),
  ('editor1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Editor Bodega',  'editor@autopartes.mx', 'editor');

INSERT IGNORE INTO parts (sku,name,category,make,model,year,condition_status,stock,price,location,notes,created_by) VALUES
('MOT-001','Motor Completo 1.6L','motor','Toyota','Corolla',2018,'Bueno',2,12500.00,'A-01','Incluye accesorios. 85,000 km.',1),
('MOT-002','Pistones juego x4','motor','Honda','Civic',2019,'Excelente',5,2800.00,'A-02','STD. Nuevos de desempaque.',1),
('MOT-003','Culata de Motor','motor','Nissan','Sentra',2017,'Regular',1,3200.00,'A-03','Requiere rectificación menor.',1),
('MOT-004','Bomba de Aceite','motor','Toyota','Yaris',2020,'Bueno',4,950.00,'A-04','Funcionando correctamente.',1),
('MOT-005','Carter de Aceite','motor','Honda','Accord',2019,'Bueno',3,680.00,'A-05','Sin golpes ni fugas.',1),
('MOT-006','Árbol de Levas','motor','Nissan','Altima',2018,'Excelente',2,4200.00,'A-06','Original. Sin desgaste aparente.',1),
('TRN-001','Caja Velocidades Manual 5V','transmision','Honda','Civic',2016,'Bueno',1,8500.00,'B-01','Sincronizadores en buen estado.',1),
('TRN-002','Caja Automática CVT','transmision','Nissan','Tiida',2019,'Excelente',1,15000.00,'B-02','60,000 km. Sin reparaciones previas.',1),
('TRN-003','Kit de Embrague Completo','transmision','Chevrolet','Aveo',2018,'Para reparar',3,1100.00,'B-03','Disco desgastado, necesita kit.',1),
('TRN-004','Diferencial Trasero','transmision','Toyota','Corolla',2017,'Bueno',1,6800.00,'B-04','Completo con bridas.',1),
('SUS-001','Amortiguadores Delanteros par','suspension','Toyota','Corolla',2017,'Bueno',6,2200.00,'C-01','KYB originales.',1),
('SUS-002','Rótulas Inferiores par','suspension','Hyundai','Elantra',2019,'Excelente',8,780.00,'C-02','Con bujes. Par delantero.',1),
('SUS-003','Muelles de Suspensión x4','suspension','Kia','Cerato',2018,'Bueno',2,1600.00,'C-03','Altura original.',1),
('SUS-004','Bujes de Barra Estabilizadora','suspension','Volkswagen','Jetta',2020,'Excelente',10,320.00,'C-04','Kit completo.',1),
('SUS-005','Brazo de Control Superior','suspension','Ford','Focus',2019,'Bueno',4,1950.00,'C-05','Con rótula incluida.',1),
('FRE-001','Discos de Freno Delanteros','frenos','Honda','Accord',2020,'Excelente',10,1400.00,'D-01','Ventilados. Nuevos originales.',1),
('FRE-002','Pastillas de Freno Traseras','frenos','Toyota','Camry',2019,'Bueno',12,650.00,'D-02','Semimetálicas. Set completo.',1),
('FRE-003','Bomba de Frenos','frenos','Nissan','Altima',2017,'Regular',2,1800.00,'D-03','Revisar sellos antes de instalar.',1),
('FRE-004','Calibrador de Freno Delantero','frenos','Honda','Civic',2018,'Bueno',4,1250.00,'D-04','Reconstruido. Con pistón nuevo.',1),
('ELE-001','Alternador 90A','electrico','Ford','Focus',2018,'Bueno',3,2600.00,'E-01','Reconstruido con garantía 6 meses.',1),
('ELE-002','Motor de Arranque','electrico','Chevrolet','Sonic',2019,'Excelente',4,1900.00,'E-02','Original. Funciona perfectamente.',1),
('ELE-003','Módulo ECU','electrico','Toyota','Corolla',2018,'Bueno',2,4500.00,'E-03','Programado. Código compatible.',1),
('ELE-004','Sensor de Oxígeno O2','electrico','Honda','Civic',2019,'Excelente',7,850.00,'E-04','NTK original upstream.',1),
('ELE-005','Bobina de Encendido x4','electrico','Nissan','Sentra',2018,'Bueno',5,1200.00,'E-05','Pack x4 bobinas.',1),
('ELE-006','Sensor MAF','electrico','Volkswagen','Jetta',2019,'Excelente',3,1800.00,'E-06','Limpio y calibrado.',1),
('CAR-001','Cofre Delantero','carroceria','Toyota','Corolla',2019,'Bueno',1,3800.00,'F-01','Color blanco perla. Sin abolladuras.',1),
('CAR-002','Puerta Delantera Derecha','carroceria','Honda','Civic',2020,'Excelente',2,4200.00,'F-02','Con vidrio y mecanismo. Plata.',1),
('CAR-003','Cajuela Portón Trasero','carroceria','Nissan','Versa',2018,'Bueno',1,2900.00,'F-03','Negro. Sin abolladuras mayores.',1),
('CAR-004','Parachoque Delantero','carroceria','Hyundai','Elantra',2020,'Excelente',2,3200.00,'F-04','Con sensores de proximidad.',1),
('INT-001','Tablero de Instrumentos','interior','Toyota','Yaris',2019,'Excelente',1,3100.00,'G-01','Con airbag. Completo. Sin rayones.',1),
('INT-002','Asiento Delantero Conductor','interior','Honda','Accord',2020,'Bueno',2,2400.00,'G-02','Tapicería gris. Con ajuste eléctrico.',1),
('INT-003','Consola Central','interior','Nissan','Altima',2019,'Bueno',3,1800.00,'G-03','Con portavasos y apoyabrazos.',1),
('DIR-001','Caja Dirección Hidráulica','direccion','Chevrolet','Malibu',2017,'Bueno',1,4800.00,'H-01','Sin fugas. Probada en banco.',1),
('DIR-002','Cremallera Dirección EPS','direccion','Mazda','3',2019,'Excelente',2,5600.00,'H-02','Dirección eléctrica. Con motor.',1),
('ENF-001','Radiador de Agua','enfriamiento','Toyota','Corolla',2018,'Bueno',3,1800.00,'I-01','Aluminio. Sin fugas ni corrosión.',1),
('ENF-002','Bomba de Agua','enfriamiento','Volkswagen','Jetta',2019,'Excelente',5,950.00,'I-02','Con empaque. Original VW.',1),
('ENF-003','Termostato 180F','enfriamiento','Honda','Civic',2020,'Excelente',8,320.00,'I-03','Con empaque.',1),
('ENF-004','Mangueras de Radiador','enfriamiento','Nissan','Sentra',2018,'Bueno',6,450.00,'I-04','Superior e inferior. Kit.',1),
('ESC-001','Catalizador Convertidor','escape','Honda','Civic',2018,'Bueno',2,6500.00,'J-01','Sin perforaciones. Metal precioso.',1),
('ESC-002','Silenciador Trasero','escape','Toyota','Camry',2019,'Regular',4,1200.00,'J-02','Marcas de oxidación exterior.',1),
('ESC-003','Múltiple de Escape','escape','Ford','Focus',2018,'Bueno',2,2800.00,'J-03','Sin fisuras. Incluye empaque.',1);
