const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM tallas');
  res.json({ success: true, data: rows });
});

router.post('/', async (req, res) => {
  const { nombre_talla } = req.body;
  const [result] = await pool.query('INSERT INTO tallas (nombre_talla) VALUES (?)', [nombre_talla]);
  res.json({ success: true, id: result.insertId });
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM tallas WHERE id_talla = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
