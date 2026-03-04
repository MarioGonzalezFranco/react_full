const express = require('express');
const { getDb } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/stats/dashboard
router.get('/dashboard', (req, res) => {
  const db = getDb();

  const totals = db.prepare(`
    SELECT
      COUNT(*) as total_parts,
      SUM(stock) as total_units,
      SUM(price * stock) as total_value,
      SUM(CASE WHEN stock=0 THEN 1 ELSE 0 END) as out_of_stock,
      SUM(CASE WHEN stock>0 AND stock<=min_stock THEN 1 ELSE 0 END) as low_stock,
      SUM(CASE WHEN stock>min_stock THEN 1 ELSE 0 END) as in_stock
    FROM parts WHERE active=1
  `).get();

  const byCategory = db.prepare(`
    SELECT c.label, c.color, c.icon, COUNT(*) as count, SUM(p.stock) as units
    FROM parts p JOIN categories c ON c.id=p.category_id
    WHERE p.active=1
    GROUP BY c.id ORDER BY count DESC
  `).all();

  const byCondition = db.prepare(`
    SELECT condition, COUNT(*) as count
    FROM parts WHERE active=1 GROUP BY condition
  `).all();

  const recentMovements = db.prepare(`
    SELECT m.*, p.name as part_name, p.sku, u.name as user_name
    FROM movements m
    JOIN parts p ON p.id=m.part_id
    JOIN users u ON u.id=m.user_id
    ORDER BY m.created_at DESC LIMIT 10
  `).all();

  const topValue = db.prepare(`
    SELECT p.sku, p.name, p.price, p.stock, (p.price*p.stock) as total_value,
           c.label as cat_label, c.color
    FROM parts p JOIN categories c ON c.id=p.category_id
    WHERE p.active=1 ORDER BY total_value DESC LIMIT 5
  `).all();

  const alertLow = db.prepare(`
    SELECT p.sku, p.name, p.stock, p.min_stock, c.label as cat_label, c.color
    FROM parts p JOIN categories c ON c.id=p.category_id
    WHERE p.active=1 AND p.stock>0 AND p.stock<=p.min_stock
    ORDER BY p.stock ASC LIMIT 8
  `).all();

  const alertOut = db.prepare(`
    SELECT p.sku, p.name, p.stock, c.label as cat_label, c.color
    FROM parts p JOIN categories c ON c.id=p.category_id
    WHERE p.active=1 AND p.stock=0 LIMIT 8
  `).all();

  // Last 7 days movement counts
  const movsByDay = db.prepare(`
    SELECT date(created_at) as day,
           SUM(CASE WHEN type='entrada' THEN quantity ELSE 0 END) as entradas,
           SUM(CASE WHEN type IN ('salida','venta') THEN quantity ELSE 0 END) as salidas
    FROM movements
    WHERE created_at >= date('now','-7 days')
    GROUP BY day ORDER BY day
  `).all();

  res.json({ totals, byCategory, byCondition, recentMovements, topValue, alertLow, alertOut, movsByDay });
});

// GET /api/stats/movements
router.get('/movements', (req, res) => {
  const db = getDb();
  const { page=1, limit=20, type='', part_id='' } = req.query;
  const offset = (parseInt(page)-1)*parseInt(limit);

  let where = [];
  const params = [];
  if (type)    { where.push('m.type=?');    params.push(type); }
  if (part_id) { where.push('m.part_id=?'); params.push(part_id); }
  const ws = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as c FROM movements m ${ws}`).get(...params).c;
  const rows  = db.prepare(`
    SELECT m.*, p.name as part_name, p.sku, u.name as user_name
    FROM movements m JOIN parts p ON p.id=m.part_id JOIN users u ON u.id=m.user_id
    ${ws} ORDER BY m.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit) });
});

// GET /api/stats/categories
router.get('/categories', (req, res) => {
  const db = getDb();
  const cats = db.prepare('SELECT * FROM categories ORDER BY id').all();
  res.json(cats);
});

// GET /api/stats/activity
router.get('/activity', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT a.*, u.name as user_name, u.role as user_role
    FROM activity_log a LEFT JOIN users u ON u.id=a.user_id
    ORDER BY a.created_at DESC LIMIT 50
  `).all();
  res.json(rows);
});

module.exports = router;
