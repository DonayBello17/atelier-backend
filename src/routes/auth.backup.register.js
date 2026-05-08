const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  if (rows.length === 0) return res.status(401).json({ success: false, message: 'Usuario no encontrado' });

  const usuario = rows[0];
  const valido = password === usuario.password;
  if (!valido) return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });

  const token = jwt.sign(
    { id: usuario.id_usuario, nombre: usuario.nombre, rol: usuario.rol },
    process.env.JWT_SECRET || 'secreto123',
    { expiresIn: '8h' }
  );

  res.json({ success: true, token, usuario: { nombre: usuario.nombre, rol: usuario.rol } });
});

module.exports = router;
