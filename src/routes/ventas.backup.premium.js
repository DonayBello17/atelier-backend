const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT v.*, c.nombre as cliente
    FROM ventas v
    LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
    ORDER BY v.fecha DESC
  `);
  res.json({ success: true, data: rows });
});

router.post('/', async (req, res) => {
  const { id_cliente, detalles } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const total = detalles.reduce((sum, d) => sum + d.cantidad * d.precio_unitario, 0);
    const [result] = await conn.query(
      'INSERT INTO ventas (id_cliente, total) VALUES (?, ?)',
      [id_cliente, total]
    );
    const id_venta = result.insertId;
    for (const d of detalles) {
      await conn.query(
        'INSERT INTO detalle_ventas (id_venta, id_inventario, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [id_venta, d.id_inventario, d.cantidad, d.precio_unitario]
      );
      await conn.query(
        'UPDATE inventario SET stock = stock - ? WHERE id_inventario = ?',
        [d.cantidad, d.id_inventario]
      );
    }
    await conn.commit();
    res.json({ success: true, id_venta });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

router.get('/:id/detalles', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT dv.*, p.nombre as producto, t.nombre_talla as talla, i.color
    FROM detalle_ventas dv
    JOIN inventario i ON dv.id_inventario = i.id_inventario
    JOIN productos p ON i.id_producto = p.id_producto
    JOIN tallas t ON i.id_talla = t.id_talla
    WHERE dv.id_venta = ?
  `, [req.params.id]);
  res.json({ success: true, data: rows });
});

module.exports = router;
