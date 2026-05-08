const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        t.id_talla,
        t.nombre_talla,
        COUNT(i.id_inventario) AS usos,
        COALESCE(SUM(i.stock), 0) AS stock_total
      FROM tallas t
      LEFT JOIN inventario i ON t.id_talla = i.id_talla
      GROUP BY t.id_talla, t.nombre_talla
      ORDER BY t.id_talla ASC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Error al obtener tallas:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener tallas',
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre_talla } = req.body;

    if (!nombre_talla) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la talla es obligatorio',
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO tallas
        (nombre_talla)
      VALUES
        (?)
      `,
      [nombre_talla.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Talla creada correctamente',
      id_talla: result.insertId,
    });
  } catch (error) {
    console.error('Error al crear talla:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear talla',
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_talla } = req.body;

    if (!nombre_talla) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la talla es obligatorio',
      });
    }

    const [result] = await pool.query(
      `
      UPDATE tallas
      SET nombre_talla = ?
      WHERE id_talla = ?
      `,
      [nombre_talla.trim(), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Talla no encontrada',
      });
    }

    res.json({
      success: true,
      message: 'Talla actualizada correctamente',
    });
  } catch (error) {
    console.error('Error al actualizar talla:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar talla',
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [usos] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM inventario
      WHERE id_talla = ?
      `,
      [id]
    );

    if (Number(usos[0].total) > 0) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar una talla que está usada en inventario',
      });
    }

    const [result] = await pool.query(
      `
      DELETE FROM tallas
      WHERE id_talla = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Talla no encontrada',
      });
    }

    res.json({
      success: true,
      message: 'Talla eliminada correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar talla:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar talla',
    });
  }
});

module.exports = router;
