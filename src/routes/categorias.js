const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM categorias');
  res.json({ success: true, data: rows });
});

module.exports = router;