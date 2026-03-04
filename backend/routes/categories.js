const router = require("express").Router();
const db   = require("../db");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM categories ORDER BY label");
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
