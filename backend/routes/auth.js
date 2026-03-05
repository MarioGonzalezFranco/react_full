const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const db     = require("../db");

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ ok: false, message: "Usuario y contraseña requeridos" });

  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ? AND active = 1 LIMIT 1",
      [username]
    );
    if (!rows.length)
      return res.status(401).json({ ok: false, message: "Credenciales incorrectas" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ ok: false, message: "Credenciales incorrectas" });

    // Update last login
    await db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    res.json({
      ok: true,
      token,
      user: { id: user.id, username: user.username, name: user.full_name, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Error del servidor" });
  }
});

// GET /api/auth/me  (protected)
const auth = require("../middleware/auth");
router.get("/me", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, full_name, role, last_login FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
    res.json({ ok: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Error del servidor" });
  }
});

module.exports = router;
