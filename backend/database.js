const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'autopartes.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  const db = getDb();

  // ── USERS ──────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT    UNIQUE NOT NULL,
      password   TEXT    NOT NULL,
      name       TEXT    NOT NULL,
      email      TEXT    UNIQUE NOT NULL,
      role       TEXT    NOT NULL DEFAULT 'operador',  -- admin | operador | consultor
      active     INTEGER NOT NULL DEFAULT 1,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      last_login TEXT
    );
  `);

  // ── CATEGORIES ─────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      slug  TEXT UNIQUE NOT NULL,
      label TEXT NOT NULL,
      icon  TEXT NOT NULL,
      color TEXT NOT NULL
    );
  `);

  // ── PARTS ──────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS parts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      sku         TEXT UNIQUE NOT NULL,
      name        TEXT NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      make        TEXT NOT NULL,
      model       TEXT NOT NULL,
      year        INTEGER NOT NULL,
      condition   TEXT NOT NULL DEFAULT 'Bueno',
      stock       INTEGER NOT NULL DEFAULT 0,
      min_stock   INTEGER NOT NULL DEFAULT 2,
      price       REAL    NOT NULL DEFAULT 0,
      cost        REAL    NOT NULL DEFAULT 0,
      location    TEXT    NOT NULL DEFAULT '',
      notes       TEXT    NOT NULL DEFAULT '',
      image_url   TEXT    DEFAULT NULL,
      active      INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ── MOVEMENTS ──────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS movements (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      part_id    INTEGER NOT NULL REFERENCES parts(id),
      user_id    INTEGER NOT NULL REFERENCES users(id),
      type       TEXT    NOT NULL,   -- entrada | salida | ajuste | venta
      quantity   INTEGER NOT NULL,
      prev_stock INTEGER NOT NULL,
      new_stock  INTEGER NOT NULL,
      reason     TEXT    NOT NULL DEFAULT '',
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ── ACTIVITY LOG ───────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER REFERENCES users(id),
      action     TEXT NOT NULL,
      entity     TEXT NOT NULL,
      entity_id  INTEGER,
      detail     TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedData(db);
  console.log('✅ Base de datos inicializada correctamente');
  return db;
}

function seedData(db) {
  // Skip if already seeded
  const existing = db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (existing.c > 0) return;

  console.log('🌱 Insertando datos iniciales...');

  // ── USERS ──
  const hashPw = (p) => bcrypt.hashSync(p, 10);
  const insertUser = db.prepare(`
    INSERT INTO users (username, password, name, email, role) VALUES (?,?,?,?,?)
  `);
  insertUser.run('admin',    hashPw('admin123'),    'Carlos Administrador', 'admin@autopartes.mx',    'admin');
  insertUser.run('operador', hashPw('oper456'),     'María González',       'maria@autopartes.mx',    'operador');
  insertUser.run('consultor',hashPw('consulta789'), 'Pedro Ramírez',        'pedro@autopartes.mx',    'consultor');
  insertUser.run('jose',     hashPw('jose2024'),    'José Martínez',        'jose@autopartes.mx',     'operador');

  // ── CATEGORIES ──
  const cats = [
    ['motor',        'Motor',             '⚙️',  '#EF4444'],
    ['transmision',  'Transmisión',       '🔧',  '#F97316'],
    ['suspension',   'Suspensión',        '🔩',  '#EAB308'],
    ['frenos',       'Frenos',            '🛑',  '#22C55E'],
    ['electrico',    'Sistema Eléctrico', '⚡',  '#3B82F6'],
    ['carroceria',   'Carrocería',        '🚗',  '#A855F7'],
    ['interior',     'Interior',          '💺',  '#EC4899'],
    ['direccion',    'Dirección',         '🔄',  '#14B8A6'],
    ['enfriamiento', 'Enfriamiento',      '❄️',  '#0EA5E9'],
    ['escape',       'Escape',            '💨',  '#78716C'],
    ['combustible',  'Combustible',       '⛽',  '#F59E0B'],
    ['neumaticos',   'Neumáticos',        '🏎️',  '#6366F1'],
  ];
  const insC = db.prepare('INSERT INTO categories (slug,label,icon,color) VALUES (?,?,?,?)');
  cats.forEach(c => insC.run(...c));

  // ── PARTS ──
  const parts = [
    // MOTOR
    ['MOT-001','Motor Completo 1.6L DOHC',           1,'Toyota',    'Corolla',  2018,'Bueno',    2,2, 12500, 8200,'A-01','Incluye accesorios. 85,000 km.'],
    ['MOT-002','Motor Completo 2.0L',                1,'Honda',     'Civic',    2020,'Excelente', 1,1, 18000,12000,'A-02','60,000 km. Sin reparaciones.'],
    ['MOT-003','Pistones STD (juego x4)',             1,'Toyota',    'Yaris',    2019,'Excelente', 5,3,  2800, 1600,'A-03','Nuevos de desempaque. STD.'],
    ['MOT-004','Culata Rectificada',                 1,'Nissan',    'Sentra',   2017,'Regular',   1,1,  3200, 1900,'A-04','Rectificación menor requerida.'],
    ['MOT-005','Bomba de Aceite',                    1,'Honda',     'Accord',   2019,'Bueno',     4,2,   950,  520,'A-05','Funcionando correctamente.'],
    ['MOT-006','Carter de Aceite',                   1,'Toyota',    'Corolla',  2018,'Bueno',     3,2,   780,  410,'A-06','Sin fisuras. Con tapón.'],
    ['MOT-007','Árbol de Levas Escape',              1,'Volkswagen','Jetta',    2019,'Bueno',     2,1,  2400, 1400,'A-07','Medidas originales. Sin desgaste.'],
    ['MOT-008','Cigüeñal 2.0L',                     1,'Chevrolet', 'Cruze',    2018,'Para reparar',1,1,4500, 2800,'A-08','Requiere rectificación de muñones.'],
    // TRANSMISIÓN
    ['TRN-001','Caja Manual 5V',                     2,'Honda',     'Civic',    2016,'Bueno',     1,1,  8500, 5200,'B-01','Sincronizadores en buen estado.'],
    ['TRN-002','Caja Automática CVT',                2,'Nissan',    'Tiida',    2019,'Excelente', 1,1, 15000, 9500,'B-02','60,000 km. Sin reparaciones.'],
    ['TRN-003','Caja Automática 6V',                 2,'Toyota',    'Camry',    2020,'Excelente', 1,1, 22000,14000,'B-03','45,000 km. Perfecta condición.'],
    ['TRN-004','Embrague Completo',                  2,'Chevrolet', 'Aveo',     2018,'Regular',   3,2,  1100,  620,'B-04','Disco desgastado, necesita kit.'],
    ['TRN-005','Diferencial Trasero',                2,'Ford',      'Fusion',   2017,'Bueno',     1,1,  6800, 4100,'B-05','Sin fugas. Probado en banco.'],
    ['TRN-006','Flecha Delantera Derecha',           2,'Honda',     'Accord',   2019,'Bueno',     2,2,  1800,  980,'B-06','Con junta homocinética nueva.'],
    // SUSPENSIÓN
    ['SUS-001','Amortiguadores Del. (par)',           3,'Toyota',    'Corolla',  2017,'Bueno',     6,4,  2200, 1300,'C-01','KYB originales.'],
    ['SUS-002','Amortiguadores Tras. (par)',          3,'Honda',     'Civic',    2018,'Excelente', 4,4,  1900, 1100,'C-02','Nuevos. Incluye tornillería.'],
    ['SUS-003','Rótulas Inferiores (par)',            3,'Hyundai',   'Elantra',  2019,'Excelente', 8,4,   780,  420,'C-03','Con bujes. Par delantero.'],
    ['SUS-004','Muelles de Suspensión (x4)',          3,'Kia',       'Cerato',   2018,'Bueno',     2,2,  1600,  900,'C-04','Altura original.'],
    ['SUS-005','Barra Estabilizadora Delantera',      3,'Toyota',    'Yaris',    2019,'Bueno',     3,2,  1200,  680,'C-05','Con bujes y soportes.'],
    ['SUS-006','Tijeras Inferiores (par)',            3,'Nissan',    'Versa',    2020,'Excelente', 4,2,  2800, 1600,'C-06','Geometría original. Con rótulas.'],
    // FRENOS
    ['FRE-001','Discos Del. Ventilados (par)',        4,'Honda',     'Accord',   2020,'Excelente',10,6,  1400,  780,'D-01','Nuevos originales.'],
    ['FRE-002','Discos Traseros (par)',               4,'Toyota',    'Camry',    2019,'Bueno',     6,4,   980,  520,'D-02','Espesor dentro de especificación.'],
    ['FRE-003','Pastillas Delanteras',               4,'Nissan',    'Altima',   2020,'Excelente', 12,6,   650,  340,'D-03','Semimetálicas. Set completo.'],
    ['FRE-004','Pastillas Traseras',                 4,'Toyota',    'Corolla',  2019,'Bueno',     12,6,   580,  310,'D-04','Cerámicas. Baja generación de polvo.'],
    ['FRE-005','Bomba de Frenos (maestra)',           4,'Ford',      'Focus',    2018,'Bueno',     2,2,  1800,  980,'D-05','Revisar sellos antes de instalar.'],
    ['FRE-006','Cilindro de Rueda Trasero',          4,'Chevrolet', 'Sonic',    2019,'Bueno',     5,3,   420,  220,'D-06','Kit completo. Sellado perfecto.'],
    ['FRE-007','ABS Sensor Delantero',               4,'Toyota',    'Corolla',  2020,'Excelente', 7,4,   890,  490,'D-07','OEM. Compatible modelos 2018-2022.'],
    // ELÉCTRICO
    ['ELE-001','Alternador 90A',                     5,'Ford',      'Focus',    2018,'Bueno',     3,2,  2600, 1500,'E-01','Reconstruido. Garantía 6 meses.'],
    ['ELE-002','Motor de Arranque',                  5,'Chevrolet', 'Sonic',    2019,'Excelente', 4,2,  1900, 1050,'E-02','Original. Funciona perfectamente.'],
    ['ELE-003','ECU / Módulo de Motor',              5,'Toyota',    'Corolla',  2018,'Bueno',     2,1,  4500, 2700,'E-03','Programada. Código compatible.'],
    ['ELE-004','Sensor O2 Upstream',                 5,'Honda',     'Civic',    2019,'Excelente', 7,4,   850,  450,'E-04','NTK original. Par número compatible.'],
    ['ELE-005','Sensor MAP',                         5,'Nissan',    'Versa',    2020,'Bueno',     5,3,   620,  330,'E-05','Calibrado y probado en banco.'],
    ['ELE-006','Bobina de Encendido',                5,'Hyundai',   'Elantra',  2019,'Excelente', 8,4,   480,  260,'E-06','Set de 4. OEM Hyundai.'],
    ['ELE-007','Claxon Doble Tono',                  5,'Toyota',    'Camry',    2020,'Excelente', 6,4,   320,  170,'E-07','Original. Funciona perfectamente.'],
    ['ELE-008','Módulo Airbag',                      5,'Honda',     'Accord',   2019,'Bueno',     1,1,  6800, 4200,'E-08','Sin historial de activación.'],
    // CARROCERÍA
    ['CAR-001','Cofre Delantero',                    6,'Toyota',    'Corolla',  2019,'Bueno',     1,1,  3800, 2200,'F-01','Blanco perla. Sin abolladuras.'],
    ['CAR-002','Puerta Del. Derecha',                6,'Honda',     'Civic',    2020,'Excelente', 2,1,  4200, 2500,'F-02','Con vidrio y mecanismo. Plata.'],
    ['CAR-003','Portón Trasero',                     6,'Nissan',    'Versa',    2018,'Bueno',     1,1,  2900, 1700,'F-03','Negro. Sin abolladuras mayores.'],
    ['CAR-004','Salpicadera Delantera Derecha',      6,'Toyota',    'Yaris',    2019,'Bueno',     2,2,  1800, 1000,'F-04','Rojo. Lista para pintar.'],
    ['CAR-005','Cajuela/Maletero Sedan',             6,'Chevrolet', 'Aveo',     2018,'Regular',   1,1,  2100, 1200,'F-05','Pequeño hundimiento en esquina.'],
    ['CAR-006','Parachoque Trasero',                 6,'Hyundai',   'Elantra',  2020,'Excelente', 2,1,  2400, 1350,'F-06','Azul marino. Original Hyundai.'],
    // INTERIOR
    ['INT-001','Tablero de Instrumentos Completo',   7,'Toyota',    'Yaris',    2019,'Excelente', 1,1,  3100, 1800,'G-01','Sin airbag. Sin rayones.'],
    ['INT-002','Asiento Del. Conductor',             7,'Honda',     'Accord',   2020,'Bueno',     2,1,  2400, 1400,'G-02','Tapicería gris. Ajuste eléctrico.'],
    ['INT-003','Conjunto Juego Tapicería Completo',  7,'Toyota',    'Corolla',  2018,'Bueno',     1,1,  3800, 2200,'G-03','Gris oscuro. Buen estado general.'],
    ['INT-004','Radio / Multimedia OEM',             7,'Nissan',    'Sentra',   2019,'Excelente', 3,2,  2800, 1600,'G-04','Pantalla táctil. Con código.'],
    ['INT-005','Volante con Controles',              7,'Honda',     'Civic',    2019,'Bueno',     2,2,  1900, 1100,'G-05','Con bolsas de aire. Original.'],
    // DIRECCIÓN
    ['DIR-001','Caja Dirección Hidráulica',          8,'Chevrolet', 'Malibu',   2017,'Bueno',     1,1,  4800, 2900,'H-01','Sin fugas. Probada en banco.'],
    ['DIR-002','Cremallera Dirección EPS',           8,'Mazda',     '3',        2019,'Excelente', 2,1,  5600, 3400,'H-02','Eléctrica. Con motor integrado.'],
    ['DIR-003','Bomba Dirección Hidráulica',         8,'Toyota',    'Camry',    2018,'Bueno',     2,2,  2200, 1300,'H-03','Sin fugas. Presión correcta.'],
    // ENFRIAMIENTO
    ['ENF-001','Radiador de Agua Aluminio',          9,'Toyota',    'Corolla',  2018,'Bueno',     3,2,  1800,  980,'I-01','Sin fugas ni corrosión.'],
    ['ENF-002','Bomba de Agua',                      9,'Volkswagen','Jetta',    2019,'Excelente', 5,3,   950,  520,'I-02','Con empaque. Original VW.'],
    ['ENF-003','Ventilador Eléctrico Radiador',      9,'Honda',     'Accord',   2020,'Bueno',     3,2,  1400,  780,'I-03','Motor funcionando. Paletas completas.'],
    ['ENF-004','Termostato Motor',                   9,'Nissan',    'Altima',   2018,'Excelente', 8,4,   380,  200,'I-04','OEM Nissan. Temperatura de apertura 82°.'],
    // ESCAPE
    ['ESC-001','Catalizador / Convertidor',         10,'Honda',     'Civic',    2018,'Bueno',     2,2,  6500, 4000,'J-01','Sin perforaciones. Metal precioso.'],
    ['ESC-002','Silenciador Trasero',               10,'Toyota',    'Camry',    2019,'Regular',   4,2,  1200,  680,'J-02','Oxidación exterior leve.'],
    ['ESC-003','Colector de Escape',                10,'Ford',      'Focus',    2018,'Bueno',     1,1,  2800, 1600,'J-03','Sin fisuras. Juntas incluidas.'],
    // COMBUSTIBLE
    ['COM-001','Bomba de Gasolina (en tanque)',     11,'Toyota',    'Corolla',  2019,'Excelente', 4,3,  1600,  880,'K-01','Con flotador. Original Toyota.'],
    ['COM-002','Inyectores (juego x4)',             11,'Honda',     'Civic',    2018,'Bueno',     3,2,  3200, 1900,'K-02','Limpiados y calibrados. 12 meses.'],
    ['COM-003','Regulador de Presión',             11,'Nissan',    'Versa',    2020,'Excelente', 6,3,   480,  260,'K-03','OEM Nissan. Presión correcta.'],
    // NEUMÁTICOS
    ['NEU-001','Llanta 195/65R15 (x4)',            12,'Universal', 'Sedan',    2022,'Bueno',     2,2,  4800, 2900,'L-01','Michelin Energy. 80% vida útil.'],
    ['NEU-002','Rin Aluminio 15" (x4)',            12,'Toyota',    'Corolla',  2019,'Bueno',     1,1,  6400, 3800,'L-02','Aleación. Sin golpes. Color negro.'],
  ];

  const insPart = db.prepare(`
    INSERT INTO parts (sku,name,category_id,make,model,year,condition,stock,min_stock,price,cost,location,notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  parts.forEach(p => insPart.run(...p));

  // ── MOVEMENTS (últimas semanas) ──
  const insMove = db.prepare(`
    INSERT INTO movements (part_id,user_id,type,quantity,prev_stock,new_stock,reason,created_at)
    VALUES (?,?,?,?,?,?,?,datetime('now', ? || ' days'))
  `);

  const movs = [
    [1, 1,'entrada',  2, 0, 2,'Compra proveedor norte', '-14'],
    [3, 2,'entrada',  5, 0, 5,'Lote importación directa','-13'],
    [11,2,'salida',   2, 5, 3,'Venta cliente Juan Pérez','-12'],
    [5, 2,'entrada',  4, 0, 4,'Compra proveedor local',  '-11'],
    [21,1,'entrada', 10, 0,10,'Compra mayorista',         '-10'],
    [8, 2,'salida',   1, 3, 2,'Venta taller AutoFix',     '-9'],
    [23,2,'entrada',  4, 0, 4,'Compra proveedor norte',   '-8'],
    [15,2,'salida',   1, 3, 2,'Venta cliente María R.',   '-7'],
    [2, 1,'entrada',  1, 0, 1,'Adquisición desmontadora',  '-6'],
    [28,2,'salida',   1, 3, 2,'Venta taller Hernández',   '-5'],
    [33,2,'entrada',  6, 0, 6,'Compra proveedor zona sur', '-4'],
    [10,2,'ajuste',  -1, 3, 2,'Ajuste inventario físico', '-3'],
    [44,2,'salida',   2, 5, 3,'Venta cliente directa',    '-2'],
    [3, 2,'salida',   1, 5, 4,'Venta express mostrador',  '-1'],
    [19,2,'entrada',  8, 0, 8,'Compra lote desmontadora',  '0'],
  ];
  movs.forEach(m => insMove.run(...m));

  // ── ACTIVITY LOG ──
  const insAct = db.prepare(`
    INSERT INTO activity_log (user_id,action,entity,entity_id,detail,created_at)
    VALUES (?,?,?,?,?,datetime('now', ? || ' days'))
  `);
  [
    [1,'CREATE','part',  1, 'MOT-001 Motor Completo 1.6L',        '-14'],
    [2,'CREATE','part',  3, 'MOT-003 Pistones STD (juego x4)',     '-13'],
    [2,'MOVE',  'part', 11, 'Salida x2 - Discos Del. Ventilados',  '-12'],
    [1,'UPDATE','user',  3, 'Cambio rol consultor → operador',     '-10'],
    [2,'CREATE','part', 60, 'NEU-002 Rin Aluminio 15" (x4)',        '-8'],
    [2,'MOVE',  'part', 15, 'Salida x1 - Motor de Arranque',        '-7'],
    [1,'DELETE','part', 55, 'Pieza obsoleta eliminada',              '-5'],
    [2,'UPDATE','part',  3, 'Actualización precio +15%',             '-3'],
    [2,'CREATE','part', 59, 'NEU-001 Llanta 195/65R15 (x4)',         '-2'],
    [1,'LOGIN', 'user',  1, 'Inicio de sesión desde 192.168.1.10',   '0'],
  ].forEach(a => insAct.run(...a));

  console.log('✅ Datos de prueba insertados');
}

module.exports = { getDb, initDatabase };
