# 🚗 AutoPartes Inventario Pro

Sistema full-stack de inventario para piezas de vehículos sedán usados.

**Stack:** React 18 · Node.js/Express · MySQL

---

## 📁 Estructura del Proyecto

```
autopartes-pro/
├── backend/               ← API REST (Node + Express)
│   ├── routes/
│   │   ├── auth.js        ← Login / JWT
│   │   ├── parts.js       ← CRUD piezas
│   │   └── categories.js  ← Categorías
│   ├── middleware/
│   │   └── auth.js        ← Verificación JWT
│   ├── db.js              ← Pool de conexiones MySQL
│   ├── server.js          ← Servidor Express
│   ├── .env.example       ← Variables de entorno
│   └── package.json
├── frontend/              ← App React
│   ├── src/
│   │   ├── App.jsx        ← Componente principal
│   │   ├── api.js         ← Cliente HTTP (fetch)
│   │   └── index.js
│   ├── public/index.html
│   └── package.json
├── database/
│   └── schema.sql         ← Tablas + datos iniciales
└── README.md
```

---

## 🚀 Instalación

### 1. Base de datos MySQL

```bash
# Importar schema y datos iniciales
mysql -u root -p < database/schema.sql
```

### 2. Backend

```bash
cd backend
npm install

# Copiar y configurar variables de entorno
cp .env.example .env
# Edita .env con tus datos de MySQL

npm run dev     # Desarrollo (nodemon)
# ó
npm start       # Producción
```
API disponible en: `http://localhost:4000`

### 3. Frontend

```bash
cd frontend
npm install
npm start
```
App disponible en: `http://localhost:3000`

---

## 🔐 Credenciales de acceso

| Usuario  | Contraseña | Rol    |
|----------|------------|--------|
| admin    | admin123   | Admin  |
| editor1  | admin123   | Editor |

---

## ⚙️ Variables de Entorno (backend/.env)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=autopartes_db
JWT_SECRET=cambia_esto_por_algo_secreto
JWT_EXPIRES_IN=8h
PORT=4000
NODE_ENV=development
```

---

## 📡 Endpoints API

| Método | Ruta                    | Descripción                        |
|--------|-------------------------|------------------------------------|
| POST   | /api/auth/login         | Login → devuelve JWT               |
| GET    | /api/auth/me            | Usuario actual (requiere JWT)      |
| GET    | /api/parts              | Lista piezas (filtros + paginación)|
| GET    | /api/parts/stats        | Estadísticas del inventario        |
| GET    | /api/parts/:id          | Detalle de una pieza               |
| POST   | /api/parts              | Crear pieza                        |
| PUT    | /api/parts/:id          | Actualizar pieza                   |
| PATCH  | /api/parts/:id/stock    | Actualizar solo el stock           |
| DELETE | /api/parts/:id          | Eliminar (soft delete)             |
| GET    | /api/categories         | Lista categorías                   |

### Parámetros GET /api/parts

| Param        | Ejemplo           | Descripción               |
|--------------|-------------------|---------------------------|
| search       | `motor`           | Busca en SKU/nombre/marca |
| category     | `motor`           | Filtra por categoría      |
| condition    | `Bueno`           | Filtra por condición      |
| stock_status | `low` / `out`     | Filtra por nivel de stock |
| sort_by      | `price`           | Columna de ordenamiento   |
| sort_dir     | `ASC` / `DESC`    | Dirección                 |
| page         | `1`               | Página actual             |
| per_page     | `12`              | Resultados por página     |

---

## 🗄️ Tablas MySQL

- **users** — Usuarios del sistema con roles (admin/editor/viewer)
- **categories** — Categorías de piezas (motor, frenos, etc.)
- **vehicle_makes** — Marcas de vehículos
- **parts** — Piezas del inventario (con soft delete)
- **stock_movements** — Historial de movimientos de inventario

---

## 🏗️ Build producción

```bash
# Frontend
cd frontend && npm run build

# Servir el build desde Express (agregar al server.js)
app.use(express.static(path.join(__dirname, '../frontend/build')));
```
