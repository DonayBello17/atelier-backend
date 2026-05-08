const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM clientes');
  res.json({ success: true, data: rows });
});

router.post('/', async (req, res) => {
  const { nombre, email, telefono } = req.body;
  const [result] = await pool.query(
    'INSERT INTO clientes (nombre, email, telefono) VALUES (?, ?, ?)',
    [nombre, email, telefono]
  );
  res.json({ success: true, id: result.insertId });
});

router.put('/:id', async (req, res) => {
  const { nombre, email, telefono } = req.body;
  await pool.query(
    'UPDATE clientes SET nombre=?, email=?, telefono=? WHERE id_cliente=?',
    [nombre, email, telefono, req.params.id]
  );
  res.json({ success: true });
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM clientes WHERE id_cliente = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;