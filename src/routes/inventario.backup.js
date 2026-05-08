const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT i.*, p.nombre as producto, t.nombre_talla as talla
    FROM inventario i
    JOIN productos p ON i.id_producto = p.id_producto
    JOIN tallas t ON i.id_talla = t.id_talla
  `);
  res.json({ success: true, data: rows });
});

module.exports = router;