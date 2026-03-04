const express = require('express');
const bcrypt  = require('bcryptjs');
const { getDb } = require('../database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/users
router.get('/', adminOnly, (req, res) => {
  const db = getDb();
  const users = db.prepare(
    'SELECT id,username,name,email,role,active,created_at,last_login FROM users ORDER BY id'
  ).all();
  res.json(users);
});

// POST /api/users
router.post('/', adminOnly, (req, res) => {
  const db = getDb();
  const { username, password, name, email, role } = req.body;
  if (!username||!password||!name||!email)
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  if (!['admin','operador','consultor'].includes(role))
    return res.status(400).json({ error: 'Rol inválido' });

  const dup = db.prepare('SELECT id FROM users WHERE username=? OR email=?').get(username, email);
  if (dup) return res.status(409).json({ error: 'Usuario o email ya existe' });

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username,password,name,email,role) VALUES (?,?,?,?,?)'
  ).run(username, hashed, name, email, role||'operador');

  db.prepare(`INSERT INTO activity_log (user_id,action,entity,entity_id,detail) VALUES (?,?,?,?,?)`)
    .run(req.user.id, 'CREATE', 'user', result.lastInsertRowid, `Nuevo usuario: ${username} (${role})`);

  const user = db.prepare('SELECT id,username,name,email,role,active,created_at FROM users WHERE id=?').get(result.lastInsertRowid);
  res.status(201).json(user);
});

// PUT /api/users/:id
router.put('/:id', adminOnly, (req, res) => {
  const db  = getDb();
  const old = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  if (!old) return res.status(404).json({ error: 'Usuario no encontrado' });

  // Prevent disabling yourself
  if (parseInt(req.params.id) === req.user.id && req.body.active === 0)
    return res.status(400).json({ error: 'No puedes desactivarte a ti mismo' });

  const { name, email, role, active, password } = req.body;
  const newPass = password ? bcrypt.hashSync(password, 10) : old.password;

  db.prepare(`UPDATE users SET name=?,email=?,role=?,active=?,password=? WHERE id=?`)
    .run(name||old.name, email||old.email, role||old.role,
         active!==undefined?active:old.active, newPass, req.params.id);

  db.prepare(`INSERT INTO activity_log (user_id,action,entity,entity_id,detail) VALUES (?,?,?,?,?)`)
    .run(req.user.id, 'UPDATE', 'user', req.params.id, `Actualización usuario: ${old.username}`);

  const updated = db.prepare('SELECT id,username,name,email,role,active,created_at FROM users WHERE id=?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/users/:id (desactivar)
router.delete('/:id', adminOnly, (req, res) => {
  const db  = getDb();
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  db.prepare('UPDATE users SET active=0 WHERE id=?').run(req.params.id);
  db.prepare(`INSERT INTO activity_log (user_id,action,entity,entity_id,detail) VALUES (?,?,?,?,?)`)
    .run(req.user.id, 'DELETE', 'user', req.params.id, `Usuario desactivado: ${user.username}`);

  res.json({ message: 'Usuario desactivado' });
});

module.exports = router;
