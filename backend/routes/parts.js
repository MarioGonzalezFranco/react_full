const router = require("express").Router();
const db     = require("../db");
const auth   = require("../middleware/auth");
const { body, query, param, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ ok: false, errors: errors.array() });
  next();
};

// ── GET /api/parts  (with search, filter, sort, pagination) ──
router.get("/", auth, async (req, res) => {
  try {
    const {
      search = "", category = "", condition = "", stock_status = "",
      sort_by = "name", sort_dir = "ASC",
      page = 1, per_page = 12,
    } = req.query;

    const allowedSort = ["sku","name","category","make","model","year","condition","stock","price","location","created_at"];
    const col = allowedSort.includes(sort_by) ? sort_by : "name";
    const dir = sort_dir.toUpperCase() === "DESC" ? "DESC" : "ASC";

    const params = [];
    let where = "WHERE p.deleted_at IS NULL";

    if (search) {
      where += " AND (p.sku LIKE ? OR p.name LIKE ? OR p.make LIKE ? OR p.model LIKE ? OR p.notes LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }
    if (category)  { where += " AND p.category = ?";  params.push(category); }
    if (condition) { where += " AND p.condition_status = ?"; params.push(condition); }
    if (stock_status === "out")  { where += " AND p.stock = 0"; }
    if (stock_status === "low")  { where += " AND p.stock > 0 AND p.stock <= 2"; }
    if (stock_status === "ok")   { where += " AND p.stock > 2"; }

    const offset = (parseInt(page) - 1) * parseInt(per_page);

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM parts p ${where}`, params
    );

    const [rows] = await db.query(
      `SELECT p.*, c.label AS category_label, c.icon AS category_icon, c.color AS category_color
       FROM parts p
       LEFT JOIN categories c ON p.category = c.id
       ${where}
       ORDER BY p.${col} ${dir}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(per_page), offset]
    );

    res.json({ ok: true, data: rows, total, page: parseInt(page), per_page: parseInt(per_page) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── GET /api/parts/stats ──
router.get("/stats", auth, async (req, res) => {
  try {
    const [[row]] = await db.query(`
      SELECT
        COUNT(*)                                    AS total,
        SUM(stock > 0)                              AS in_stock,
        SUM(stock > 0 AND stock <= 2)               AS low_stock,
        SUM(stock = 0)                              AS out_stock,
        COALESCE(SUM(price * stock), 0)             AS total_value,
        COUNT(DISTINCT category)                    AS categories_used,
        COUNT(DISTINCT make)                        AS makes_count
      FROM parts WHERE deleted_at IS NULL
    `);
    const [byCategory] = await db.query(`
      SELECT c.id, c.label, c.icon, c.color, COUNT(p.id) AS count, COALESCE(SUM(p.stock),0) AS units
      FROM categories c
      LEFT JOIN parts p ON p.category = c.id AND p.deleted_at IS NULL
      GROUP BY c.id ORDER BY count DESC
    `);
    res.json({ ok: true, stats: row, by_category: byCategory });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── GET /api/parts/:id ──
router.get("/:id", auth, param("id").isInt(), validate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.label AS category_label, c.icon AS category_icon, c.color AS category_color
       FROM parts p LEFT JOIN categories c ON p.category = c.id
       WHERE p.id = ? AND p.deleted_at IS NULL`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, message: "Pieza no encontrada" });
    res.json({ ok: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── POST /api/parts ──
const partRules = [
  body("sku").trim().notEmpty().withMessage("SKU requerido"),
  body("name").trim().notEmpty().withMessage("Nombre requerido"),
  body("category").notEmpty(),
  body("make").notEmpty(),
  body("model").trim().notEmpty().withMessage("Modelo requerido"),
  body("year").isInt({ min: 1970, max: 2030 }),
  body("condition_status").isIn(["Excelente","Bueno","Regular","Para reparar"]),
  body("stock").isInt({ min: 0 }),
  body("price").isFloat({ min: 0 }),
  body("location").trim().notEmpty().withMessage("Ubicación requerida"),
];

router.post("/", auth, partRules, validate, async (req, res) => {
  const { sku, name, category, make, model, year, condition_status, stock, price, location, notes } = req.body;
  try {
    const [dup] = await db.query("SELECT id FROM parts WHERE sku = ? AND deleted_at IS NULL", [sku]);
    if (dup.length) return res.status(409).json({ ok: false, message: `El SKU "${sku}" ya existe` });

    const [result] = await db.query(
      `INSERT INTO parts (sku, name, category, make, model, year, condition_status, stock, price, location, notes, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [sku, name, category, make, model, year, condition_status, stock, price, location, notes || "", req.user.id]
    );
    const [rows] = await db.query("SELECT p.*, c.label AS category_label, c.icon, c.color FROM parts p LEFT JOIN categories c ON p.category=c.id WHERE p.id=?", [result.insertId]);
    res.status(201).json({ ok: true, data: rows[0], message: "Pieza registrada correctamente" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── PUT /api/parts/:id ──
router.put("/:id", auth, param("id").isInt(), partRules, validate, async (req, res) => {
  const { sku, name, category, make, model, year, condition_status, stock, price, location, notes } = req.body;
  try {
    const [exists] = await db.query("SELECT id FROM parts WHERE id = ? AND deleted_at IS NULL", [req.params.id]);
    if (!exists.length) return res.status(404).json({ ok: false, message: "Pieza no encontrada" });

    const [dup] = await db.query("SELECT id FROM parts WHERE sku = ? AND id != ? AND deleted_at IS NULL", [sku, req.params.id]);
    if (dup.length) return res.status(409).json({ ok: false, message: `El SKU "${sku}" ya está en uso` });

    await db.query(
      `UPDATE parts SET sku=?, name=?, category=?, make=?, model=?, year=?,
       condition_status=?, stock=?, price=?, location=?, notes=?, updated_by=?, updated_at=NOW()
       WHERE id=?`,
      [sku, name, category, make, model, year, condition_status, stock, price, location, notes || "", req.user.id, req.params.id]
    );
    const [rows] = await db.query("SELECT p.*, c.label AS category_label, c.icon, c.color FROM parts p LEFT JOIN categories c ON p.category=c.id WHERE p.id=?", [req.params.id]);
    res.json({ ok: true, data: rows[0], message: "Pieza actualizada correctamente" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── PATCH /api/parts/:id/stock  (quick stock update) ──
router.patch("/:id/stock", auth, [
  param("id").isInt(),
  body("stock").isInt({ min: 0 }),
], validate, async (req, res) => {
  try {
    await db.query("UPDATE parts SET stock=?, updated_by=?, updated_at=NOW() WHERE id=? AND deleted_at IS NULL",
      [req.body.stock, req.user.id, req.params.id]);
    res.json({ ok: true, message: "Stock actualizado" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── DELETE /api/parts/:id  (soft delete) ──
router.delete("/:id", auth, param("id").isInt(), validate, async (req, res) => {
  try {
    const [exists] = await db.query("SELECT id, name FROM parts WHERE id = ? AND deleted_at IS NULL", [req.params.id]);
    if (!exists.length) return res.status(404).json({ ok: false, message: "Pieza no encontrada" });

    await db.query("UPDATE parts SET deleted_at=NOW(), deleted_by=? WHERE id=?", [req.user.id, req.params.id]);
    res.json({ ok: true, message: `"${exists[0].name}" eliminado correctamente` });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
